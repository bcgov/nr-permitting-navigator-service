export enum AccessRequestStatus {
  APPROVED = 'Approved',
  PENDING = 'Pending',
  REJECTED = 'Rejected'
}

export enum Action {
  CREATE = 'CREATE',
  READ = 'READ',
  UPDATE = 'UPDATE',
  DELETE = 'DELETE',
  ROLEOVERRIDE = 'ROLEOVERRIDE'
}

export enum BasicResponse {
  YES = 'Yes',
  NO = 'No',
  UNSURE = 'Unsure'
}

export enum ButtonMode {
  BUTTON,
  ICON
}

export enum FileCategory {
  COMPRESSED = 'compressed',
  DOC = 'doc',
  EMAIL = 'email',
  FILE = 'file',
  IMAGE = 'image',
  PDF = 'pdf',
  SHAPE = 'shape',
  SPREADSHEET = 'spreadsheet'
}

export enum GroupName {
  DEVELOPER = 'DEVELOPER',
  PROPONENT = 'PROPONENT',
  NAVIGATOR = 'NAVIGATOR',
  NAVIGATOR_READ_ONLY = 'NAVIGATOR_READ_ONLY',
  SUPERVISOR = 'SUPERVISOR',
  ADMIN = 'ADMIN'
}

export enum Initiative {
  PCNS = 'PCNS',
  HOUSING = 'HOUSING'
}

export enum Regex {
  // https://emailregex.com/
  // HTML5 - Modified to require domain of at least 2 characters
  EMAIL = '^[a-zA-Z0-9.!#$%&’*+/=?^_`{|}~-]+@[a-zA-Z0-9-]+(?:\\.[a-zA-Z0-9-]{2,})+$'
}

export enum RouteName {
  DEVELOPER = 'developer',
  FORBIDDEN = 'forbidden',
  HOME = 'home',

  /*
   * Proponent route names
   */
  HOUSING = 'housing',
  HOUSING_ENQUIRY_CONFIRMATION = 'housing_enquiry_confirmation',
  HOUSING_ENQUIRY_INTAKE = 'housing_enquiry_intake',
  HOUSING_ENQUIRY_SUBMITTED = 'housing_enquiry_submitted',
  HOUSING_INTAKE = 'housing_intake',
  HOUSING_INTAKE_DRAFT = 'housing_intake_draft',
  HOUSING_INTAKE_CONFIRMATION = 'housing_intake_confirmation',
  HOUSING_GUIDE = 'housing_guide',
  HOUSING_PROJECT = 'housing_project',
  HOUSING_PROJECT_ENQUIRY = 'housing_project_enquiry',
  HOUSING_PROJECT_INTAKE = 'housing_project_intake',
  HOUSING_PROJECT_PERMIT = 'housing_project_permit',
  HOUSING_PROJECT_PERMIT_ENQUIRY = 'housing_project_permit_enquiry',
  /*
   * End Proponent route names
   */

  /*
   * Navigator route names
   */
  HOUSING_SUBMISSIONS = 'housing_submissions',
  HOUSING_SUBMISSIONS_ENQUIRY = 'housing_submissions_enquiry',
  HOUSING_SUBMISSIONS_PROJECT = 'housing_submissions_project',
  HOUSING_SUBMISSIONS_PROJECT_ENQUIRY = 'housing_submissions_project_enquiry',
  HOUSING_SUBMISSIONS_PROJECT_PROPONENT = 'housing_submissions_project_proponent',
  HOUSING_SUBMISSIONS_PROJECT_PROPONENT_PERMIT = 'housing_submissions_project_proponent_permit',
  HOUSING_USER_MANAGEMENT = 'user_management',
  /*
   * End Navigator route names
   */

  NOT_FOUND = 'not_found',

  OIDC_CALLBACK = 'oidc_callback',
  OIDC_LOGIN = 'oidc_login',
  OIDC_LOGOUT = 'oidc_logout',

  USER = 'contact_profile'
}

export enum IdentityProvider {
  IDIR = 'idir',
  BCEID = 'bceidbasic',
  BCEIDBUSINESS = 'bceidbusiness'
}

export enum Resource {
  DOCUMENT = 'DOCUMENT',
  ENQUIRY = 'ENQUIRY',
  NAVIGATION = 'NAVIGATION',
  NOTE = 'NOTE',
  PERMIT = 'PERMIT',
  ROADMAP = 'ROADMAP',
  SSO = 'SSO',
  SUBMISSION = 'SUBMISSION',
  TESTING = 'TESTING',
  USER = 'USER'
}

export enum StorageKey {
  AUTH = 'entrypoint',
  BF_ACCORDION_IDX = 'bf_accordion_idx',
  CONFIG = 'config'
}

export enum ToastTimeout {
  ERROR = 5000,
  INFO = 3000,
  STICKY = 0,
  SUCCESS = 3000,
  WARNING = 5000
}

export enum UserSearchParams {
  FIRST_NAME = 'First name',
  LAST_NAME = 'Last name',
  EMAIL = 'Email'
}
