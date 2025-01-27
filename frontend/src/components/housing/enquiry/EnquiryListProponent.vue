<script setup lang="ts">
import { ref } from 'vue';
import { useI18n } from 'vue-i18n';

import { Spinner } from '@/components/layout';
import { Column, DataTable } from '@/lib/primevue';
import { RouteName } from '@/utils/enums/application';
import { IntakeStatus } from '@/utils/enums/housing';
import { formatDate } from '@/utils/formatters';

import type { Ref } from 'vue';
import type { Enquiry } from '@/types';

// Props
const { loading, enquiries } = defineProps<{
  loading: boolean;
  enquiries: Array<Enquiry> | undefined;
}>();

// State
const selection: Ref<Enquiry | undefined> = ref(undefined);

// Actions
const { t } = useI18n();
</script>

<template>
  <DataTable
    v-model:selection="selection"
    :loading="loading"
    :value="enquiries"
    data-key="enquiryId"
    scrollable
    responsive-layout="scroll"
    :paginator="true"
    :rows="5"
    sort-field="submittedAt"
    :sort-order="-1"
    paginator-template="FirstPageLink PrevPageLink CurrentPageReport NextPageLink LastPageLink"
    :current-page-report-template="`({currentPage} ${t('enquiryListProponent.of')} {totalPages})`"
    :rows-per-page-options="[10, 20, 50]"
    selection-mode="single"
    :alt="t('enquiryListProponent.tableAlt')"
  >
    <template #empty>
      <div class="flex justify-center">
        <p class="font-bold">
          {{ t('enquiryListProponent.listEmpty') }}
        </p>
      </div>
    </template>
    <template #loading>
      <Spinner />
    </template>
    <Column
      field="activity.activityId"
      :header="t('enquiryListProponent.enquiryId')"
      :sortable="true"
      style="width: 45%"
    >
      <template #body="{ data }">
        <div :data-activityId="data.activityId">
          <router-link
            :to="{
              name: RouteName.HOUSING_ENQUIRY_SUBMITTED,
              params: { enquiryId: data.enquiryId },
              query: { activityId: data.activityId }
            }"
          >
            {{ data.activityId }}
          </router-link>
        </div>
      </template>
    </Column>
    <Column
      field="intakeStatus"
      :header="t('enquiryListProponent.state')"
      :sortable="true"
    />

    <Column
      field="submittedAt"
      :header="t('enquiryListProponent.submittedDate')"
      :sortable="true"
      header-class="header-right"
      class="!text-right"
    >
      <template #body="{ data }">
        {{ data.intakeStatus !== IntakeStatus.DRAFT ? formatDate(data?.submittedAt) : undefined }}
      </template>
    </Column>
  </DataTable>
</template>
