<script setup lang="ts">
import { onMounted, ref } from 'vue';

import { Menubar } from '@/lib/primevue';
import { useAuthZStore } from '@/store';
import { NavigationPermission } from '@/store/authzStore';
import { PCNS_CONTACT } from '@/utils/constants/application';
import { HOUSING_CONTACT } from '@/utils/constants/housing';
import { RouteName } from '@/utils/enums/application';

import type { Ref } from 'vue';

// Types
type NavItem = {
  label: string;
  route?: string;
  public?: boolean;
  access?: NavigationPermission | Array<NavigationPermission>;
  items?: Array<NavItem>;
  mailTo?: string;
};

// Store
const authzStore = useAuthZStore();

// State
const items: Ref<Array<NavItem>> = ref([]);

onMounted(() => {
  items.value = [
    {
      label: 'Home',
      route: RouteName.HOME,
      public: true
    },
    {
      label: 'Housing',
      items: [
        {
          label: 'Submit a housing project to the Navigator Service',
          route: RouteName.HOUSING_INTAKE,
          access: NavigationPermission.HOUSING_INTAKE
        },
        {
          label: 'Submit general enquiries',
          route: RouteName.HOUSING_ENQUIRY_INTAKE,
          access: NavigationPermission.HOUSING_ENQUIRY_INTAKE
        }
      ],
      access: [NavigationPermission.HOUSING_INTAKE, NavigationPermission.HOUSING_ENQUIRY_INTAKE]
    },
    {
      label: 'Submissions',
      route: RouteName.HOUSING_SUBMISSIONS,
      access: NavigationPermission.HOUSING_SUBMISSIONS
    },
    {
      label: 'User Management',
      route: RouteName.HOUSING_USER_MANAGEMENT,
      access: NavigationPermission.HOUSING_USER_MANAGEMENT
    },
    {
      label: 'Developer',
      route: RouteName.DEVELOPER,
      access: NavigationPermission.DEVELOPER
    },
    {
      label: 'Help',
      items: [
        {
          label: 'User Guide',
          route: RouteName.HOUSING_GUIDE
        },
        {
          label: 'Report a problem',
          mailTo: `mailto:${PCNS_CONTACT.email}?subject=${PCNS_CONTACT.subject}`,
          public: true
        },
        {
          label: 'Contact a Navigator',
          mailTo: `mailto:${HOUSING_CONTACT.email}?subject=${HOUSING_CONTACT.subject}`,
          access: [NavigationPermission.HOUSING_INTAKE, NavigationPermission.HOUSING_ENQUIRY_INTAKE]
        }
      ],
      public: true
    }
  ];
});
</script>

<template>
  <Menubar
    :model="items"
    class="!pl-12"
    role="navigation"
  >
    <template #item="{ item, props, hasSubmenu }">
      <span
        v-if="item.public || authzStore.canNavigate(item.access)"
        class="menu-item"
      >
        <router-link
          v-if="item.route"
          v-slot="{ href, navigate }"
          :to="{ name: item.route }"
          custom
        >
          <a
            :href="href"
            v-bind="props.action"
            @click="navigate"
          >
            <span
              :id="item.label"
              class="flex"
            >
              {{ item.label }}
            </span>
          </a>
        </router-link>
        <a
          v-else-if="item.mailTo"
          z
          :href="item.mailTo"
          :target="item.target"
          v-bind="props.action"
        >
          <span :id="item.label">
            {{ item.label }}
          </span>
        </a>
        <a
          v-else
          :aria-labelledby="item.label"
          :href="item.url"
          :target="item.target"
          v-bind="props.action"
        >
          <span class="flex">
            {{ item.label }}
          </span>
          <span
            v-if="hasSubmenu"
            :id="item.label"
            class="pi pi-angle-down mt-1 ml-1"
          />
        </a>
      </span>
    </template>
  </Menubar>
</template>

<style lang="scss" scoped>
a:hover {
  text-decoration: none;
}

:deep(.p-menubar-submenu) {
  li:first-child {
    border-top: 2px solid #fcba19;
  }
}

:deep(.p-menubar-submenu) {
  li:first-child {
    border-top: 2px solid #fcba19;
  }
}
</style>
