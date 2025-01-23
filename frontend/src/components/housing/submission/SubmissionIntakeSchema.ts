import { YES_NO_LIST, YES_NO_UNSURE_LIST } from '@/utils/constants/application';
import { NUM_RESIDENTIAL_UNITS_LIST, PROJECT_APPLICANT_LIST } from '@/utils/constants/housing';
import { BasicResponse } from '@/utils/enums/application';
import { IntakeFormCategory, ProjectApplicant, ProjectLocation } from '@/utils/enums/housing';
import { contactValidator } from '@/validators';
import { array, boolean, mixed, number, object, string } from 'yup';

// Form validation schema
const YesNoUnsureSchema = string().required().oneOf(YES_NO_UNSURE_LIST);
const stringRequiredSchema = string().required().max(255);

export const submissionIntakeSchema = object({
  [IntakeFormCategory.CONTACTS]: object(contactValidator),
  [IntakeFormCategory.BASIC]: object({
    consentToFeedback: boolean().notRequired().nullable().label('Consent to feedback'),
    projectApplicantType: string().required().oneOf(PROJECT_APPLICANT_LIST).label('Project developed'),
    isDevelopedInBC: string().when('projectApplicantType', {
      is: (value: string) => value === ProjectApplicant.BUSINESS,
      then: (schema) => schema.required().oneOf(YES_NO_LIST).label('Registered in BC'),
      otherwise: (schema) => schema.notRequired().nullable().label('Registered in BC')
    }),
    registeredName: string().when('isDevelopedInBC', {
      is: (value: string) => value === BasicResponse.YES || value === BasicResponse.NO,
      then: (schema) => schema.required().max(255).label('Business name'),
      otherwise: (schema) => schema.notRequired().nullable().label('Business name')
    })
  }),
  [IntakeFormCategory.HOUSING]: object().shape(
    {
      projectName: stringRequiredSchema.label('Project name'),
      projectDescription: string().required().label('Project description'),
      hasRentalUnits: YesNoUnsureSchema.label('Rental units'),
      financiallySupportedBC: YesNoUnsureSchema.label('BC Housing'),
      financiallySupportedIndigenous: YesNoUnsureSchema.label('Indigenous Housing Provider'),
      financiallySupportedNonProfit: YesNoUnsureSchema.label('Non-profit housing society'),
      financiallySupportedHousingCoop: YesNoUnsureSchema.label('Housing co-operative'),
      rentalUnits: string().when('hasRentalUnits', {
        is: (value: string) => value === BasicResponse.YES,
        then: () => string().oneOf(NUM_RESIDENTIAL_UNITS_LIST).required().label('Expected rental units'),
        otherwise: () => string().nullable()
      }),
      indigenousDescription: string().when('financiallySupportedIndigenous', {
        is: (value: string) => value === BasicResponse.YES,
        then: () => stringRequiredSchema.label('Indigenous housing provider'),
        otherwise: () => string().nullable()
      }),
      nonProfitDescription: string().when('financiallySupportedNonProfit', {
        is: (value: string) => value === BasicResponse.YES,
        then: () => stringRequiredSchema.label('Non-profit housing society'),
        otherwise: () => string().nullable()
      }),
      housingCoopDescription: string().when('financiallySupportedHousingCoop', {
        is: (value: string) => value === BasicResponse.YES,
        then: () => stringRequiredSchema.label('Housing co-operative'),
        otherwise: () => string().nullable()
      }),
      singleFamilySelected: boolean().when(['multiFamilySelected', 'otherSelected'], {
        is: (multi: boolean, other: boolean) => !(multi || other),
        then: (schema) => {
          return schema.test('housing-checkbox-test', '\n', function (value) {
            if (value) return true;
            else return false;
          });
        },
        otherwise: (schema) => schema.notRequired()
      }),
      singleFamilyUnits: string().when('singleFamilySelected', {
        is: (value: boolean) => value,
        then: (schema) =>
          schema.required().oneOf(NUM_RESIDENTIAL_UNITS_LIST).label('Expected number of single-family units'),
        otherwise: () => string().nullable()
      }),
      multiFamilySelected: boolean().when(['singleFamilySelected', 'otherSelected'], {
        is: (single: boolean, other: boolean) => !(single || other),
        then: (schema) => {
          return schema.test('housing-checkbox-test', '\n', function (value) {
            if (value) return true;
            else return false;
          });
        },
        otherwise: (schema) => schema.notRequired()
      }),
      multiFamilyUnits: string().when('multiFamilySelected', {
        is: (value: boolean) => value,
        then: (schema) =>
          schema.required().oneOf(NUM_RESIDENTIAL_UNITS_LIST).label('Expected number of multi-family units'),
        otherwise: () => string().nullable()
      }),
      otherSelected: boolean().when(['singleFamilySelected', 'multiFamilySelected'], {
        is: (single: boolean, multi: boolean) => !(single || multi),
        then: (schema) => {
          return schema.test('housing-checkbox-test', '\n', function (value) {
            if (value) return true;
            else return false;
          });
        },
        otherwise: (schema) => schema.notRequired()
      }),
      otherUnitsDescription: string().when('otherSelected', {
        is: (value: boolean) => value,
        then: (schema) => schema.required().label('Description of units'),
        otherwise: () => string().nullable()
      }),
      otherUnits: string().when('otherSelected', {
        is: (value: boolean) => value,
        then: (schema) => schema.required().oneOf(NUM_RESIDENTIAL_UNITS_LIST).label('Expected number of other units'),
        otherwise: () => string().nullable()
      })
    },
    [
      ['multiFamilySelected', 'otherSelected'],
      ['singleFamilySelected', 'otherSelected'],
      ['singleFamilySelected', 'multiFamilySelected']
    ]
  ),
  [IntakeFormCategory.LOCATION]: object({
    naturalDisaster: string().oneOf(YES_NO_LIST).required().label('Natural disaster'),
    projectLocation: string().required().label('Location'),
    streetAddress: string().when('projectLocation', {
      is: (value: string) => value === ProjectLocation.STREET_ADDRESS,
      then: () => stringRequiredSchema.label('Street address'),
      otherwise: () => string().nullable()
    }),
    locality: string().when('projectLocation', {
      is: (value: string) => value === ProjectLocation.STREET_ADDRESS,
      then: () => stringRequiredSchema.label('Locality'),
      otherwise: () => string().nullable()
    }),
    province: string().when('projectLocation', {
      is: (value: string) => value === ProjectLocation.STREET_ADDRESS,
      then: () => stringRequiredSchema.label('Province'),
      otherwise: () => string().nullable()
    }),
    latitude: number().when('projectLocation', {
      is: (value: string) => value === ProjectLocation.LOCATION_COORDINATES,
      then: () => number().required().min(48).max(60).label('Latitude'),
      otherwise: () => number().nullable().min(48).max(60).label('Latitude')
    }),
    longitude: number().when('projectLocation', {
      is: (value: string) => value === ProjectLocation.LOCATION_COORDINATES,
      then: () => number().required().min(-139).max(-114).label('Longitude'),
      otherwise: () => number().nullable().min(-139).max(-114).label('Longitude')
    }),
    ltsaPIDLookup: string().max(255).nullable().label('Parcel ID'),
    geomarkUrl: string().max(255).label('Geomark web service url'),
    getJSON: mixed().nullable().label('geoJSON')
  }),
  [IntakeFormCategory.PERMITS]: object({
    hasAppliedProvincialPermits: string().oneOf(YES_NO_UNSURE_LIST).required().label('Applied permits')
  }),
  [IntakeFormCategory.APPLIED_PERMITS]: array().of(
    object({
      permitTypeId: number().required().label('Permit type'),
      submittedDate: mixed()
        .test(
          'submitted-date',
          'Submitted date must be valid or empty',
          (val) => val instanceof Date || val === undefined
        )
        .label('Submitted date'),
      trackingId: string().max(255).nullable().label('Tracking ID')
    })
  ),
  [IntakeFormCategory.INVESTIGATE_PERMIS]: array().of(
    object({
      permitTypeId: number().required().label('Permit type')
    })
  )
});
