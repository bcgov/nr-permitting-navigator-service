<script setup lang="ts">
import { ref } from 'vue';
import { useI18n } from 'vue-i18n';
import { useRouter } from 'vue-router';

import { Button, Menu } from '@/lib/primevue';
import { storeToRefs } from 'pinia';
import { useAuthNStore } from '@/store';

import { type Ref } from 'vue';
import { RouteName } from '@/utils/enums/application';

// Store
const { getIsAuthenticated, getProfile } = storeToRefs(useAuthNStore());

// State
const { t } = useI18n();
const items = ref([
  {
    label: t('headerMenu.contactProfile'),
    icon: 'pi pi-user',
    command: () => {
      router.push({ name: RouteName.USER });
    }
  },
  {
    label: t('headerMenu.logout'),
    icon: 'pi pi-sign-out',
    command: () => {
      router.push({ name: RouteName.OIDC_LOGOUT });
    }
  }
]);
const menu: Ref<typeof Menu | undefined> = ref(undefined);

// Actions
const router = useRouter();

const toggle = (event: any) => {
  menu.value?.toggle(event);
};
</script>

<template>
  <div
    v-if="getIsAuthenticated"
    class="card flex justify-center"
  >
    <Button
      id="menu-toggle"
      type="button"
      text
      class="font-bold text-lg"
      aria-haspopup="true"
      aria-controls="overlay-menu"
      @click="toggle"
    >
      {{ getProfile?.name ?? getProfile?.display_name }}
      <font-awesome-icon
        icon="fa-solid fa-bars"
        class="ml-2 app-primary-color no-click"
      />
    </Button>
    <Menu
      id="overlay-menu"
      ref="menu"
      :model="items"
      :popup="true"
    />
  </div>
</template>
