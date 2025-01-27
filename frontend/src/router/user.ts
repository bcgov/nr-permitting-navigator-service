import { RouteName } from '@/utils/enums/application';

import type { RouteRecordRaw } from 'vue-router';
import { accessHandler } from '@/router';
import { NavigationPermission } from '@/store/authzStore';

const routes: Array<RouteRecordRaw> = [
  {
    path: '/user',
    meta: { hideBreadcrumb: true },
    children: [
      {
        path: '',
        name: RouteName.USER,
        component: () => import('@/views/contact/ContactProfileView.vue'),
        beforeEnter: accessHandler,
        meta: { requiresAuth: true, access: [NavigationPermission.USER] }
      }
    ]
  }
];

export default routes;
