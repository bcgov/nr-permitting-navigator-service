import { storeToRefs } from 'pinia';
import { createRouter, createWebHistory } from 'vue-router';

import { default as housingRoutes } from '@/router/housing';
import { default as oidcRoutes } from '@/router/oidc';
import { default as userRoutes } from '@/router/user';
import { AuthService, contactService, yarsService } from '@/services';
import { useAppStore, useAuthNStore, useAuthZStore, useContactStore } from '@/store';
import { NavigationPermission } from '@/store/authzStore';
import { RouteName, StorageKey } from '@/utils/enums/application';

import type { RouteLocationNormalizedGeneric, RouteRecordRaw } from 'vue-router';
import type { Contact } from '@/types';

/**
 * @function accessHandler
 * Checks for user access to the requested route and redirect if necessary
 * @param {object} to The route to navigate to
 * @returns {object} a Vue route
 */
export function accessHandler(to: RouteLocationNormalizedGeneric) {
  const access = to.meta.access as NavigationPermission[];

  console.log('Access: ', access);
  if (access && access.length) {
    const authzStore = useAuthZStore();
    if (!authzStore.canNavigate(access)) {
      return { name: RouteName.NOT_FOUND };
    }
  }
}

/**
 * @function bootstrap
 * Obtains user permissions if authenticated before hard navigation
 * @returns {object} a Vue route
 */
async function bootstrap() {
  const authnStore = useAuthNStore();
  const authzStore = useAuthZStore();
  const contactStore = useContactStore();

  const { getIsAuthenticated } = storeToRefs(authnStore);

  if (getIsAuthenticated.value && !authzStore.getGroups.length) {
    const permissions = await yarsService.getPermissions();
    authzStore.setPermissions(permissions.data);
    const contact: Contact = (await contactService.getCurrentUserContact())?.data;
    contactStore.setContact(contact);
  }
}

/**
 * @function createProps
 * Parses the route query and params to generate Vue props
 * @param {object} route The route object
 * @returns {object} a Vue props object
 */
export function createProps(route: { query: any; params: any }): object {
  return { ...route.query, ...route.params };
}

const routes: Array<RouteRecordRaw> = [
  {
    path: '/',
    component: () => import('@/views/GenericView.vue'),
    beforeEnter: [bootstrap, accessHandler],
    children: [
      {
        path: '/',
        name: RouteName.HOME,
        component: () => import('@/views/HomeView.vue'),
        meta: { hideBreadcrumb: true, hideNavbar: true }
      },
      {
        path: '/developer',
        name: RouteName.DEVELOPER,
        component: () => import('@/views/DeveloperView.vue'),
        beforeEnter: accessHandler,
        meta: { requiresAuth: true, access: [NavigationPermission.DEVELOPER] }
      },
      {
        path: '/forbidden',
        name: RouteName.FORBIDDEN,
        component: () => import('@/views/Forbidden.vue')
      },

      ...housingRoutes,
      ...oidcRoutes,
      ...userRoutes,

      {
        path: '/:pathMatch(.*)*',
        name: RouteName.NOT_FOUND,
        component: () => import('@/views/NotFound.vue'),
        meta: { hideBreadcrumb: true }
      }
    ]
  }
];

export default function getRouter() {
  const appStore = useAppStore();
  const authService = new AuthService();

  const router = createRouter({
    history: createWebHistory(),
    routes,
    scrollBehavior(to, from) {
      // Scroll to hash
      // Slight delay to account for asynchronous loading
      if (to.hash) {
        return new Promise((resolve) => {
          setTimeout(() => {
            resolve({
              el: to.hash,
              behavior: 'smooth'
            });
          }, 500);
        });
      } else {
        // Do not scroll if same page
        if (to.name === from.name) return false;
      }

      // default scroll to top
      return { top: 0 };
    }
  });

  router.beforeEach(async (to) => {
    appStore.beginDeterminateLoading();

    // Backend Redirection Handler
    if (to.query?.r) {
      router.replace({
        path: to.query.r ? to.query.r.toString() : to.path,
        // eslint-disable-next-line @typescript-eslint/no-unused-vars, no-unused-vars
        query: (({ r, ...q }) => q)(to.query)
      });
    }

    // Authentication guard
    if (to.meta.requiresAuth) {
      const user = await authService.getUser();
      if (!user || user.expired) {
        window.sessionStorage.setItem(StorageKey.AUTH, `${to.fullPath}`);
        router.replace({ name: RouteName.OIDC_LOGIN });
        return;
      }
    }
  });

  router.afterEach(() => {
    appStore.endDeterminateLoading();
  });

  return router;
}
