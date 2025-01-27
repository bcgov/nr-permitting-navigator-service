<script setup lang="ts">
import { ref } from 'vue';
import { useRoute, useRouter } from 'vue-router';

import { Spinner } from '@/components/layout';
import {
  Button,
  Column,
  DataTable,
  FilterMatchMode,
  IconField,
  InputIcon,
  InputText,
  useConfirm,
  useToast
} from '@/lib/primevue';
import { enquiryService } from '@/services';
import { useAuthZStore } from '@/store';
import { Action, Initiative, Resource, RouteName } from '@/utils/enums/application';
import { IntakeStatus } from '@/utils/enums/housing';
import { formatDate } from '@/utils/formatters';
import { toNumber } from '@/utils/utils';

import type { Ref } from 'vue';
import type { Enquiry } from '@/types';

// Types
type Pagination = {
  rows?: number;
  order?: number;
  field?: string;
  page?: number;
};

// Props
const { loading, enquiries } = defineProps<{
  loading: boolean;
  enquiries: Array<Enquiry> | undefined;
}>();

// Emit
const emit = defineEmits(['enquiry:delete']);

// State
const route = useRoute();
const selection: Ref<Enquiry | undefined> = ref(undefined);
const pagination: Ref<Pagination> = ref({
  rows: 10,
  order: -1,
  field: 'submittedAt',
  page: 0
});

// read from query params if tab is set to enquiry otherwise use default values
if (route.query.tab === '1') {
  pagination.value.rows = toNumber(route.query.rows as string) ?? 10;
  pagination.value.order = toNumber(route.query.order as string) ?? -1;
  pagination.value.field = (route.query.field as string) ?? 'submittedAt';
  pagination.value.page = toNumber(route.query.page as string) ?? 0;
}

// Actions
const confirm = useConfirm();
const toast = useToast();
const router = useRouter();

function onDelete(enquiryId: string, activityId: string) {
  confirm.require({
    message: 'Please confirm that you want to delete this enquiry',
    header: 'Delete enquiry?',
    acceptLabel: 'Confirm',
    acceptClass: 'p-button-danger',
    rejectLabel: 'Cancel',
    rejectProps: { outlined: true },
    accept: () => {
      enquiryService
        .updateIsDeletedFlag(enquiryId, true)
        .then(() => {
          emit('enquiry:delete', enquiryId, activityId);
          selection.value = undefined;
          toast.success('Enquiry deleted');
        })
        .catch((e: any) => toast.error('Failed to delete enquiry', e.message));
    }
  });
}

// Datatable filter(s)
const filters = ref({
  global: { value: null, matchMode: FilterMatchMode.CONTAINS }
});

// Actions
function updateQueryParams() {
  router.replace({
    name: router.currentRoute.value.name,
    query: {
      rows: pagination.value.rows ?? undefined,
      order: pagination.value.order ?? undefined,
      field: pagination.value.field ?? undefined,
      page: pagination.value.page ?? undefined,
      tab: route.query.tab ?? 1
    }
  });
}
</script>

<template>
  <DataTable
    v-model:filters="filters"
    v-model:selection="selection"
    :loading="loading"
    :value="enquiries"
    data-key="enquiryId"
    scrollable
    responsive-layout="scroll"
    :paginator="true"
    :rows="pagination.rows"
    :sort-field="pagination.field"
    :sort-order="pagination.order"
    paginator-template="RowsPerPageDropdown CurrentPageReport PrevPageLink NextPageLink "
    current-page-report-template="{first}-{last} of {totalRecords}"
    :rows-per-page-options="[10, 20, 50]"
    selection-mode="single"
    :first="pagination.page && pagination.rows ? pagination.page * pagination.rows : 0"
    @update:sort-field="
      (e) => {
        pagination.field = e;
        pagination.page = 0;
        updateQueryParams();
      }
    "
    @update:sort-order="
      (e) => {
        pagination.order = e ?? -1;
        pagination.page = 0;
        updateQueryParams();
      }
    "
    @page="
      (e) => {
        pagination.page = e.page;
        pagination.rows = e.rows;
        updateQueryParams();
      }
    "
  >
    <template #empty>
      <div class="flex justify-center">
        <h3>No items found.</h3>
      </div>
    </template>
    <template #loading>
      <Spinner />
    </template>
    <template #header>
      <div class="flex justify-end">
        <IconField icon-position="left">
          <InputIcon class="pi pi-search" />
          <InputText
            v-model="filters['global'].value"
            placeholder="Search all"
          />
        </IconField>
      </div>
    </template>
    <Column
      field="activity.activityId"
      header="Enquiry ID"
      :sortable="true"
      style="min-width: 136px"
      frozen
    >
      <template #body="{ data }">
        <div :data-activityId="data.activityId">
          <router-link
            :to="{
              name: RouteName.HOUSING_SUBMISSIONS_ENQUIRY,
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
      field="contacts.0.firstName"
      header="Contact first name"
      :sortable="true"
      style="min-width: 200px"
    />
    <Column
      field="contacts.0.lastName"
      header="Contact last name"
      :sortable="true"
      style="min-width: 200px"
    />
    <Column
      field="contacts.0.phoneNumber"
      header="Contact phone"
      :sortable="true"
      style="min-width: 200px"
    />
    <Column
      field="contacts.0.email"
      header="Contact email"
      :sortable="true"
      style="min-width: 200px"
    />
    <Column
      field="intakeStatus"
      header="Status"
      :sortable="true"
      style="min-width: 150px"
    />
    <Column
      field="updatedAt"
      header="Last edited"
      :sortable="true"
      style="min-width: 150px"
    >
      <template #body="{ data }">
        {{ formatDate(data?.updatedAt) }}
      </template>
    </Column>
    <Column
      field="submittedAt"
      header="Submitted date"
      :sortable="true"
      style="min-width: 200px"
    >
      <template #body="{ data }">
        {{ data.intakeStatus !== IntakeStatus.DRAFT ? formatDate(data?.submittedAt) : undefined }}
      </template>
    </Column>
    <Column
      field="action"
      header="Action"
      class="text-center header-center"
      style="min-width: 150px"
    >
      <template #body="{ data }">
        <Button
          class="p-button-lg p-button-text p-button-danger p-0"
          aria-label="Delete enquiry"
          :disabled="!useAuthZStore().can(Initiative.HOUSING, Resource.ENQUIRY, Action.DELETE)"
          @click="
            onDelete(data.enquiryId, data.activityId);
            selection = data;
          "
        >
          <font-awesome-icon icon="fa-solid fa-trash" />
        </Button>
      </template>
    </Column>
  </DataTable>
</template>
<style scoped lang="scss">
:deep(.header-center .p-column-header-content) {
  justify-content: center;
}
</style>
