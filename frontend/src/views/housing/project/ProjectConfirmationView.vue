<script setup lang="ts">
import { Message } from '@/lib/primevue';

import { RouteName } from '@/utils/enums/application';

// Props
const { activityId, submissionId } = defineProps<{
  activityId: string;
  submissionId: string;
}>();
</script>

<template>
  <div>
    <h2>Confirmation of Submission</h2>
    <Message
      severity="success"
      :closable="false"
    >
      Your application has been successfully submitted.
    </Message>
    <h3 class="inline-block my-7 mr-2">Project ID:</h3>
    <router-link
      :to="{
        name: RouteName.HOUSING_PROJECT,
        params: { submissionId: submissionId },
        query: { activityId: activityId }
      }"
    >
      <span class="text-2xl">{{ activityId }}</span>
    </router-link>
    <div>
      Your submission will be reviewed and you will be contacted by a Housing Navigator in 2 business days. Please check
      your email for the confirmation email and keep the project ID for future reference.
    </div>
    <div class="mt-6"><router-link :to="{ name: RouteName.HOUSING }">Back to Housing</router-link></div>
  </div>
</template>

<style scoped lang="scss">
.inline-block {
  display: inline-block;
}
</style>
