import { accessHandler, createProps } from '@/router';
import { NavigationPermission } from '@/store/authzStore';
import { RouteName } from '@/utils/enums/application';

import type { RouteRecordRaw } from 'vue-router';

const routes: Array<RouteRecordRaw> = [
  {
    path: '/housing',
    meta: { requiresAuth: true, breadcrumb: 'Housing' },
    children: [
      {
        path: '',
        name: RouteName.HOUSING,
        component: () => import('../views/housing/HousingView.vue'),
        beforeEnter: accessHandler,
        meta: {
          access: [NavigationPermission.HOUSING],
          breadcrumb: 'Housing'
        }
      },
      {
        path: 'enquiry',
        component: () => import('@/views/GenericView.vue'),
        children: [
          {
            path: '',
            name: RouteName.HOUSING_ENQUIRY_INTAKE,
            component: () => import('@/views/housing/enquiry/EnquiryIntakeView.vue'),
            beforeEnter: accessHandler,
            props: createProps,
            meta: {
              access: [NavigationPermission.HOUSING_ENQUIRY_INTAKE],
              breadcrumb: 'Enquiry Form'
            }
          },
          {
            path: ':enquiryId',
            name: RouteName.HOUSING_ENQUIRY_SUBMITTED,
            component: () => import('@/views/housing/enquiry/EnquiryIntakeView.vue'),
            beforeEnter: accessHandler,
            props: createProps,
            meta: {
              access: [NavigationPermission.HOUSING_ENQUIRY_INTAKE],
              breadcrumb: 'Enquiry Form'
            }
          },
          {
            path: 'confirmation/:activityId',
            name: RouteName.HOUSING_ENQUIRY_CONFIRMATION,
            component: () => import('@/views/housing/enquiry/EnquiryConfirmationView.vue'),
            beforeEnter: accessHandler,
            props: createProps,
            meta: {
              access: [NavigationPermission.HOUSING_ENQUIRY_INTAKE],
              hideBreadcrumb: true
            }
          }
        ]
      },
      {
        path: 'intake',
        component: () => import('@/views/GenericView.vue'),
        meta: {
          access: [NavigationPermission.HOUSING_INTAKE]
        },
        children: [
          {
            path: '',
            name: RouteName.HOUSING_INTAKE,
            component: () => import('@/views/housing/project/ProjectIntakeView.vue'),
            beforeEnter: accessHandler,
            props: createProps,
            meta: {
              breadcrumb: 'Project Intake Form'
            }
          },
          {
            path: ':draftId',
            name: RouteName.HOUSING_INTAKE_DRAFT,
            component: () => import('@/views/housing/project/ProjectIntakeView.vue'),
            beforeEnter: accessHandler,
            props: createProps,
            meta: {
              breadcrumb: 'Project Intake Form'
            }
          },
          {
            path: 'confirmation/:activityId/:submissionId',
            name: RouteName.HOUSING_INTAKE_CONFIRMATION,
            component: () => import('@/views/housing/project/ProjectConfirmationView.vue'),
            beforeEnter: accessHandler,
            props: createProps,
            meta: {
              hideBreadcrumb: true
            }
          }
        ]
      },
      {
        path: 'project',
        component: () => import('@/views/GenericView.vue'),
        children: [
          {
            path: ':submissionId',
            component: () => import('@/views/GenericView.vue'),
            meta: {
              access: [NavigationPermission.HOUSING_PROJECT]
            },
            children: [
              {
                path: '',
                name: RouteName.HOUSING_PROJECT,
                component: () => import('@/views/housing/project/ProjectView.vue'),
                beforeEnter: accessHandler,
                props: createProps,
                meta: {
                  breadcrumb: 'Project',
                  breadcrumb_dynamic: true
                }
              },
              {
                path: 'enquiry',
                component: () => import('@/views/GenericView.vue'),
                children: [
                  {
                    path: '',
                    name: RouteName.HOUSING_PROJECT_ENQUIRY,
                    component: () => import('@/views/housing/enquiry/EnquiryIntakeView.vue'),
                    beforeEnter: accessHandler,
                    props: createProps,
                    meta: {
                      breadcrumb: 'Enquiry Form'
                    }
                  },
                  {
                    path: ':enquiryId',
                    name: RouteName.HOUSING_PROJECT_ENQUIRY,
                    component: () => import('@/views/housing/enquiry/EnquiryIntakeView.vue'),
                    beforeEnter: accessHandler,
                    props: createProps,
                    meta: {
                      breadcrumb: 'Enquiry Form'
                    }
                  }
                ]
              },
              {
                path: 'intake',
                name: RouteName.HOUSING_PROJECT_INTAKE,
                component: () => import('@/views/housing/project/ProjectIntakeView.vue'),
                beforeEnter: accessHandler,
                props: createProps,
                meta: {
                  breadcrumb: 'Project Intake Form'
                }
              },
              {
                path: 'permit/:permitId',
                component: () => import('@/views/GenericView.vue'),
                children: [
                  {
                    path: '',
                    name: RouteName.HOUSING_PROJECT_PERMIT,
                    component: () => import('@/views/permit/PermitStatusView.vue'),
                    beforeEnter: accessHandler,
                    props: createProps,
                    meta: {
                      breadcrumb: 'Permit',
                      breadcrumb_dynamic: true
                    }
                  },
                  {
                    path: 'enquiry',
                    name: RouteName.HOUSING_PROJECT_PERMIT_ENQUIRY,
                    component: () => import('@/views/housing/enquiry/EnquiryIntakeView.vue'),
                    beforeEnter: accessHandler,
                    props: createProps,
                    meta: {
                      breadcrumb: 'Enquiry Form'
                    }
                  }
                ]
              }
            ]
          }
        ]
      },
      {
        path: 'submissions',
        component: () => import('@/views/GenericView.vue'),
        meta: {
          access: [NavigationPermission.HOUSING_SUBMISSIONS]
        },
        children: [
          {
            path: '',
            name: RouteName.HOUSING_SUBMISSIONS,
            component: () => import('@/views/housing/SubmissionsView.vue'),
            beforeEnter: accessHandler,
            meta: {
              breadcrumb: 'Submissions'
            }
          },
          {
            path: ':submissionId',
            component: () => import('@/views/GenericView.vue'),
            meta: {
              breadcrumb: 'Project',
              breadcrumb_dynamic: true
            },
            children: [
              {
                path: '',
                name: RouteName.HOUSING_SUBMISSIONS_PROJECT,
                component: () => import('@/views/housing/submission/SubmissionView.vue'),
                beforeEnter: accessHandler,
                props: createProps
              },
              {
                path: 'enquiry',
                component: () => import('@/views/GenericView.vue'),
                children: [
                  {
                    path: ':enquiryId',
                    name: RouteName.HOUSING_SUBMISSIONS_PROJECT_ENQUIRY,
                    component: () => import('@/views/housing/enquiry/EnquiryView.vue'),
                    beforeEnter: accessHandler,
                    props: createProps,
                    meta: {
                      breadcrumb: 'Permit',
                      breadcrumb_dynamic: true
                    }
                  }
                ]
              },
              {
                path: 'proponent',
                component: () => import('@/views/GenericView.vue'),
                children: [
                  {
                    path: '',
                    name: RouteName.HOUSING_SUBMISSIONS_PROJECT_PROPONENT,
                    component: () => import('@/views/housing/submission/SubmissionView.vue'),
                    beforeEnter: accessHandler,
                    props: createProps,
                    meta: {
                      breadcrumb: 'Proponent view'
                    }
                  },
                  {
                    path: ':permitId',
                    name: RouteName.HOUSING_SUBMISSIONS_PROJECT_PROPONENT_PERMIT,
                    component: () => import('@/views/housing/submission/SubmissionView.vue'),
                    beforeEnter: accessHandler,
                    props: createProps,
                    meta: {
                      breadcrumb: 'Permit',
                      breadcrumb_dynamic: true
                    }
                  }
                ]
              }
            ]
          },
          {
            path: 'enquiry',
            component: () => import('@/views/GenericView.vue'),
            children: [
              {
                path: ':enquiryId',
                name: RouteName.HOUSING_SUBMISSIONS_ENQUIRY,
                component: () => import('@/views/housing/enquiry/EnquiryView.vue'),
                beforeEnter: accessHandler,
                props: createProps,
                meta: {
                  breadcrumb: 'Enquiry',
                  breadcrumb_dynamic: true
                }
              }
            ]
          }
        ]
      },
      {
        path: '/guide',
        name: RouteName.HOUSING_GUIDE,
        component: () => import('@/views/ComingSoon.vue'),
        meta: { access: [NavigationPermission.HOUSING] }
      },
      {
        path: '/user',
        name: RouteName.HOUSING_USER_MANAGEMENT,
        component: () => import('@/views/user/UserManagementView.vue'),
        beforeEnter: accessHandler,
        meta: { requiresAuth: true, access: [NavigationPermission.HOUSING_USER_MANAGEMENT] }
      }
    ]
  }
];

export default routes;
