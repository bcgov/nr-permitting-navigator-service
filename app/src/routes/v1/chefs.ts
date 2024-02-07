import express from 'express';
import { chefsController } from '../../controllers';
import { requireChefsFormConfigData } from '../../middleware/requireChefsFormConfigData';
import { requireSomeAuth } from '../../middleware/requireSomeAuth';

import type { NextFunction, Request, Response } from '../../interfaces/IExpress';

const router = express.Router();
router.use(requireSomeAuth);

// CHEFS export endpoint
router.get('/export', (req: Request, res: Response, next: NextFunction): void => {
  chefsController.getFormExport(req, res, next);
});

// Statistics endpoint
router.get('/submission/statistics', (req: Request, res: Response, next: NextFunction): void => {
  chefsController.getStatistics(req, res, next);
});

// Submission endpoint
router.get(
  '/submission/:submissionId',
  requireChefsFormConfigData,
  (req: Request, res: Response, next: NextFunction): void => {
    chefsController.getSubmission(req, res, next);
  }
);

// Submission update endpoint
router.put('/submission/:submissionId', (req: Request, res: Response, next: NextFunction): void => {
  chefsController.updateSubmission(req, res, next);
});

export default router;
