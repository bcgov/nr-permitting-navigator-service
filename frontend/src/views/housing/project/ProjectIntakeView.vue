<script setup lang="ts">
import { onMounted, ref } from 'vue';

import SubmissionIntakeForm from '@/components/housing/submission/SubmissionIntakeForm.vue';
import { permitService } from '@/services';
import { useTypeStore } from '@/store';

import type { Ref } from 'vue';

// Props
const { activityId = undefined, submissionId = undefined } = defineProps<{
  activityId?: string;
  submissionId?: string;
}>();

// State
const loading: Ref<boolean> = ref(true);

// Actions
onMounted(async () => {
  useTypeStore().setPermitTypes((await permitService.getPermitTypes()).data);
  loading.value = false;
});
</script>

<template>
  <!-- 'key' prop remounts component when it changes -->
  <SubmissionIntakeForm
    v-if="!loading"
    :activity-id="activityId"
    :submission-id="submissionId"
  />
</template>
