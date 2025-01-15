<script setup lang="ts">
import { ref } from 'vue';

import EnquiryIntakeConfirmation from '@/components/housing/enquiry/EnquiryIntakeConfirmation.vue';
import { Button, Dialog, Textarea } from '@/lib/primevue';
import { useSubmissionStore } from '@/store';
import { formatDate } from '@/utils/formatters';

import type { Ref } from 'vue';
import type { User } from '@/types';

// Props
const { confirmationId = '', navigator } = defineProps<{
  confirmationId?: string;
  navigator?: User;
}>();

// Store
const { getSubmission } = useSubmissionStore();

// State
const enquiryDescription: Ref<string> = ref('');
const visible = defineModel<boolean | undefined>('visible');

// Actions
const emits = defineEmits(['onHide', 'onSumbitEnquiry']);

const onSubmitEnquiry = () => {
  if (enquiryDescription.value) emits('onSumbitEnquiry', enquiryDescription.value);
};

const handleCloseDialog = () => {
  emits('onHide');
  enquiryDescription.value = '';
};
</script>

<template>
  <Dialog
    v-model:visible="visible"
    :draggable="false"
    :modal="true"
    class="app-info-dialog w-6"
    @hide="handleCloseDialog"
  >
    <template #header>
      <span class="p-dialog-title">New enquiry for: {{ getSubmission?.projectName }}</span>
    </template>
    <template #default>
      <div v-if="!confirmationId">
        <div class="flex flex-column">
          <div>
            <div>
              Project ID:
              <span class="font-bold">{{ getSubmission?.activityId }}</span>
            </div>
            <div
              v-if="getSubmission?.streetAddress"
              class="mt-3"
            >
              Location:
              <span class="font-bold">{{ getSubmission?.streetAddress }}</span>
            </div>
            <div
              v-if="getSubmission?.latitude"
              class="mt-3"
            >
              Latitude / Longitude:
              <span class="font-bold">{{ getSubmission?.latitude }} {{ getSubmission?.longitude }}</span>
            </div>
            <div
              v-if="getSubmission?.submittedAt"
              class="mt-3"
            >
              Submission date:
              <span class="font-bold">{{ formatDate(getSubmission?.submittedAt) }}</span>
            </div>
          </div>
        </div>
        <div class="mb-2 mt-4 font-bold">
          <span class="query-to-nav mt-3">To: {{ navigator?.firstName }} {{ navigator?.lastName }}</span>
        </div>
        <Textarea
          v-model="enquiryDescription"
          aria-describedby="ask-navigator"
          placeholder="Ask a navigator"
          class="w-full"
          maxlength="4000"
          rows="5"
        />
        <div class="max-w-full text-center mt-5">
          <Button
            class="p-button-sm header-btn"
            label="Submit Enquiry"
            @click="onSubmitEnquiry"
          />
          <Button
            class="p-button-sm ml-3"
            outlined
            label="Cancel"
            @click="visible = false"
          />
        </div>
      </div>
      <div v-else>
        <EnquiryIntakeConfirmation
          :show-header="false"
          :show-home-link="false"
        />
        <div class="max-w-full text-center mt-5">
          <Button
            class="p-button-sm ml-3"
            outlined
            label="Close"
            @click="visible = false"
          />
        </div>
      </div>
    </template>
  </Dialog>
</template>

<style scoped lang="scss">
.permit-data {
  overflow: hidden;
  text-overflow: ellipsis;
}

.permit-label {
  white-space: pre;
}
</style>
