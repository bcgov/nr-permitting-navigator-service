import { defineStore } from 'pinia';
import { computed, readonly, ref } from 'vue';

import { Action, GroupName, Initiative, Resource } from '@/utils/enums/application';

import type { Ref } from 'vue';
import type { Permission } from '@/types';

export enum NavigationPermission {
  DEVELOPER = 'developer',

  HOUSING = 'housing',
  HOUSING_ENQUIRY_INTAKE = 'housing_enquiry_intake',
  HOUSING_INTAKE = 'housing_intake',
  HOUSING_PROJECT = 'housing_project',
  HOUSING_SUBMISSIONS = 'housing_submissions',
  HOUSING_USER_MANAGEMENT = 'housing_user_management',
  HOUSING_USER_MANAGEMENT_ADMIN = 'housing_user_management_admin',

  USER = 'user'
}

const NavigationAuthorizationMap = [
  {
    group: GroupName.ADMIN,
    permissions: [
      NavigationPermission.HOUSING_SUBMISSIONS,
      NavigationPermission.HOUSING_USER_MANAGEMENT,
      NavigationPermission.HOUSING_USER_MANAGEMENT_ADMIN,
      NavigationPermission.USER
    ]
  },
  {
    group: GroupName.NAVIGATOR,
    permissions: [NavigationPermission.HOUSING_SUBMISSIONS, NavigationPermission.USER]
  },
  {
    group: GroupName.NAVIGATOR_READ_ONLY,
    permissions: [NavigationPermission.HOUSING_SUBMISSIONS, NavigationPermission.USER]
  },
  {
    group: GroupName.PROPONENT,
    permissions: [
      NavigationPermission.HOUSING,
      NavigationPermission.HOUSING_ENQUIRY_INTAKE,
      NavigationPermission.HOUSING_INTAKE,
      NavigationPermission.HOUSING_PROJECT,
      NavigationPermission.USER
    ]
  },
  {
    group: GroupName.SUPERVISOR,
    permissions: [
      NavigationPermission.HOUSING_SUBMISSIONS,
      NavigationPermission.HOUSING_USER_MANAGEMENT,
      NavigationPermission.USER
    ]
  }
];

export type AuthZStoreState = {
  groups: Ref<Array<GroupName>>;
  permissions: Ref<Array<Permission>>;
  groupOverride: Ref<GroupName | undefined>;
};

export const useAuthZStore = defineStore('authz', () => {
  // State
  const state: AuthZStoreState = {
    groups: ref([]),
    permissions: ref([]),
    groupOverride: ref(undefined)
  };

  // Getters
  const getters = {
    can: computed(
      () => (initiative: Initiative, resource: Resource, action: Action, group?: GroupName) =>
        state.permissions.value.some(
          (x) =>
            initiative === x.initiative &&
            x.resource === resource &&
            x.action === action &&
            (group ? x.group === group : true)
        ) || getters.isInGroup.value([GroupName.DEVELOPER])
    ),
    canNavigate: computed(
      () =>
        (navPerm: NavigationPermission | Array<NavigationPermission>, allowGroupOverride: boolean = true) => {
          const groups =
            allowGroupOverride && state.groupOverride.value ? state.groupOverride.value : state.groups.value;
          const requiredPerms = Array.isArray(navPerm) ? navPerm : [navPerm];
          const perms = NavigationAuthorizationMap.filter((p) => groups?.includes(p.group)).flatMap(
            (p) => p.permissions
          );
          return groups?.includes(GroupName.DEVELOPER) || !!perms.some((p) => requiredPerms?.includes(p));
        }
    ),
    getGroups: computed(() => state.groups.value),
    getGroupOverride: computed(() => state.groupOverride.value),
    isInGroup: computed(() => (group: Array<GroupName>) => state.groups.value.some((x) => group.includes(x)))
  };

  // Actions
  function setPermissions(data: any) {
    state.groups.value = data.groups;
    state.permissions.value = data.permissions;
  }

  function setGroupOverride(group: GroupName | undefined) {
    state.groupOverride.value = group;
  }

  return {
    // State
    state: readonly(state),

    // Getters
    ...getters,

    // Actions
    setPermissions,
    setGroupOverride
  };
});

export default useAuthZStore;
