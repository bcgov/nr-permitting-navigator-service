import express from 'express';

import { yarsController } from '../../controllers';
import { hasAuthorization } from '../../middleware/authorization';
import { requireSomeAuth } from '../../middleware/requireSomeAuth';
import { requireSomeGroup } from '../../middleware/requireSomeGroup';
import { Action, GroupName } from '../../utils/enums/application';

import type { NextFunction, Request, Response } from 'express';

const router = express.Router();
router.use(requireSomeAuth);
router.use(requireSomeGroup);

// Not exposing this resource
const resource = 'YARS';

router.get('/groups', (req: Request, res: Response, next: NextFunction): void => {
  yarsController.getGroups(req, res, next);
});

router.get('/permissions', (req: Request, res: Response, next: NextFunction): void => {
  yarsController.getPermissions(req, res, next);
});

router.delete(
  '/subject/group',
  (req: Request<never, never, { sub: string; group: GroupName }>, res: Response, next: NextFunction): void => {
    yarsController.deleteSubjectGroup(req, res, next);
  }
);

router.get('/permissions', (req: Request, res: Response, next: NextFunction): void => {
  yarsController.getPermissions(req, res, next);
});

router.get(
  '/group_role_policy_vw',
  hasAuthorization(resource, Action.READ),
  (req: Request, res: Response, next: NextFunction): void => {
    yarsController.getGroupRolePolicyVw(req, res, next);
  }
);

export default router;
