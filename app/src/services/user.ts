import jwt from 'jsonwebtoken';
import { Prisma } from '@prisma/client';
import { v4 as uuidv4, NIL } from 'uuid';

import prisma from '../db/dataConnection';
import { identity_provider, user } from '../db/models';
import { parseIdentityKeyClaims } from '../components/utils';

import type { User, UserSearchParameters } from '../types';

const trxWrapper = (etrx: Prisma.TransactionClient | undefined = undefined) => (etrx ? etrx : prisma);

/**
 * The User DB Service
 */
const service = {
  /**
   * @function _tokenToUser
   * Transforms JWT payload contents into a User Model object
   * @param {object} token The decoded JWT payload
   * @returns {object} An equivalent User model object
   */
  _tokenToUser: (token: jwt.JwtPayload) => {
    const identityId = parseIdentityKeyClaims()
      .map((idKey) => token[idKey])
      .filter((claims) => claims) // Drop falsy values from array
      .concat(undefined)[0]; // Set undefined as last element of array

    return {
      identityId: identityId,
      username: token.identity_provider_identity ? token.identity_provider_identity : token.preferred_username,
      firstName: token.given_name,
      fullName: token.name,
      lastName: token.family_name,
      email: token.email,
      idp: token.identity_provider,
      active: true
    };
  },

  /**
   * @function createIdp
   * Create an identity provider record
   * @param {string} idp The identity provider code
   * @param {object} [etrx=undefined] An optional Prisma Transaction object
   * @returns {Promise<object>} The result of running the insert operation
   * @throws The error encountered upon db transaction failure
   */
  createIdp: async (idp: string, etrx: Prisma.TransactionClient | undefined = undefined) => {
    const obj = {
      idp: idp,
      active: true,
      createdBy: NIL
    };

    const response = trxWrapper(etrx).identity_provider.create({ data: identity_provider.toPrismaModel(obj) });

    return response;
  },

  /**
   * @function createUser
   * Create a user DB record
   * @param {object} data Incoming user data
   * @param {object} [etrx=undefined] An optional Prisma Transaction object
   * @returns {Promise<object>} The result of running the insert operation
   * @throws The error encountered upon db transaction failure
   */
  createUser: async (data: User, etrx: Prisma.TransactionClient | undefined = undefined) => {
    let response;

    // Logical function
    const _createUser = async (data: User, trx: Prisma.TransactionClient) => {
      const exists = await trx.user.findFirst({
        where: {
          identity_id: data.identityId,
          idp: data.idp
        }
      });

      if (exists) {
        response = exists;
      } else {
        if (data.idp) {
          const identityProvider = await service.readIdp(data.idp, trx);
          if (!identityProvider) await service.createIdp(data.idp, trx);
        }

        const newUser = {
          userId: uuidv4(),
          identityId: data.identityId,
          username: data.username,
          fullName: data.fullName,
          email: data.email,
          firstName: data.firstName,
          lastName: data.lastName,
          idp: data.idp,
          createdBy: data.userId,
          active: true
        };

        response = await trx.user.create({
          data: user.toPrismaModel(newUser)
        });
      }
    };

    // Call with proper transaction
    if (etrx) {
      await _createUser(data, etrx);
    } else {
      await prisma.$transaction(async (trx) => {
        await _createUser(data, trx);
      });
    }

    return response;
  },

  /**
   * @function getCurrentUserId
   * Gets userId (primary identifier of a user in db) of currentUser.
   * if request is basic auth returns `defaultValue`
   * @param {object} identityId the identity field of the current user
   * @param {string} [defaultValue=undefined] An optional default return value
   * @returns {string} The current userId if applicable, or `defaultValue`
   */
  getCurrentUserId: async (identityId: string, defaultValue: string | undefined = undefined) => {
    // TODO: Consider conditionally skipping when identityId is undefined?
    const user = await prisma.user.findFirst({
      where: {
        identity_id: identityId
      }
    });

    return user && user.user_id ? user.user_id : defaultValue;
  },

  /**
   * @function listIdps
   * Lists all known identity providers
   * @param {boolean} [active] Optional boolean on user active status
   * @returns {Promise<object>} The result of running the find operation
   */
  listIdps: (active: boolean) => {
    return prisma.identity_provider.findMany({
      where: {
        active: active
      }
    });
  },

  /**
   * @function login
   * Parse the user token and update the user table if necessary
   * @param {object} token The decoded JWT token payload
   * @returns {Promise<object>} The result of running the login operation
   */
  login: async (token: jwt.JwtPayload) => {
    const newUser = service._tokenToUser(token);

    let response;
    await prisma.$transaction(async (trx) => {
      const oldUser = await trx.user.findFirst({
        where: {
          identity_id: newUser.identityId,
          idp: newUser.idp
        }
      });

      if (!oldUser) {
        response = await service.createUser(newUser, trx);
      } else {
        response = await service.updateUser(oldUser.user_id, newUser, trx);
      }
    });

    return response;
  },

  /**
   * @function readIdp
   * Gets an identity provider record
   * @param {string} code The identity provider code
   * @param {object} [etrx=undefined] An optional Prisma Transaction object
   * @returns {Promise<object>} The result of running the find operation
   * @throws The error encountered upon db transaction failure
   */
  readIdp: async (code: string, etrx: Prisma.TransactionClient | undefined = undefined) => {
    const response = await trxWrapper(etrx).identity_provider.findUnique({
      where: {
        idp: code
      }
    });

    return identity_provider.fromPrismaModel(response);
  },

  /**
   * @function readUser
   * Gets a user record
   * @param {string} userId The userId uuid
   * @returns {Promise<object>} The result of running the find operation
   * @throws If no record is found
   */
  readUser: async (userId: string) => {
    const response = await prisma.user.findUnique({
      where: {
        user_id: userId
      }
    });

    return response ? user.fromPrismaModel(response) : null;
  },

  /**
   * @function searchUsers
   * Search and filter for specific users
   * @param {string[]} [params.userId] Optional array of uuids representing the user subject
   * @param {string[]} [params.identityId] Optionalarray of uuids representing the user identity
   * @param {string[]} [params.idp] Optional array of identity providers
   * @param {string} [params.username] Optional username string to match on
   * @param {string} [params.email] Optional email string to match on
   * @param {string} [params.firstName] Optional firstName string to match on
   * @param {string} [params.fullName] Optional fullName string to match on
   * @param {string} [params.lastName] Optional lastName string to match on
   * @param {boolean} [params.active] Optional boolean on user active status
   * @returns {Promise<object>} The result of running the find operation
   */
  searchUsers: async (params: UserSearchParameters) => {
    const response = await prisma.user.findMany({
      where: {
        OR: [
          {
            user_id: { in: params.userId }
          },
          {
            identity_id: { in: params.identityId }
          },
          {
            idp: { in: params.idp, mode: 'insensitive' }
          },
          {
            username: { contains: params.username, mode: 'insensitive' }
          },
          {
            email: { contains: params.email, mode: 'insensitive' }
          },
          {
            first_name: { contains: params.firstName, mode: 'insensitive' }
          },
          {
            full_name: { contains: params.fullName, mode: 'insensitive' }
          },
          {
            last_name: { contains: params.lastName, mode: 'insensitive' }
          },
          {
            active: params.active
          }
        ]
      }
    });

    return response.map((x) => user.fromPrismaModel(x));
  },

  /**
   * @function updateUser
   * Updates a user record only if there are changed values
   * @param {string} userId The userId uuid
   * @param {object} data Incoming user data
   * @param {object} [etrx=undefined] An optional Prisma Transaction object
   * @returns {Promise<object>} The result of running the patch operation
   * @throws The error encountered upon db transaction failure
   */
  updateUser: async (userId: string, data: User, etrx: Prisma.TransactionClient | undefined = undefined) => {
    // Check if any user values have changed
    const oldUser = await service.readUser(userId);
    const diff = Object.entries(data).some(([key, value]) => oldUser && oldUser[key as keyof User] !== value);

    let response;

    if (diff) {
      const _updateUser = async (userId: string, data: User, trx: Prisma.TransactionClient | undefined = undefined) => {
        // Patch existing user
        if (data.idp) {
          const identityProvider = await service.readIdp(data.idp, trx);
          if (!identityProvider) await service.createIdp(data.idp, trx);
        }

        const obj = {
          identityId: data.identityId,
          username: data.username,
          fullName: data.fullName,
          email: data.email,
          firstName: data.firstName,
          lastName: data.lastName,
          idp: data.idp,
          active: data.active,
          updatedBy: data.updatedBy
        };

        // TODO: Add support for updating userId primary key in the event it changes
        response = await trx?.user.update({
          data: { ...user.toPrismaModel(obj), updated_by: obj.updatedBy },
          where: {
            user_id: userId
          }
        });
      };

      // Call with proper transaction
      if (etrx) {
        await _updateUser(userId, data, etrx);
      } else {
        await prisma.$transaction(async (trx) => {
          await _updateUser(userId, data, trx);
        });
      }

      return response;
    } else {
      // Nothing to update
      return oldUser;
    }
  }
};

export default service;
