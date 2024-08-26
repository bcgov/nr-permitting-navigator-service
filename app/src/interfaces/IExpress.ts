import * as core from 'express-serve-static-core';

import type { CurrentAuthorization } from '../types/CurrentAuthorization';
import type { CurrentContext } from '../types/CurrentContext';

declare module 'express-serve-static-core' {
  export interface Request {
    currentAuthorization: CurrentAuthorization;
    currentContext: CurrentContext;
  }
}

interface Query extends core.Query {}

interface Params extends core.ParamsDictionary {}
export interface Request<P extends Params = never, Q extends Query = never, B = never> extends core.Request {
  params: P;
  query: Q;
  body: B;
}

export interface Response extends core.Response {}

export interface NextFunction extends core.NextFunction {}
