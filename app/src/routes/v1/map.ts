import express from 'express';

import { mapController } from '../../controllers';
import { hasAuthorization } from '../../middleware/authorization';
import { requireSomeAuth } from '../../middleware/requireSomeAuth';
import { requireSomeGroup } from '../../middleware/requireSomeGroup';
import { Action, Resource } from '../../utils/enums/application';

import type { NextFunction, Request, Response } from 'express';

const router = express.Router();
router.use(requireSomeAuth);
router.use(requireSomeGroup);

router.get(
  '/pids/:submissionId',
  hasAuthorization(Resource.SUBMISSION, Action.READ),
  (req: Request<{ submissionId: string }>, res: Response, next: NextFunction): void => {
    mapController.getPIDs(req, res, next);
  }
);

export default router;
