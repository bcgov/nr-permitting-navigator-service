import { ApplicationStatus } from '@/utils/enums/housing';

import type { Contact } from './Contact';
import type { IStamps } from '@/interfaces';
import type { User } from './User';

export type Submission = {
  activityId: string;
  submissionId: string;
  queuePriority: number;
  submissionType: string;
  submittedAt: string;
  relatedEnquiries: string;
  hasRelatedEnquiry: boolean;
  companyNameRegistered: string;
  consentToFeedback?: boolean;
  isDevelopedInBC: string;
  geoJSON?: string;
  projectName: string;
  projectDescription: string;
  projectLocationDescription: string;
  singleFamilyUnits: string;
  multiFamilyUnits: string;
  multiPermitsNeeded: string;
  otherUnitsDescription: string;
  otherUnits: string;
  hasRentalUnits: string;
  rentalUnits: string;
  financiallySupportedBC: string;
  financiallySupportedIndigenous: string;
  indigenousDescription: string;
  financiallySupportedNonProfit: string;
  nonProfitDescription: string;
  financiallySupportedHousingCoop: string;
  housingCoopDescription: string;
  streetAddress: string;
  locality: string;
  province: string;
  locationPIDs: string;
  locationPIDsAuto?: string;
  latitude: number;
  longitude: number;
  geomarkUrl: string;
  naturalDisaster: string;
  addedToATS: boolean;
  atsClientNumber: string | null;
  ltsaCompleted: boolean;
  bcOnlineCompleted: boolean;
  aaiUpdated: boolean;
  astNotes: string;
  intakeStatus: string;
  assignedUserId?: string;
  applicationStatus: ApplicationStatus;
  waitingOn?: string;
  contacts: Array<Contact>;
  user?: User;
} & Partial<IStamps>;
