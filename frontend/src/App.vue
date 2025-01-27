<script setup lang="ts">
import { storeToRefs } from 'pinia';
import { onBeforeMount, onErrorCaptured, ref } from 'vue';
import { RouterView, useRoute } from 'vue-router';

import Breadcrumb from './components/common/Breadcrumb.vue';
import { AppLayout, Navbar, ProgressLoader } from '@/components/layout';
import { ConfirmDialog, Message, Toast, useToast } from '@/lib/primevue';
import { useAppStore, useAuthNStore, useConfigStore } from '@/store';
import { ToastTimeout } from '@/utils/enums/application';

import type { Ref } from 'vue';

// Store
const appStore = useAppStore();
const route = useRoute();
const { getIsLoading } = storeToRefs(appStore);
const { getConfig } = storeToRefs(useConfigStore());

// State
const ready: Ref<boolean> = ref(false);

// Actions
onBeforeMount(async () => {
  appStore.beginDeterminateLoading();
  await useConfigStore().init();
  await useAuthNStore().init();
  appStore.endDeterminateLoading();
  ready.value = true;
});

// Top level error handler
onErrorCaptured((e: Error) => {
  const toast = useToast();
  toast.error('Error', e.message, { life: ToastTimeout.STICKY });
});
</script>

<template>
  <ConfirmDialog />
  <ProgressLoader v-if="getIsLoading" />
  <Toast />

  <AppLayout>
    <template #nav>
      <Navbar v-if="!route.meta.hideNavbar" />
    </template>
    <template #main>
      <Message
        v-if="getConfig?.notificationBanner"
        severity="warn"
        class="text-center"
      >
        {{ getConfig?.notificationBanner }}
      </Message>
      <Breadcrumb v-if="!route.meta.hideBreadcrumb" />
      <RouterView v-if="ready" />
    </template>
  </AppLayout>
</template>
