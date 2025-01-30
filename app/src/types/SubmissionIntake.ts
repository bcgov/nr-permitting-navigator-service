import { Contact } from './Contact';
import { Permit } from './Permit';
import { ApplicationStatus, SubmissionType } from '../utils/enums/housing';

export type SubmissionIntake = {
  activityId?: string;
  draftId?: string;
  submittedAt?: string;
  applicationStatus?: ApplicationStatus;
  submissionType?: SubmissionType;

  basic?: {
    consentToFeedback?: boolean;
    projectApplicantType?: string | null;
    isDevelopedInBC?: string | null;
    registeredName?: string;
  };

  housing?: {
    projectName?: string;
    projectDescription?: string;
    singleFamilyUnits?: string;
    multiFamilyUnits?: string;
    otherUnitsDescription?: string;
    otherUnits?: string | null;
    hasRentalUnits?: string | null;
    financiallySupportedBC?: string | null;
    financiallySupportedIndigenous?: string | null;
    financiallySupportedNonProfit?: string | null;
    financiallySupportedHousingCoop?: string | null;
    rentalUnits?: string;
    indigenousDescription?: string;
    nonProfitDescription?: string;
    housingCoopDescription?: string;
  };

  location?: {
    naturalDisaster?: string;
    projectLocation?: string;
    projectLocationDescription?: string;
    geoJSON?: string | null;
    ltsaPIDLookup?: string;
    latitude?: number | null;
    longitude?: number | null;
    streetAddress?: string;
    locality?: string;
    province?: string;
  };

  permits?: {
    hasAppliedProvincialPermits?: string | null;
  };

  appliedPermits?: Array<Permit>;

  investigatePermits?: Array<Permit>;

  contacts?: Array<Contact>;
};
