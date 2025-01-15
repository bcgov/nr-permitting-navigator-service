<script setup lang="ts">
import { Message } from '@/lib/primevue';

import { RouteName } from '@/utils/enums/application';

// Props
const { showHeader = true, showHomeLink = true } = defineProps<{
  showHeader?: boolean;
  showHomeLink?: boolean;
}>();
</script>

<template>
  <div>
    <h2 v-if="showHeader">Confirmation of Submission</h2>
    <Message
      class="border-none"
      severity="success"
      :closable="false"
    >
      Your enquiry has been successfully submitted.
    </Message>
    <div>
      Your submission will be reviewed and you will be contacted by your Housing Navigator in 2 business days. Please
      check your email for the confirmation email and keep the enquiry ID for future reference.
    </div>
    <div
      v-if="showHomeLink"
      class="mt-4"
    >
      <router-link :to="{ name: RouteName.HOUSING }">Back to Housing</router-link>
    </div>
  </div>
</template>
