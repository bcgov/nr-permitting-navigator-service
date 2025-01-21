import Joi from 'joi';

import { appliedPermit } from './appliedPermit';
import { basicIntake } from './basic';
import { activityId, email, uuidv4 } from './common';
import { contacts } from './contact';

import { housing } from './housing';
import { permits } from './permits';
import { validate } from '../middleware/validation';
import { YES_NO_LIST, YES_NO_UNSURE_LIST } from '../utils/constants/application';
import {
  APPLICATION_STATUS_LIST,
  INTAKE_STATUS_LIST,
  NUM_RESIDENTIAL_UNITS_LIST,
  SUBMISSION_TYPE_LIST
} from '../utils/constants/housing';
import { BasicResponse } from '../utils/enums/application';
import { IntakeStatus } from '../utils/enums/housing';

const schema = {
  createSubmission: {
    body: Joi.object({
      draftId: uuidv4.allow(null),
      activityId: Joi.string().min(8).max(8).allow(null),
      contacts: contacts,
      appliedPermits: Joi.array().items(appliedPermit).allow(null),
      basic: basicIntake,
      housing: housing,
      location: Joi.any(),
      investigatePermits: Joi.array()
        .items(Joi.object({ permitTypeId: Joi.number().allow(null) }))
        .allow(null),
      permits: permits
    })
  },
  emailConfirmation: {
    body: Joi.object({
      bcc: Joi.array().items(email).allow(null),
      bodyType: Joi.string().required().allow(null),
      body: Joi.string().required(),
      cc: Joi.array().items(email),
      from: email.required(),
      subject: Joi.string().required(),
      to: Joi.array().items(email).required()
    })
  },
  deleteSubmission: {
    params: Joi.object({
      submissionId: uuidv4.required()
    })
  },
  deleteDraft: {
    params: Joi.object({
      draftId: uuidv4.required()
    })
  },
  getStatistics: {
    query: Joi.object({
      dateFrom: Joi.date().allow(null),
      dateTo: Joi.date().allow(null),
      monthYear: Joi.date().allow(null),
      userId: uuidv4.allow(null)
    })
  },
  getSubmission: {
    params: Joi.object({
      submissionId: uuidv4.required()
    })
  },
  searchSubmissions: {
    query: Joi.object({
      activityId: Joi.array().items(Joi.string()),
      intakeStatus: Joi.array().items(...INTAKE_STATUS_LIST),
      includeUser: Joi.boolean(),
      includeDeleted: Joi.boolean(),
      submissionId: Joi.array().items(uuidv4),
      submissionType: Joi.array().items(...SUBMISSION_TYPE_LIST)
    })
  },
  updateIsDeletedFlag: {
    params: Joi.object({
      submissionId: uuidv4.required()
    }),
    body: Joi.object({
      isDeleted: Joi.boolean().required()
    })
  },
  updateSubmission: {
    body: Joi.object({
      submissionId: uuidv4.required(),
      activityId: activityId,
      consentToFeedback: Joi.boolean(),
      queuePriority: Joi.number().required().integer().min(0).max(3),
      submissionType: Joi.string()
        .required()
        .valid(...SUBMISSION_TYPE_LIST),
      submittedAt: Joi.string().required(),
      relatedEnquiries: Joi.string().allow(null),
      companyNameRegistered: Joi.string().allow(null),
      isDevelopedInBC: Joi.when('companyNameRegistered', {
        is: Joi.string(),
        then: Joi.string()
          .required()
          .valid(...YES_NO_LIST),
        otherwise: Joi.string().allow(null)
      }),
      projectName: Joi.string().required(),
      projectDescription: Joi.string().allow(null),
      singleFamilyUnits: Joi.string()
        .allow(null)
        .valid(...NUM_RESIDENTIAL_UNITS_LIST),
      multiFamilyUnits: Joi.string()
        .allow(null)
        .valid(...NUM_RESIDENTIAL_UNITS_LIST),
      otherUnitsDescription: Joi.string().allow(null).max(255),
      otherUnits: Joi.when('otherUnitsDescription', {
        is: BasicResponse.YES,
        then: Joi.string()
          .required()
          .valid(...NUM_RESIDENTIAL_UNITS_LIST),
        otherwise: Joi.string().allow(null)
      }),
      hasRentalUnits: Joi.string()
        .required()
        .valid(...YES_NO_UNSURE_LIST),
      rentalUnits: Joi.when('hasRentalUnits', {
        is: BasicResponse.YES,
        then: Joi.string()
          .required()
          .valid(...NUM_RESIDENTIAL_UNITS_LIST),
        otherwise: Joi.string().allow(null)
      }),
      financiallySupportedBC: Joi.string()
        .required()
        .valid(...YES_NO_UNSURE_LIST),
      financiallySupportedIndigenous: Joi.string()
        .required()
        .valid(...YES_NO_UNSURE_LIST),
      indigenousDescription: Joi.when('financiallySupportedIndigenous', {
        is: BasicResponse.YES,
        then: Joi.string().required().max(255),
        otherwise: Joi.string().allow(null)
      }),
      financiallySupportedNonProfit: Joi.string()
        .required()
        .valid(...YES_NO_UNSURE_LIST),
      nonProfitDescription: Joi.when('financiallySupportedNonProfit', {
        is: BasicResponse.YES,
        then: Joi.string().required().max(255),
        otherwise: Joi.string().allow(null)
      }),
      financiallySupportedHousingCoop: Joi.string()
        .required()
        .valid(...YES_NO_UNSURE_LIST),
      housingCoopDescription: Joi.when('financiallySupportedHousingCoop', {
        is: BasicResponse.YES,
        then: Joi.string().required().max(255),
        otherwise: Joi.string().allow(null)
      }),
      streetAddress: Joi.string().allow(null).max(255),
      locality: Joi.string().allow(null).max(255),
      province: Joi.string().allow(null).max(255),
      locationPIDs: Joi.string().allow(null).max(255),
      latitude: Joi.number().allow(null).max(255),
      longitude: Joi.number().allow(null).max(255),
      geomarkUrl: Joi.string().allow(null).max(255),
      naturalDisaster: Joi.string()
        .valid(...YES_NO_LIST)
        .required(),
      projectLocationDescription: Joi.string().allow(null).max(4000),
      addedToATS: Joi.boolean().required(),
      atsClientNumber: Joi.string().allow(null).max(255),
      ltsaCompleted: Joi.boolean().required(),
      bcOnlineCompleted: Joi.boolean().required(),
      aaiUpdated: Joi.boolean().required(),
      astNotes: Joi.string().allow(null).max(4000),
      intakeStatus: Joi.string().valid(...INTAKE_STATUS_LIST),
      assignedUserId: Joi.when('intakeStatus', {
        is: IntakeStatus.SUBMITTED,
        then: uuidv4,
        otherwise: uuidv4.allow(null)
      }),
      applicationStatus: Joi.string().valid(...APPLICATION_STATUS_LIST),
      waitingOn: Joi.string().allow(null).max(255),
      contacts: contacts
    }),
    params: Joi.object({
      submissionId: uuidv4.required()
    })
  }
};

export default {
  createSubmission: validate(schema.createSubmission),
  emailConfirmation: validate(schema.emailConfirmation),
  deleteSubmission: validate(schema.deleteSubmission),
  deleteDraft: validate(schema.deleteDraft),
  getStatistics: validate(schema.getStatistics),
  getSubmission: validate(schema.getSubmission),
  searchSubmissions: validate(schema.searchSubmissions),
  updateIsDeletedFlag: validate(schema.updateIsDeletedFlag),
  updateSubmission: validate(schema.updateSubmission)
};
