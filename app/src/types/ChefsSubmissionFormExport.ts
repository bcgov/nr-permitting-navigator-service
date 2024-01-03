export type ChefsSubmissionFormExport = {
  form: {
    id: string;
    submissionId: string;
    confirmationId: string;
    formName: string;
    version: number;
    createdAt: string;
    fullName: string;
    username: string;
    email: string;
    status: string;
    assignee: string;
    assigneedEmail: string;
  };

  submissionId: string;
  confirmationId: string;
  contactEmail: string;
  contactPhoneNumber: string;
  contactFirstName: string;
  contactLastName: string;
  financiallySupported: boolean;
  intakeStatus: string;
  isBCHousingSupported: boolean;
  isIndigenousHousingProviderSupported: boolean;
  isNonProfitSupported: boolean;
  isHousingCooperativeSupported: boolean;
  latitude: number;
  longitude: number;
  naturalDisasterInd: boolean;
  companyNameRegistered: string;
  queuePriority: number;
  singleFamilyUnits: string;
  multiFamilyUnits: string;
  streetAddress: string;
  createdAt: string;
  createdBy: string;
};
