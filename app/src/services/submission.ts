/* eslint-disable no-useless-catch */
import axios from 'axios';
import config from 'config';
import { Prisma } from '@prisma/client';

import prisma from '../db/dataConnection';
import { submission } from '../db/models';
import { BasicResponse, Initiative } from '../utils/enums/application';
import { ApplicationStatus } from '../utils/enums/housing';
import { getChefsApiKey } from '../utils/utils';

import type { AxiosInstance, AxiosRequestConfig } from 'axios';
import type { IStamps } from '../interfaces/IStamps';
import type { Submission, SubmissionSearchParameters } from '../types';

/**
 * @function chefsAxios
 * Returns an Axios instance for the CHEFS API
 * @param {AxiosRequestConfig} options Axios request config options
 * @returns {AxiosInstance} An axios instance
 */
function chefsAxios(formId: string, options: AxiosRequestConfig = {}): AxiosInstance {
  return axios.create({
    baseURL: config.get('server.chefs.apiPath'),
    timeout: 10000,
    auth: { username: formId, password: getChefsApiKey(formId) ?? '' },
    ...options
  });
}

const service = {
  /**
   * @function createSubmission
   * Creates a new submission
   * @returns {Promise<Partial<Submission>>} The result of running the transaction
   */
  createSubmission: async (data: Partial<Submission>) => {
    const s = submission.toPrismaModel(data as Submission);
    const response = await prisma.submission.create({
      data: {
        ...s,
        geo_json: s.geo_json as Prisma.InputJsonValue,
        created_at: data.createdAt,
        created_by: data.createdBy
      },
      include: {
        activity: {
          include: {
            activity_contact: {
              include: {
                contact: true
              }
            }
          }
        }
      }
    });
    return submission.fromPrismaModelWithContact(response);
  },

  /**
   * @function createSubmissionsFromExport
   * Creates the given activities and submissions from exported CHEFS data
   * @param {Array<Partial<Submission>>} submissions Array of Submissions
   * @returns {Promise<void>} The result of running the transaction
   */
  createSubmissionsFromExport: async (submissions: Array<Partial<Submission>>) => {
    await prisma.$transaction(async (trx) => {
      const initiative = await trx.initiative.findFirstOrThrow({
        where: {
          code: Initiative.HOUSING
        }
      });

      await trx.activity.createMany({
        data: submissions.map((x) => ({
          activity_id: x.activityId as string,
          initiative_id: initiative.initiative_id,
          is_deleted: false
        }))
      });

      await trx.submission.createMany({
        data: submissions.map((x) => ({
          submission_id: x.submissionId as string,
          activity_id: x.activityId as string,
          application_status: ApplicationStatus.NEW,
          company_name_registered: x.companyNameRegistered,
          financially_supported: x.financiallySupported,
          financially_supported_bc: x.financiallySupportedBC,
          financially_supported_indigenous: x.financiallySupportedIndigenous,
          financially_supported_non_profit: x.financiallySupportedNonProfit,
          financially_supported_housing_coop: x.financiallySupportedHousingCoop,
          has_applied_provincial_permits: x.hasAppliedProvincialPermits,
          housing_coop_description: x.housingCoopDescription,
          indigenous_description: x.indigenousDescription,
          project_applicant_type: x.projectApplicantType,
          is_developed_in_bc: x.isDevelopedInBC,
          intake_status: x.intakeStatus,
          location_pids: x.locationPIDs,
          latitude: parseFloat(x.latitude as unknown as string),
          locality: x.locality,
          longitude: parseFloat(x.longitude as unknown as string),
          natural_disaster: x.naturalDisaster === BasicResponse.YES ? true : false,
          non_profit_description: x.nonProfitDescription,
          project_location: x.projectLocation,
          project_name: x.projectName,
          project_description: x.projectDescription,
          province: x.province,
          queue_priority: x.queuePriority,
          rental_units: x.rentalUnits?.toString(),
          single_family_units: x.singleFamilyUnits,
          multi_family_units: x.multiFamilyUnits,
          other_units: x.otherUnits,
          other_units_description: x.otherUnitsDescription,
          has_rental_units: x.hasRentalUnits,
          street_address: x.streetAddress,
          submitted_at: new Date(x.submittedAt ?? Date.now()),
          submitted_by: x.submittedBy as string
        }))
      });
    });
  },

  /**
   * @function deleteSubmission
   * Deletes the submission, followed by the associated activity
   * This action will cascade delete across all linked items
   * @param {string} submissionId Submission ID
   * @returns {Promise<Submission>} The result of running the delete operation
   */
  deleteSubmission: async (submissionId: string) => {
    const response = await prisma.$transaction(async (trx) => {
      const del = await trx.submission.delete({
        where: {
          submission_id: submissionId
        },
        include: {
          activity: {
            include: {
              activity_contact: {
                include: {
                  contact: true
                }
              }
            }
          }
        }
      });

      await trx.activity.delete({
        where: {
          activity_id: del.activity_id
        }
      });

      return del;
    });

    return submission.fromPrismaModelWithContact(response);
  },

  /**
   * @function getSubmission
   * Gets a full data export for the requested CHEFS form
   * @param {string} formId CHEFS form id
   * @returns {Promise<any>} The result of running the get operation
   */
  getFormExport: async (formId: string) => {
    try {
      const response = await chefsAxios(formId).get(`forms/${formId}/export`, {
        params: { format: 'json', type: 'submissions' }
      });
      return response.data;
    } catch (e: unknown) {
      throw e;
    }
  },

  /**
   * @function getStatistics
   * Gets a set of submission related statistics
   * @returns {Promise<object>} The result of running the query
   */
  getStatistics: async (filters: { dateFrom: string; dateTo: string; monthYear: string; userId: string }) => {
    // Return a single quoted string or null for the given value
    const val = (value: unknown) => (value ? `'${value}'` : null);

    const date_from = val(filters.dateFrom);
    const date_to = val(filters.dateTo);
    const month_year = val(filters.monthYear);
    const user_id = filters.userId?.length ? filters.userId : null;

    /* eslint-disable max-len */
    const response =
      await prisma.$queryRaw`select * from get_activity_statistics(${date_from}, ${date_to}, ${month_year}, ${user_id}::uuid)`;
    /* eslint-enable max-len */

    // count() returns BigInt
    // JSON.stringify() doesn't know how to serialize BigInt
    // https://github.com/GoogleChromeLabs/jsbi/issues/30#issuecomment-521460510
    return JSON.parse(JSON.stringify(response, (_key, value) => (typeof value === 'bigint' ? Number(value) : value)));
  },

  /**
   * @function getSubmission
   * Gets a specific submission from the PCNS database
   * @param {string} submissionId PCNS Submission ID
   * @returns {Promise<Submission | null>} The result of running the findFirst operation
   */
  getSubmission: async (submissionId: string) => {
    try {
      const result = await prisma.submission.findFirst({
        where: {
          submission_id: submissionId
        },
        include: {
          activity: {
            include: {
              activity_contact: {
                include: {
                  contact: true
                }
              }
            }
          }
        }
      });

      return result ? submission.fromPrismaModelWithContact(result) : null;
    } catch (e: unknown) {
      throw e;
    }
  },

  /**
   * @function getSubmissions
   * Gets a list of submissions
   * @returns {Promise<(Submission | null)[]>} The result of running the findMany operation
   */
  getSubmissions: async () => {
    try {
      const result = await prisma.submission.findMany({
        include: {
          activity: {
            include: {
              activity_contact: {
                include: {
                  contact: true
                }
              }
            }
          },
          user: true
        },
        orderBy: {
          created_at: 'desc'
        }
      });

      return result.map((x) => submission.fromPrismaModelWithUser(x));
    } catch (e: unknown) {
      throw e;
    }
  },

  /**
   * @function searchSubmissions
   * Search and filter for specific submission
   * @param {string[]} [params.activityId] Optional array of uuids representing the activity ID
   * @param {string[]} [params.intakeStatus] Optional array of strings representing the intake status
   * @param {boolean}  [params.includeDeleted] Optional bool representing whether deleted submissions should be included
   * @param {boolean}  [params.includeUser] Optional boolean representing whether the linked user should be included
   * @param {string[]} [params.submissionId] Optional array of uuids representing the submission ID
   * @param {string[]} [params.submissionType] Optional array of strings representing the submission type
   * @returns {Promise<(Submission | null)[]>} The result of running the findMany operation
   */
  searchSubmissions: async (params: SubmissionSearchParameters) => {
    let result = await prisma.submission.findMany({
      include: {
        activity: {
          include: {
            activity_contact: {
              include: {
                contact: true
              }
            }
          }
        },
        user: params.includeUser
      },
      where: {
        AND: [
          {
            activity_id: { in: params.activityId }
          },
          {
            intake_status: { in: params.intakeStatus }
          },
          {
            submission_id: { in: params.submissionId }
          },
          {
            submission_type: { in: params.submissionType }
          },
          params.includeDeleted ? {} : { activity: { is_deleted: false } }
        ]
      }
    });

    // Remove soft deleted submissions
    if (!params.includeDeleted) result = result.filter((x) => !x.activity.is_deleted);

    const submissions = params.includeUser
      ? result.map((x) => submission.fromPrismaModelWithUser(x))
      : result.map((x) => submission.fromPrismaModelWithContact(x));

    return submissions;
  },

  /**
   * @function updateIsDeletedFlag
   * Updates is_deleted flag for the corresponding activity
   * @param {string} submissionId Submission ID
   * @param {string} isDeleted flag
   * @returns {Promise<Submission>} The result of running the delete operation
   */
  updateIsDeletedFlag: async (submissionId: string, isDeleted: boolean, updateStamp: Partial<IStamps>) => {
    const deleteSubmission = await prisma.submission.findUnique({
      where: {
        submission_id: submissionId
      },
      include: {
        activity: {
          include: {
            activity_contact: {
              include: {
                contact: true
              }
            }
          }
        }
      }
    });

    if (deleteSubmission) {
      await prisma.activity.update({
        data: { is_deleted: isDeleted, updated_at: updateStamp.updatedAt, updated_by: updateStamp.updatedBy },
        where: {
          activity_id: deleteSubmission?.activity_id
        }
      });
      return submission.fromPrismaModelWithContact(deleteSubmission);
    }
  },

  /**
   * @function updateSubmission
   * Updates a specific submission
   * @param {Submission} data Submission to update
   * @returns {Promise<Submission | null>} The result of running the update operation
   */
  updateSubmission: async (data: Submission) => {
    try {
      const s = submission.toPrismaModel(data);
      const result = await prisma.submission.update({
        data: {
          ...s,
          geo_json: s.geo_json as Prisma.InputJsonValue,
          updated_at: data.updatedAt,
          updated_by: data.updatedBy
        },
        where: {
          submission_id: data.submissionId
        },
        include: {
          activity: {
            include: {
              activity_contact: {
                include: {
                  contact: true
                }
              }
            }
          }
        }
      });
      return submission.fromPrismaModelWithContact(result);
    } catch (e: unknown) {
      throw e;
    }
  }
};

export default service;
