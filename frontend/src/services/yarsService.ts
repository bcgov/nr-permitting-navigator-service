import type { GroupName } from '@/utils/enums/application';
import { appAxios } from './interceptors';

import type { AxiosResponse } from 'axios';

const PATH = 'yars';

export default {
  getGroups(): Promise<AxiosResponse> {
    return appAxios().get(`${PATH}/groups`);
  },

  getPermissions(): Promise<AxiosResponse> {
    return appAxios().get(`${PATH}/permissions`);
  },

  deleteSubjectGroup(data: { sub: string; group: GroupName }): Promise<AxiosResponse> {
    return appAxios().delete(`${PATH}/subject/group`, { data });
  },

  getGroupRolePolicyVw(): Promise<AxiosResponse> {
    return appAxios().get(`${PATH}/group_role_policy_vw`);
  }
};
