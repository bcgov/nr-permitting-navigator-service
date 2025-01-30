import { v4 as uuidv4 } from 'uuid';

import { generateCreateStamps, generateUpdateStamps } from '../db/utils/utils';
import {
  activityService,
  contactService,
  draftService,
  emailService,
  enquiryService,
  submissionService,
  permitService
} from '../services';
import { Initiative } from '../utils/enums/application';
import {
  ApplicationStatus,
  DraftCode,
  IntakeStatus,
  NumResidentialUnits,
  PermitAuthorizationStatus,
  PermitNeeded,
  PermitStatus,
  SubmissionType
} from '../utils/enums/housing';
import { getCurrentUsername, isTruthy } from '../utils/utils';

import type { NextFunction, Request, Response } from 'express';
import type {
  CurrentContext,
  Draft,
  Email,
  Permit,
  StatisticsFilters,
  Submission,
  SubmissionIntake,
  SubmissionSearchParameters
} from '../types';

const controller = {
  /**
   * @function assignPriority
   * Assigns a priority level to a submission based on given criteria
   * Criteria defined below
   */
  assignPriority: (submission: Partial<Submission>) => {
    const matchesPriorityOneCriteria = // Priority 1 Criteria:
      submission.singleFamilyUnits === NumResidentialUnits.GREATER_THAN_FIVE_HUNDRED || // 1. More than 50 units (any)
      submission.singleFamilyUnits === NumResidentialUnits.FIFTY_TO_FIVE_HUNDRED ||
      submission.multiFamilyUnits === NumResidentialUnits.GREATER_THAN_FIVE_HUNDRED ||
      submission.multiFamilyUnits === NumResidentialUnits.FIFTY_TO_FIVE_HUNDRED ||
      submission.otherUnits === NumResidentialUnits.GREATER_THAN_FIVE_HUNDRED ||
      submission.otherUnits === NumResidentialUnits.FIFTY_TO_FIVE_HUNDRED ||
      submission.hasRentalUnits === 'Yes' || // 2. Supports Rental Units
      submission.financiallySupportedBC === 'Yes' || // 3. Social Housing
      submission.financiallySupportedIndigenous === 'Yes'; // 4. Indigenous Led

    const matchesPriorityTwoCriteria = // Priority 2 Criteria:
      submission.singleFamilyUnits === NumResidentialUnits.TEN_TO_FOURTY_NINE || // 1. Single Family >= 10 Units
      submission.multiFamilyUnits === NumResidentialUnits.TEN_TO_FOURTY_NINE || // 2. Has 1 or more MultiFamily Units
      submission.multiFamilyUnits === NumResidentialUnits.ONE_TO_NINE ||
      submission.otherUnits === NumResidentialUnits.TEN_TO_FOURTY_NINE || // 3. Has 1 or more Other Units
      submission.otherUnits === NumResidentialUnits.ONE_TO_NINE;

    if (matchesPriorityOneCriteria) {
      submission.queuePriority = 1;
    } else if (matchesPriorityTwoCriteria) {
      submission.queuePriority = 2;
    } else {
      // Prioriy 3 Criteria:
      submission.queuePriority = 3; // Everything Else
    }
  },

  generateSubmissionData: async (data: SubmissionIntake, intakeStatus: string, currentContext: CurrentContext) => {
    const activityId =
      data.activityId ??
      (await activityService.createActivity(Initiative.HOUSING, generateCreateStamps(currentContext)))?.activityId;

    let basic, housing, location, permits;
    let appliedPermits: Array<Permit> = [],
      investigatePermits: Array<Permit> = [];

    if (data.basic) {
      basic = {
        consentToFeedback: data.basic.consentToFeedback ?? false,
        projectApplicantType: data.basic.projectApplicantType,
        isDevelopedInBC: data.basic.isDevelopedInBC,
        companyNameRegistered: data.basic.registeredName
      };
    }

    if (data.housing) {
      housing = {
        projectName: data.housing.projectName,
        projectDescription: data.housing.projectDescription,
        singleFamilyUnits: data.housing.singleFamilyUnits,
        multiFamilyUnits: data.housing.multiFamilyUnits,
        otherUnitsDescription: data.housing.otherUnitsDescription,
        otherUnits: data.housing.otherUnits,
        hasRentalUnits: data.housing.hasRentalUnits,
        financiallySupportedBC: data.housing.financiallySupportedBC,
        financiallySupportedIndigenous: data.housing.financiallySupportedIndigenous,
        financiallySupportedNonProfit: data.housing.financiallySupportedNonProfit,
        financiallySupportedHousingCoop: data.housing.financiallySupportedHousingCoop,
        rentalUnits: data.housing.rentalUnits,
        indigenousDescription: data.housing.indigenousDescription,
        nonProfitDescription: data.housing.nonProfitDescription,
        housingCoopDescription: data.housing.housingCoopDescription
      };
    }

    if (data.location) {
      location = {
        naturalDisaster: data.location.naturalDisaster,
        projectLocation: data.location.projectLocation,
        projectLocationDescription: data.location.projectLocationDescription,
        geoJSON: data.location.geoJSON,
        locationPIDs: data.location.ltsaPIDLookup,
        latitude: data.location.latitude,
        longitude: data.location.longitude,
        streetAddress: data.location.streetAddress,
        locality: data.location.locality,
        province: data.location.province
      };
    }

    if (data.permits) {
      permits = {
        hasAppliedProvincialPermits: data.permits.hasAppliedProvincialPermits
      };
    }

    if (data.appliedPermits && data.appliedPermits.length) {
      appliedPermits = data.appliedPermits.map((x: Permit) => ({
        permitId: x.permitId,
        permitTypeId: x.permitTypeId,
        activityId: activityId as string,
        trackingId: x.trackingId,
        status: x.status ?? PermitStatus.APPLIED,
        needed: x.needed ?? PermitNeeded.YES,
        statusLastVerified: null,
        issuedPermitId: null,
        authStatus: x.authStatus ?? PermitAuthorizationStatus.IN_REVIEW,
        submittedDate: x.submittedDate,
        adjudicationDate: null
      }));
    }

    if (data.investigatePermits && data.investigatePermits.length) {
      investigatePermits = data.investigatePermits.map((x: Permit) => ({
        permitId: x.permitId as string,
        permitTypeId: x.permitTypeId as number,
        activityId: activityId as string,
        trackingId: null,
        status: x.status ?? PermitStatus.NEW,
        needed: x.needed ?? PermitNeeded.UNDER_INVESTIGATION,
        statusLastVerified: null,
        issuedPermitId: null,
        authStatus: x.authStatus ?? PermitAuthorizationStatus.NONE,
        submittedDate: null,
        adjudicationDate: null
      }));
    }

    // Put new submission together
    const submissionData = {
      submission: {
        ...basic,
        ...housing,
        ...location,
        ...permits,
        submissionId: uuidv4(),
        activityId: activityId,
        submittedAt: data.submittedAt ?? new Date().toISOString(),
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        submittedBy: getCurrentUsername(currentContext),
        intakeStatus: intakeStatus,
        applicationStatus: data.applicationStatus ?? ApplicationStatus.NEW,
        submissionType: data?.submissionType ?? SubmissionType.GUIDANCE
      } as Submission,
      appliedPermits,
      investigatePermits
    };

    controller.assignPriority(submissionData.submission);

    return submissionData;
  },

  /**
   * @function emailConfirmation
   * Send an email with the confirmation of submission
   */
  emailConfirmation: async (req: Request<never, never, Email>, res: Response, next: NextFunction) => {
    try {
      const { data, status } = await emailService.email(req.body);
      res.status(status).json(data);
    } catch (e: unknown) {
      next(e);
    }
  },

  getActivityIds: async (req: Request, res: Response, next: NextFunction) => {
    try {
      let response = await submissionService.getSubmissions();
      if (req.currentAuthorization?.attributes.includes('scope:self')) {
        response = response.filter(
          (x: Submission) => x?.submittedBy.toUpperCase() === getCurrentUsername(req.currentContext)?.toUpperCase()
        );
      }
      res.status(200).json(response.map((x) => x.activityId));
    } catch (e: unknown) {
      next(e);
    }
  },

  createSubmission: async (req: Request<never, never, SubmissionIntake>, res: Response, next: NextFunction) => {
    try {
      const { submission, appliedPermits, investigatePermits } = await controller.generateSubmissionData(
        req.body,
        IntakeStatus.SUBMITTED,
        req.currentContext
      );

      // Create contacts
      if (req.body.contacts)
        await contactService.upsertContacts(req.body.contacts, req.currentContext, submission.activityId);

      // Create new submission
      const result = await submissionService.createSubmission({
        ...submission,
        ...generateCreateStamps(req.currentContext)
      });

      // Create each permit
      await Promise.all(appliedPermits.map(async (x: Permit) => await permitService.createPermit(x)));
      await Promise.all(investigatePermits.map(async (x: Permit) => await permitService.createPermit(x)));

      res.status(201).json({ activityId: result.activityId, submissionId: result.submissionId });
    } catch (e: unknown) {
      next(e);
    }
  },

  deleteSubmission: async (req: Request<{ submissionId: string }>, res: Response, next: NextFunction) => {
    try {
      const response = await submissionService.deleteSubmission(req.params.submissionId);

      if (!response) {
        return res.status(404).json({ message: 'Submission not found' });
      }

      res.status(200).json(response);
    } catch (e: unknown) {
      next(e);
    }
  },

  deleteDraft: async (req: Request<{ draftId: string }>, res: Response, next: NextFunction) => {
    try {
      const response = await draftService.deleteDraft(req.params.draftId);

      if (!response) {
        return res.status(404).json({ message: 'Submission draft not found' });
      }

      res.status(200).json(response);
    } catch (e: unknown) {
      next(e);
    }
  },

  getDraft: async (req: Request<{ draftId: string }>, res: Response, next: NextFunction) => {
    try {
      const response = await draftService.getDraft(req.params.draftId);

      res.status(200).json(response);
    } catch (e: unknown) {
      next(e);
    }
  },

  getDrafts: async (req: Request, res: Response, next: NextFunction) => {
    try {
      let response = await draftService.getDrafts(DraftCode.SUBMISSION);

      if (req.currentAuthorization?.attributes.includes('scope:self')) {
        response = response.filter((x: Draft) => x?.createdBy === req.currentContext.userId);
      }

      res.status(200).json(response);
    } catch (e: unknown) {
      next(e);
    }
  },

  getStatistics: async (req: Request<never, never, never, StatisticsFilters>, res: Response, next: NextFunction) => {
    try {
      const response = await submissionService.getStatistics(req.query);
      res.status(200).json(response[0]);
    } catch (e: unknown) {
      next(e);
    }
  },

  getSubmission: async (req: Request<{ submissionId: string }>, res: Response, next: NextFunction) => {
    try {
      const response = await submissionService.getSubmission(req.params.submissionId);

      if (!response) {
        return res.status(404).json({ message: 'Submission not found' });
      }

      if (req.currentAuthorization?.attributes.includes('scope:self')) {
        if (response?.submittedBy.toUpperCase() !== getCurrentUsername(req.currentContext)?.toUpperCase()) {
          res.status(403).send();
        }
      }

      if (response?.activityId) {
        const relatedEnquiries = await enquiryService.getRelatedEnquiries(response.activityId);
        if (relatedEnquiries.length) response.relatedEnquiries = relatedEnquiries.map((x) => x.activityId).join(', ');
      }

      res.status(200).json(response);
    } catch (e: unknown) {
      next(e);
    }
  },

  getSubmissions: async (req: Request, res: Response, next: NextFunction) => {
    try {
      let response = await submissionService.getSubmissions();

      if (req.currentAuthorization?.attributes.includes('scope:self')) {
        response = response.filter(
          (x: Submission) => x?.submittedBy.toUpperCase() === getCurrentUsername(req.currentContext)?.toUpperCase()
        );
      }

      res.status(200).json(response);
    } catch (e: unknown) {
      next(e);
    }
  },

  searchSubmissions: async (
    req: Request<never, never, never, SubmissionSearchParameters>,
    res: Response,
    next: NextFunction
  ) => {
    try {
      let response = await submissionService.searchSubmissions({
        ...req.query,
        includeUser: isTruthy(req.query.includeUser),
        includeDeleted: isTruthy(req.query.includeDeleted)
      });

      if (req.currentAuthorization?.attributes.includes('scope:self')) {
        response = response.filter(
          (x: Submission) => x?.submittedBy.toUpperCase() === getCurrentUsername(req.currentContext)?.toUpperCase()
        );
      }

      res.status(200).json(response);
    } catch (e: unknown) {
      next(e);
    }
  },

  submitDraft: async (req: Request<never, never, SubmissionIntake>, res: Response, next: NextFunction) => {
    try {
      const { submission, appliedPermits, investigatePermits } = await controller.generateSubmissionData(
        req.body,
        IntakeStatus.SUBMITTED,
        req.currentContext
      );

      // Create contacts
      if (req.body.contacts)
        await contactService.upsertContacts(req.body.contacts, req.currentContext, submission.activityId);

      // Create new submission
      const result = await submissionService.createSubmission({
        ...submission,
        ...generateCreateStamps(req.currentContext)
      });

      // Create each permit
      await Promise.all(appliedPermits.map((x: Permit) => permitService.createPermit(x)));
      await Promise.all(investigatePermits.map((x: Permit) => permitService.createPermit(x)));

      // Delete old draft
      if (req.body.draftId) await draftService.deleteDraft(req.body.draftId);

      res.status(201).json({ activityId: result.activityId, submissionId: result.submissionId });
    } catch (e: unknown) {
      next(e);
    }
  },

  updateDraft: async (req: Request<never, never, Draft>, res: Response, next: NextFunction) => {
    try {
      const update = req.body.draftId && req.body.activityId;

      let response;

      if (update) {
        // Update draft
        response = await draftService.updateDraft({
          ...req.body,
          ...generateUpdateStamps(req.currentContext)
        });
      } else {
        const activityId = (
          await activityService.createActivity(Initiative.HOUSING, generateCreateStamps(req.currentContext))
        )?.activityId;

        // Create new draft
        response = await draftService.createDraft({
          draftId: uuidv4(),
          activityId: activityId,
          draftCode: DraftCode.SUBMISSION,
          data: req.body.data,
          ...generateCreateStamps(req.currentContext)
        });
      }

      res.status(update ? 200 : 201).json({ draftId: response?.draftId, activityId: response?.activityId });
    } catch (e: unknown) {
      next(e);
    }
  },

  updateIsDeletedFlag: async (
    req: Request<{ submissionId: string }, never, { isDeleted: boolean }>,
    res: Response,
    next: NextFunction
  ) => {
    try {
      const response = await submissionService.updateIsDeletedFlag(
        req.params.submissionId,
        req.body.isDeleted,
        generateUpdateStamps(req.currentContext)
      );

      if (!response) {
        return res.status(404).json({ message: 'Submission not found' });
      }

      res.status(200).json(response);
    } catch (e: unknown) {
      next(e);
    }
  },

  updateSubmission: async (req: Request<never, never, Submission>, res: Response, next: NextFunction) => {
    try {
      await contactService.upsertContacts(req.body.contacts, req.currentContext, req.body.activityId);

      const response = await submissionService.updateSubmission({
        ...req.body,
        ...generateUpdateStamps(req.currentContext)
      });

      if (!response) {
        return res.status(404).json({ message: 'Submission not found' });
      }

      res.status(200).json(response);
    } catch (e: unknown) {
      next(e);
    }
  }
};

export default controller;
