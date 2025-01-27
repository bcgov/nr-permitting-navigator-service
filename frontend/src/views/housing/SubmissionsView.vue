<script setup lang="ts">
import { computed, ref } from 'vue';

import BackButton from '@/components/common/BackButton.vue';
import SubmissionsNavigator from '@/components/housing/submission/SubmissionsNavigator.vue';
import { useAuthZStore } from '@/store';
import { NavigationPermission } from '@/store/authzStore';
import { RouteName } from '@/utils/enums/application';

import type { Ref } from 'vue';

// Store
const authzStore = useAuthZStore();

// State
const showCompleted: Ref<boolean> = ref(false);

// Actions
const getTitle = computed(() =>
  authzStore.canNavigate(NavigationPermission.HOUSING_SUBMISSIONS)
    ? showCompleted.value
      ? 'Completed Submissions'
      : 'Active Submissions'
    : 'My drafts and previous entries'
);
</script>

<template>
  <BackButton
    v-if="!authzStore.canNavigate(NavigationPermission.HOUSING_SUBMISSIONS)"
    :route-name="RouteName.HOUSING"
    text="Back to Housing"
  />

  <h1>{{ getTitle }}</h1>

  <!-- Navigator view -->
  <SubmissionsNavigator
    v-if="authzStore.canNavigate(NavigationPermission.HOUSING_SUBMISSIONS)"
    @submissions-navigator:completed="showCompleted = !showCompleted"
  />
</template>
