import { mapService, submissionService } from '../services';
import type { NextFunction, Request, Response } from 'express';

const controller = {
  getPIDs: async (req: Request<{ submissionId: string }>, res: Response, next: NextFunction) => {
    try {
      const submission = await submissionService.getSubmission(req.params.submissionId);

      let response;
      if (submission?.geoJSON) response = await mapService.getPIDs(submission?.geoJSON);

      res.status(200).json(response);
    } catch (e: unknown) {
      next(e);
    }
  }
};

export default controller;
