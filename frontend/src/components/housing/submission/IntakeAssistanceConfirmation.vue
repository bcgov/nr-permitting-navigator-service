<script setup lang="ts">
import { useI18n } from 'vue-i18n';

import { Message } from '@/lib/primevue';

import { RouteName } from '@/utils/enums/application';

// Props
const { assignedActivityId, assignedEnquiryId } = defineProps<{
  assignedActivityId: string;
  assignedEnquiryId: string;
}>();

// State
const { t } = useI18n();
</script>

<template>
  <div>
    <h2>{{ t('intakeAssistance.confirmationHeader') }}</h2>
    <Message
      class="border-0 mb-6"
      severity="success"
      :closable="false"
    >
      {{ t('intakeAssistance.confirmationMessage') }}
    </Message>
    <h3 class="inline-block mr-2 mb-6">{{ t('intakeAssistance.confirmationIdLabel') }}:</h3>
    <router-link
      :to="{
        name: RouteName.HOUSING_ENQUIRY_INTAKE,
        params: { enquiryId: assignedEnquiryId },
        query: { activityId: assignedActivityId }
      }"
    >
      <span class="text-2xl">{{ assignedActivityId }}</span>
    </router-link>
    <div>
      {{ t('intakeAssistance.messagePart1') }}
      <router-link :to="{ name: RouteName.HOUSING_SUBMISSIONS }">
        {{ t('intakeAssistance.linkHousingSubmissions') }}
      </router-link>
      {{ t('intakeAssistance.messagePart2') }}
    </div>
    <div class="mt-6">
      <router-link :to="{ name: RouteName.HOUSING }">{{ t('intakeAssistance.linkSubmissions') }}</router-link>
    </div>
  </div>
</template>

<style scoped lang="scss">
.inline-block {
  display: inline-block;
}
</style>
