<script setup lang="ts">
import { ref } from 'vue';

import EnquiryIntakeConfirmation from '@/components/housing/enquiry/EnquiryIntakeConfirmation.vue';
import { Button, Dialog, Textarea } from '@/lib/primevue';
import { formatDate } from '@/utils/formatters';

import type { Permit, PermitType, User } from '@/types';
import type { Ref } from 'vue';

// Types
type CombinedPermit = Permit & PermitType;

// Props
const {
  permit,
  confirmationId = '',
  navigator,
  updatedBy
} = defineProps<{
  permit: CombinedPermit | undefined;
  confirmationId?: string;
  navigator: User | undefined;
  updatedBy: string | undefined;
}>();

// State
const enquiryDescription: Ref<string> = ref('');
const visible = defineModel<boolean>('visible');

// Actions
const emits = defineEmits(['onHide', 'onSumbitEnquiry']);

const handleCloseDialog = () => {
  emits('onHide');
  enquiryDescription.value = '';
  visible.value = false;
};

const onSubmitEnquiry = () => {
  if (enquiryDescription.value) {
    const enquiryMessage = `Re: ${permit?.name} \nTracking ID: ${permit?.trackingId} \n\n` + enquiryDescription.value;
    emits('onSumbitEnquiry', enquiryMessage);
  }
};
</script>

<template>
  <Dialog
    v-model:visible="visible"
    :draggable="false"
    :modal="true"
    class="app-info-dialog w-6 dialog-container"
    @hide="handleCloseDialog"
  >
    <template #header>
      <span class="p-dialog-title">{{ permit?.name }}</span>
    </template>
    <template #default>
      <div v-if="!confirmationId">
        <div class="grid mb-3">
          <div class="col-6 flex">
            <div class="mr-1 permit-label">Tracking ID:</div>
            <div
              v-tooltip="{ value: permit?.trackingId }"
              class="font-bold permit-data"
            >
              {{ permit?.trackingId }}
            </div>
          </div>
          <div class="col-6 flex">
            <div class="mr-1 permit-label">Submitted date:</div>
            <div
              v-tooltip="{ value: formatDate(permit?.submittedDate) }"
              class="font-bold permit-data"
            >
              {{ formatDate(permit?.submittedDate) }}
            </div>
          </div>
          <div class="col-6 flex">
            <div class="mr-1 permit-label">Permit ID:</div>
            <div
              v-tooltip="{ value: permit?.issuedPermitId }"
              class="font-bold permit-data"
            >
              {{ permit?.issuedPermitId }}
            </div>
          </div>
          <div class="col-6 flex">
            <div class="mr-1 permit-label">Adjudication date:</div>
            <div
              v-tooltip="{ value: formatDate(permit?.adjudicationDate) }"
              class="font-bold permit-data"
            >
              {{ formatDate(permit?.adjudicationDate) }}
            </div>
          </div>
          <div class="col-6 flex">
            <div class="mr-1 permit-label">Updated by:</div>
            <div
              v-tooltip="{ value: updatedBy }"
              class="font-bold permit-data"
            >
              {{ updatedBy }}
            </div>
          </div>
          <div class="col-6 flex">
            <div class="mr-1 permit-label">Status verified date:</div>
            <div
              v-tooltip="{ value: formatDate(permit?.statusLastVerified) }"
              class="font-bold permit-data"
            >
              {{ formatDate(permit?.statusLastVerified) }}
            </div>
          </div>
          <div class="col-12 flex">
            <div class="mr-1 permit-label">Agency:</div>
            <div class="font-bold">{{ permit?.agency }}</div>
          </div>
        </div>
        <div class="mb-2 mt-4 font-bold">
          <span class="query-to-nav mt-3">To: {{ navigator?.firstName }} {{ navigator?.lastName }}</span>
        </div>
        <Textarea
          v-model="enquiryDescription"
          aria-describedby="ask-navigator"
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
.dialog-container {
  width: 50%;
  max-height: 90%;
  box-shadow: 0rem 0.25rem 0.625rem 0rem rgba(0, 0, 0, 0.2);
}

.permit-data {
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}

.permit-label {
  white-space: pre;
}
</style>
