import { RouteName } from '@/utils/enums/application';

import type { RouteRecordRaw } from 'vue-router';

const routes: Array<RouteRecordRaw> = [
  {
    path: '/oidc',
    meta: { hideBreadcrumb: true, hideNavbar: true },
    children: [
      {
        path: 'callback',
        name: RouteName.OIDC_CALLBACK,
        component: () => import('@/views/oidc/OidcCallbackView.vue'),
        meta: { title: 'Authenticating...' }
      },
      {
        path: 'login',
        name: RouteName.OIDC_LOGIN,
        component: () => import('@/views/oidc/OidcLoginView.vue'),
        meta: { title: 'Logging in...' }
      },
      {
        path: 'logout',
        name: RouteName.OIDC_LOGOUT,
        component: () => import('@/views/oidc/OidcLogoutView.vue'),
        meta: { title: 'Logging out...' }
      }
    ]
  }
];

export default routes;
