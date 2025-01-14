import Joi from 'joi';

import { validate } from '../middleware/validation.ts';

import { BasicResponse } from '../utils/enums/application.ts';

const addressBody = {
  '@type': Joi.string().valid('AddressResource'),
  addressLine1: Joi.string().max(255).allow(null),
  city: Joi.string().max(255).allow(null),
  provinceCode: Joi.string().max(255).allow(null),
  primaryPhone: Joi.string().max(255).allow(null),
  email: Joi.string().max(255).allow(null)
};

const clientBody = {
  '@type': Joi.string().valid('ClientResource'),
  firstName: Joi.string().max(255).required(),
  surName: Joi.string().max(255).required(),
  regionName: Joi.string().max(255).required(),
  optOutOfBCStatSurveyInd: Joi.string().valid(BasicResponse.NO.toUpperCase()),
  address: Joi.object(addressBody).allow(null)
};

const schema = {
  createATSClient: {
    body: Joi.object(clientBody)
  }
};

export default {
  createATSClient: validate(schema.createATSClient)
};
