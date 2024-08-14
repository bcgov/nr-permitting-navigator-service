import express from 'express';

import { documentController } from '../../controllers';
import { hasAccess, hasAuthorization } from '../../middleware/authorization';
import { requireSomeAuth } from '../../middleware/requireSomeAuth';
import { requireSomeGroup } from '../../middleware/requireSomeGroup';
import { Action, Resource } from '../../utils/enums/application';
import { documentValidator } from '../../validators';

import type { NextFunction, Request, Response } from '../../interfaces/IExpress';

const router = express.Router();
router.use(requireSomeAuth);
router.use(requireSomeGroup);

router.put(
  '/',
  hasAuthorization(Resource.DOCUMENT, Action.CREATE),
  documentValidator.createDocument,
  (req: Request, res: Response, next: NextFunction): void => {
    documentController.createDocument(req, res, next);
  }
);

router.delete(
  '/:documentId',
  hasAuthorization(Resource.DOCUMENT, Action.DELETE),
  hasAccess('documentId'),
  documentValidator.deleteDocument,
  (req: Request, res: Response, next: NextFunction): void => {
    documentController.deleteDocument(req, res, next);
  }
);

router.get(
  '/list/:activityId',
  hasAuthorization(Resource.DOCUMENT, Action.READ),
  documentValidator.listDocuments,
  (req: Request, res: Response, next: NextFunction): void => {
    documentController.listDocuments(req, res, next);
  }
);

export default router;
