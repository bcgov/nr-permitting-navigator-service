import { Prisma } from '@prisma/client';
import { Decimal } from '@prisma/client/runtime/library';

import contact from './contact';
import user from './user';
import { BasicResponse } from '../../utils/enums/application';

import type { Stamps } from '../stamps';
import type { Submission } from '../../types';

// Define types
const _submission = Prisma.validator<Prisma.submissionDefaultArgs>()({});
const _submissionWithContactGraph = Prisma.validator<Prisma.submissionDefaultArgs>()({
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
const _submissionWithUserGraph = Prisma.validator<Prisma.submissionDefaultArgs>()({
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
  }
});

type PrismaRelationSubmission = Omit<Prisma.submissionGetPayload<typeof _submission>, keyof Stamps>;
type PrismaGraphSubmission = Prisma.submissionGetPayload<typeof _submission>;
type PrismaGraphSubmissionWithContact = Prisma.submissionGetPayload<typeof _submissionWithContactGraph>;
type PrismaGraphSubmissionWithUser = Prisma.submissionGetPayload<typeof _submissionWithUserGraph>;

export default {
  toPrismaModel(input: Submission): PrismaRelationSubmission {
    return {
      submission_id: input.submissionId,
      activity_id: input.activityId,
      assigned_user_id: input.assignedUserId,
      project_name: input.projectName,
      project_description: input.projectDescription,
      submitted_at: new Date(input.submittedAt ?? Date.now()),
      submitted_by: input.submittedBy,
      consent_to_feedback: input.consentToFeedback,
      location_pids: input.locationPIDs,
      company_name_registered: input.companyNameRegistered,
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      geo_json: input.geoJSON as any,
      single_family_units: input.singleFamilyUnits,
      has_rental_units: input.hasRentalUnits,
      street_address: input.streetAddress,
      latitude: input.latitude ? new Decimal(input.latitude) : null,
      longitude: input.longitude ? new Decimal(input.longitude) : null,
      queue_priority: input.queuePriority,
      related_permits: input.relatedPermits,
      ast_notes: input.astNotes,
      ast_updated: input.astUpdated,
      added_to_ats: input.addedToATS,
      ats_client_id: input.atsClientId,
      ltsa_completed: input.ltsaCompleted,
      bc_online_completed: input.bcOnlineCompleted,
      natural_disaster: input.naturalDisaster === BasicResponse.YES ? true : false,
      financially_supported: input.financiallySupported,
      financially_supported_bc: input.financiallySupportedBC,
      financially_supported_indigenous: input.financiallySupportedIndigenous,
      financially_supported_non_profit: input.financiallySupportedNonProfit,
      financially_supported_housing_coop: input.financiallySupportedHousingCoop,
      aai_updated: input.aaiUpdated,
      waiting_on: input.waitingOn,
      intake_status: input.intakeStatus,
      application_status: input.applicationStatus,
      project_applicant_type: input.projectApplicantType,
      is_developed_in_bc: input.isDevelopedInBC,
      multi_family_units: input.multiFamilyUnits,
      other_units: input.otherUnits,
      other_units_description: input.otherUnitsDescription,
      rental_units: input.rentalUnits,
      project_location: input.projectLocation,
      project_location_description: input.projectLocationDescription,
      locality: input.locality,
      province: input.province,
      has_applied_provincial_permits: input.hasAppliedProvincialPermits,
      check_provincial_permits: null,
      indigenous_description: input.indigenousDescription,
      non_profit_description: input.nonProfitDescription,
      housing_coop_description: input.housingCoopDescription,
      submission_type: input.submissionType
    };
  },

  fromPrismaModel(input: PrismaGraphSubmission): Submission {
    return {
      submissionId: input.submission_id,
      activityId: input.activity_id,
      assignedUserId: input.assigned_user_id,
      submittedAt: input.submitted_at?.toISOString() as string,
      submittedBy: input.submitted_by,
      locationPIDs: input.location_pids,
      consentToFeedback: input.consent_to_feedback,
      projectName: input.project_name,
      projectDescription: input.project_description,
      companyNameRegistered: input.company_name_registered,
      geoJSON: input.geo_json,
      singleFamilyUnits: input.single_family_units,
      hasRentalUnits: input.has_rental_units,
      streetAddress: input.street_address,
      latitude: input.latitude ? input.latitude.toNumber() : null,
      longitude: input.longitude ? input.longitude.toNumber() : null,
      queuePriority: input.queue_priority,
      relatedPermits: input.related_permits,
      astNotes: input.ast_notes,
      astUpdated: input.ast_updated,
      addedToATS: input.added_to_ats,
      atsClientId: input.ats_client_id,
      ltsaCompleted: input.ltsa_completed,
      bcOnlineCompleted: input.bc_online_completed,
      naturalDisaster: input.natural_disaster ? BasicResponse.YES : BasicResponse.NO,
      financiallySupported: input.financially_supported,
      financiallySupportedBC: input.financially_supported_bc,
      financiallySupportedIndigenous: input.financially_supported_indigenous,
      financiallySupportedNonProfit: input.financially_supported_non_profit,
      financiallySupportedHousingCoop: input.financially_supported_housing_coop,
      aaiUpdated: input.aai_updated,
      waitingOn: input.waiting_on,
      intakeStatus: input.intake_status,
      applicationStatus: input.application_status,
      projectApplicantType: input.project_applicant_type,
      isDevelopedInBC: input.is_developed_in_bc,
      multiFamilyUnits: input.multi_family_units,
      otherUnits: input.other_units,
      otherUnitsDescription: input.other_units_description,
      rentalUnits: input.rental_units,
      projectLocation: input.project_location,
      projectLocationDescription: input.project_location_description,
      locality: input.locality,
      province: input.province,
      hasAppliedProvincialPermits: input.has_applied_provincial_permits,
      indigenousDescription: input.indigenous_description,
      nonProfitDescription: input.non_profit_description,
      housingCoopDescription: input.housing_coop_description,
      submissionType: input.submission_type,
      relatedEnquiries: null,
      createdBy: input.created_by,
      updatedAt: input.updated_at?.toISOString() as string,
      contacts: [],
      user: null
    };
  },

  fromPrismaModelWithContact(input: PrismaGraphSubmissionWithContact): Submission {
    const submission = this.fromPrismaModel(input);
    if (submission && input.activity.activity_contact) {
      submission.contacts = input.activity.activity_contact.map((x) => contact.fromPrismaModel(x.contact));
    }

    return submission;
  },

  fromPrismaModelWithUser(input: PrismaGraphSubmissionWithUser): Submission {
    const submission = this.fromPrismaModelWithContact(input);
    if (submission && input.user) {
      submission.user = user.fromPrismaModel(input.user);
    }

    return submission;
  }
};
