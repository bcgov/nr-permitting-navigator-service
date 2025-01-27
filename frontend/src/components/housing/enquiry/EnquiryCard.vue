<script setup lang="ts">
import { onMounted, ref } from 'vue';

import Divider from '@/components/common/Divider.vue';
import { Card } from '@/lib/primevue';
import { userService } from '@/services';
import { formatDateShort } from '@/utils/formatters';
import { RouteName } from '@/utils/enums/application';

import type { Ref } from 'vue';
import type { Enquiry } from '@/types';

// Props
const { enquiry } = defineProps<{
  enquiry: Enquiry;
}>();

// State
const userName: Ref<string> = ref('');

// Actions
onMounted(() => {
  if (enquiry.createdBy) {
    userService.searchUsers({ userId: [enquiry.createdBy] }).then((res) => {
      userName.value = res?.data.length ? res?.data[0].fullName : '';
    });
  }
});
</script>

<template>
  <Card :id="enquiry.enquiryId">
    <template #title>
      <div class="flex items-center">
        <div class="grow">
          <h3 class="mb-0">
            <!-- Enquiry: -->
            <router-link
              :to="{
                name: RouteName.HOUSING_SUBMISSIONS_PROJECT_ENQUIRY,
                params: { enquiryId: enquiry.enquiryId },
                query: { activityId: enquiry.activityId }
              }"
            >
              {{ enquiry.activityId }}
            </router-link>
          </h3>
        </div>
      </div>
      <Divider type="solid" />
    </template>
    <template #content>
      <div class="grid grid-cols-12 gap-4 nested-grid">
        <!-- Left column -->
        <div class="col-span-12 md:col-span-6 lg:col-span-3">
          <div class="grid grid-cols-12 gap-4">
            <p class="col-span-12">
              <span class="key font-bold">Date:</span>
              {{ enquiry.submittedAt ? formatDateShort(enquiry.submittedAt) : undefined }}
            </p>
          </div>
        </div>
        <!-- Middle column -->
        <div class="col-span-12 md:col-span-6 lg:col-span-3">
          <div class="grid grid-cols-12 gap-4">
            <p class="col-span-12">
              <span class="key font-bold">Author:</span>
              {{ userName }}
            </p>
          </div>
        </div>
        <!-- Right column -->
        <div class="col-span-12 md:col-span-6 lg:col-span-3">
          <div class="grid grid-cols-12 gap-4">
            <p class="col-span-12">
              <span class="key font-bold">Submission type:</span>
              {{ enquiry.enquiryType }}
            </p>
          </div>
        </div>
        <p class="col-span-12 mt-0 mb-0 enquiry-content">{{ enquiry.enquiryDescription }}</p>
      </div>
    </template>
  </Card>
</template>

<style scoped lang="scss">
p {
  margin-top: 0;
  margin-bottom: 0;
}

.key {
  color: #38598a;
}

.p-card {
  border-style: solid;
  border-width: 1px;

  :deep(.p-card-content) {
    padding-bottom: 0;
  }
}

.enquiry-content {
  white-space: pre;
  text-wrap: balance;
}
</style>
