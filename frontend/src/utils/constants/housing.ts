/*
 * Housing initiative constants
 */
import {
  ApplicationStatus,
  BringForwardType,
  ContactPreference,
  IntakeStatus,
  NoteType,
  NumResidentialUnits,
  PermitAuthorizationStatus,
  PermitNeeded,
  PermitStatus,
  ProjectApplicant,
  ProjectLocation,
  ProjectRelationship,
  SubmissionType
} from '../enums/housing';

export const ADDRESS_CODER_QUERY_PARAMS = {
  echo: false,
  brief: false,
  minScore: 55,
  onlyCivic: true,
  maxResults: 15,
  autoComplete: true,
  matchAccuracy: 100,
  matchPrecision: 'occupant, unit, site, civic_number, intersection, block, street, locality, province',
  precisionPoints: 100
};

export const APPLICATION_STATUS_LIST = [
  ApplicationStatus.NEW,
  ApplicationStatus.IN_PROGRESS,
  ApplicationStatus.DELAYED,
  ApplicationStatus.COMPLETED
];

export const BRING_FORWARD_TYPE_LIST = [BringForwardType.UNRESOLVED, BringForwardType.RESOLVED];

export const CONTACT_PREFERENCE_LIST = [
  ContactPreference.PHONE_CALL,
  ContactPreference.EMAIL,
  ContactPreference.EITHER
];

export const ENQUIRY_TYPE_LIST = [
  SubmissionType.ASSISTANCE,
  SubmissionType.GENERAL_ENQUIRY,
  SubmissionType.STATUS_REQUEST,
  SubmissionType.ESCALATION,
  SubmissionType.INAPPLICABLE
];

export const HOUSING_CONTACT = {
  email: 'Navigator.Service@gov.bc.ca',
  subject: 'Assistance with Permit Connect Navigator Service'
};

export const INTAKE_STATUS_LIST = [IntakeStatus.SUBMITTED, IntakeStatus.ASSIGNED, IntakeStatus.COMPLETED];

export const NOTE_TYPE_LIST = [NoteType.GENERAL, NoteType.BRING_FORWARD, NoteType.ENQUIRY, NoteType.ROADMAP];

export const NUM_RESIDENTIAL_UNITS_LIST = [
  NumResidentialUnits.ONE_TO_NINE,
  NumResidentialUnits.TEN_TO_FOURTY_NINE,
  NumResidentialUnits.FIFTY_TO_FIVE_HUNDRED,
  NumResidentialUnits.GREATER_THAN_FIVE_HUNDRED,
  NumResidentialUnits.UNSURE
];

export const ORG_BOOK_QUERY_PARAMS = {
  limit: 100,
  skip: 0,
  latest: true,
  inactive: false,
  revoked: false
};

export const PROJECT_APPLICANT_LIST = [ProjectApplicant.BUSINESS, ProjectApplicant.INDIVIDUAL];

export const PROJECT_RELATIONSHIP_LIST = [
  ProjectRelationship.OWNER,
  ProjectRelationship.CONSULTANT,
  ProjectRelationship.OTHER
];

export const PERMIT_AUTHORIZATION_STATUS_LIST = [
  PermitAuthorizationStatus.NONE,
  PermitAuthorizationStatus.IN_REVIEW,
  PermitAuthorizationStatus.PENDING,
  PermitAuthorizationStatus.ISSUED,
  PermitAuthorizationStatus.DENIED,
  PermitAuthorizationStatus.CANCELLED,
  PermitAuthorizationStatus.WITHDRAWN,
  PermitAuthorizationStatus.ABANDONED
];

export const PERMIT_NEEDED_LIST = [PermitNeeded.YES, PermitNeeded.UNDER_INVESTIGATION, PermitNeeded.NO];

export const PERMIT_STATUS_LIST = [
  PermitStatus.NEW,
  PermitStatus.APPLIED,
  PermitStatus.TECHNICAL_REVIEW,
  PermitStatus.PENDING,
  PermitStatus.COMPLETED
];

export const PROJECT_LOCATION_LIST = [
  ProjectLocation.LOCATION_COORDINATES,
  ProjectLocation.STREET_ADDRESS,
  ProjectLocation.PIN_OR_DRAW
];

export const QUEUE_PRIORITY = [1, 2, 3];

export const SUBMISSION_TYPE_LIST = [SubmissionType.GUIDANCE, SubmissionType.INAPPLICABLE];
