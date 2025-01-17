<script setup lang="ts">
import { storeToRefs } from 'pinia';
import { computed, onMounted, ref } from 'vue';
import { useI18n } from 'vue-i18n';
import { useRouter } from 'vue-router';

import Breadcrumb from '@/components/common/Breadcrumb.vue';
import StatusPill from '@/components/common/StatusPill.vue';
import CreateEnquiryDialog from '@/components/housing/projects/CreateEnquiryDialog.vue';
import {
  Accordion,
  AccordionContent,
  AccordionHeader,
  AccordionPanel,
  Button,
  Card,
  Divider,
  useToast
} from '@/lib/primevue';
import { useAuthNStore, useConfigStore } from '@/store';
import { BasicResponse, RouteName } from '@/utils/enums/application';
import { PermitAuthorizationStatus, PermitNeeded, PermitStatus, SubmissionType } from '@/utils/enums/housing';
import { formatDate } from '@/utils/formatters';
import { confirmationTemplateEnquiry } from '@/utils/templates';

import { enquiryService, permitService, submissionService, userService } from '@/services';
import { useSubmissionStore, useTypeStore } from '@/store';

import type { ComputedRef, Ref } from 'vue';
import type { Permit, PermitType, User } from '@/types';
import type { MenuItem } from 'primevue/menuitem';
import EnquiryListProponent from '@/components/housing/enquiry/EnquiryListProponent.vue';

// Types
type PermitFilterConfig = {
  permitNeeded?: string;
  permits: Array<Permit>;
  permitStatus?: string;
  permitTypes: Array<PermitType>;
  submitted?: boolean;
};

type CombinedPermit = Permit & PermitType;

// Props
const { submissionId } = defineProps<{
  submissionId: string;
}>();

// Constants
const { t } = useI18n();

const BREADCRUMB_HOME: MenuItem = { label: t('projectView.crumbHousing'), route: RouteName.HOUSING };

// Store
const submissionStore = useSubmissionStore();
const { getConfig } = storeToRefs(useConfigStore());
const { getProfile } = storeToRefs(useAuthNStore());
const { getPermits, getRelatedEnquiries, getSubmission } = storeToRefs(submissionStore);

const typeStore = useTypeStore();
const { getPermitTypes } = storeToRefs(typeStore);

// State
const assignee: Ref<User | undefined> = ref(undefined);
const breadcrumbItems: ComputedRef<Array<MenuItem>> = computed(() => [
  { label: getSubmission?.value?.projectName ?? '', class: 'font-bold' }
]);
const createdBy: Ref<User | undefined> = ref(undefined);
const enquiryConfirmationId: Ref<string | undefined> = ref(undefined);
const enquiryModalVisible: Ref<boolean> = ref(false);
const loading: Ref<boolean> = ref(true);

const permitsNeeded = computed(() => {
  return permitFilter({
    permitNeeded: PermitNeeded.YES,
    permitStatus: PermitStatus.NEW,
    permits: getPermits.value,
    permitTypes: getPermitTypes.value
  })
    .sort(permitNameSortFcn)
    .sort(permitBusinessSortFcn);
});
const permitsNotNeeded = computed(() => {
  return permitFilter({
    permitNeeded: PermitNeeded.NO,
    permits: getPermits.value,
    permitTypes: getPermitTypes.value
  })
    .sort(permitNameSortFcn)
    .sort(permitBusinessSortFcn);
});
const permitsSubmitted: ComputedRef<Array<CombinedPermit>> = computed(() => {
  let firstFilter = permitFilter({
    submitted: true,
    permits: getPermits.value,
    permitTypes: getPermitTypes.value
  });
  return firstFilter.sort(permitNameSortFcn).sort(permitBusinessSortFcn);
});

// Actions
const router = useRouter();
const toast = useToast();

async function emailConfirmation(activityId: string, enquiryId: string, enquiryDescription: string) {
  const configCC = getConfig.value.ches?.submission?.cc;
  const user = getProfile;

  const body = confirmationTemplateEnquiry({
    '{{ contactName }}': user.value?.name,
    '{{ activityId }}': activityId,
    '{{ enquiryDescription }}': enquiryDescription,
    '{{ enquiryId }}': enquiryId
  });
  let applicantEmail = user.value?.email;

  if (applicantEmail) {
    let emailData = {
      from: configCC,
      to: [applicantEmail],
      cc: configCC,
      subject: 'Confirmation of Submission', // eslint-disable-line quotes
      bodyType: 'html',
      body: body
    };
    await submissionService.emailConfirmation(emailData);
  }
}

function permitBusinessSortFcn(a: CombinedPermit, b: CombinedPermit) {
  return a.businessDomain > b.businessDomain ? 1 : -1;
}

function permitNameSortFcn(a: CombinedPermit, b: CombinedPermit) {
  return a.name > b.name ? 1 : -1;
}

function permitFilter(config: PermitFilterConfig) {
  const { permitNeeded, permits, permitStatus, permitTypes, submitted } = config;
  let returnArray: Array<any> = permits;

  if (permitNeeded) {
    returnArray = returnArray.map((p) => {
      const pType = permitTypes.find((pt) => pt.permitTypeId === p?.permitTypeId && p.needed === permitNeeded);
      if (pType) return { ...p, ...pType };
    });
  }

  if (permitStatus) {
    returnArray = returnArray.map((p) => {
      const pType = permitTypes.find((pt) => pt.permitTypeId === p?.permitTypeId && p.status === permitStatus);
      if (pType) return { ...p, ...pType };
    });
  }

  if (submitted) {
    returnArray = returnArray
      .filter((item) => item.authStatus !== PermitAuthorizationStatus.NONE && item.status !== PermitStatus.NEW)
      .map((p) => {
        const pType = permitTypes.find((pt) => pt.permitTypeId === p?.permitTypeId);
        if (pType) return { ...p, ...pType };
      });
  }

  return returnArray.filter((pt) => !!pt) as Array<CombinedPermit>;
}

function handleDialogClose() {
  enquiryConfirmationId.value = undefined;
}

async function handleEnquirySubmit(enquiryDescription: string = '') {
  if (!getSubmission.value) return;

  const enquiryData = {
    contacts: [
      {
        contactPreference: getSubmission.value.contacts[0].contactPreference,
        email: getSubmission.value.contacts[0].email,
        firstName: getSubmission.value.contacts[0].firstName,
        lastName: getSubmission.value.contacts[0].lastName,
        phoneNumber: getSubmission.value.contacts[0].phoneNumber,
        contactApplicantRelationship: getSubmission.value.contacts[0].contactApplicantRelationship
      }
    ],
    basic: {
      isRelated: BasicResponse.YES,
      applyForPermitConnect: BasicResponse.NO,
      enquiryDescription: enquiryDescription?.trim(),
      relatedActivityId: getSubmission.value.activityId
    }
  };

  try {
    const response = await enquiryService.createEnquiry(enquiryData);
    submissionStore.addRelatedEnquiry(response.data);
    enquiryConfirmationId.value = response?.data?.activityId ? response.data.activityId : '';

    // Send confirmation email
    if (enquiryConfirmationId.value) {
      emailConfirmation(response.data.activityId, response.data.enquiryId, enquiryDescription);
    }
  } catch (e: any) {
    toast.error(t('projectView.toastEnquiryFailed'), e);
  }
}

onMounted(async () => {
  let enquiriesValue, permitTypesValue, submissionValue;

  try {
    [submissionValue, permitTypesValue] = (
      await Promise.all([submissionService.getSubmission(submissionId), permitService.getPermitTypes()])
    ).map((r) => r.data);
    if (submissionValue) enquiriesValue = (await enquiryService.listRelatedEnquiries(submissionValue.activityId)).data;
  } catch {
    toast.error(t('projectView.toastProjectLoadFailed'));
    router.replace({ name: RouteName.HOUSING_PROJECTS_LIST });
  }

  try {
    const activityId = submissionValue.activityId;
    const permitsValue = (await permitService.listPermits({ activityId, includeNotes: true })).data;
    submissionStore.setPermits(permitsValue);
  } catch {
    toast.error(t('projectView.toastPermitLoadFailed'));
  }
  submissionStore.setSubmission(submissionValue);
  submissionStore.setRelatedEnquiries(enquiriesValue);
  typeStore.setPermitTypes(permitTypesValue);

  if (submissionValue?.assignedUserId) {
    assignee.value = (await userService.searchUsers({ userId: [submissionValue.assignedUserId] })).data[0];
  }

  if (submissionValue?.createdBy) {
    createdBy.value = (await userService.searchUsers({ userId: [submissionValue.createdBy] })).data[0];
  }
  loading.value = false;
});
</script>

<template>
  <Breadcrumb
    :home="BREADCRUMB_HOME"
    :model="breadcrumbItems"
  />
  <div
    v-if="!loading && getSubmission"
    class="app-primary-color"
  >
    <div class="disclaimer-block p-8 mt-8">
      {{ t('projectView.disclaimer') }}
    </div>
    <div class="mt-20 mb-2 flex justify-between items-center">
      <h1
        class="m-0 cursor-pointer hover:underline"
        tabindex="0"
        @click="
          router.push({
            name: RouteName.HOUSING_SUBMISSION,
            query: { activityId: getSubmission?.activityId, submissionId: getSubmission?.submissionId }
          })
        "
        @keydown.enter.prevent="
          router.push({
            name: RouteName.HOUSING_SUBMISSION,
            query: { activityId: getSubmission?.activityId, submissionId: getSubmission?.submissionId }
          })
        "
        @keydown.space.prevent="
          router.push({
            name: RouteName.HOUSING_SUBMISSION,
            query: { activityId: getSubmission?.activityId, submissionId: getSubmission?.submissionId }
          })
        "
      >
        {{ getSubmission.projectName }}
        <font-awesome-icon
          class="text-sm"
          icon="fa fa-external-link"
        />
      </h1>
      <Button
        v-if="getSubmission?.submissionType !== SubmissionType.INAPPLICABLE"
        class="p-button-sm header-btn"
        label="Ask my Navigator"
        outlined
        @click="enquiryModalVisible = !enquiryModalVisible"
      />
    </div>
    <div class="mb-2">
      <span class="mr-4">
        Project ID:
        <span class="font-bold">{{ getSubmission.activityId }}</span>
      </span>
      <span class="mr-4">
        {{ t('projectView.createdBy') }}:
        <span class="font-bold">{{ createdBy?.firstName }} {{ createdBy?.lastName }}</span>
      </span>
      <span v-if="assignee">
        Navigator:
        <span class="font-bold">{{ assignee?.firstName }} {{ assignee?.lastName }}</span>
      </span>
      <span v-else>Navigator: -</span>
    </div>
    <div
      v-if="getSubmission?.submissionType === SubmissionType.INAPPLICABLE"
      class="inapplicable-block p-4 mt-12"
    >
      {{ t('projectView.inapplicableSubmissionType') }}
    </div>
    <div>
      <h3 class="mb-8 mt-16">{{ t('projectView.recommendedPermits') }}</h3>
    </div>
    <div
      v-if="!permitsNeeded?.length"
      class="empty-block p-8 mb-2"
    >
      {{ t('projectView.recommendedPermitsDesc') }}
    </div>
    <Card
      v-for="permit in permitsNeeded"
      :key="permit.permitId"
      class="app-primary-color permit-card mb-2"
    >
      <template #content>
        <h5 class="m-0 p-0">{{ permit.name }}</h5>
      </template>
    </Card>
    <Accordion
      v-if="permitsNotNeeded?.length"
      class="app-primary-color"
      :value="undefined"
      collapse-icon="pi pi-chevron-up"
      expand-icon="pi pi-chevron-right"
    >
      <AccordionPanel value="0">
        <AccordionHeader>{{ t('projectView.notNeeded') }}</AccordionHeader>
        <AccordionContent>
          <div>
            {{ t('projectView.notNeededDesc') }}
          </div>
          <ul class="list-disc mt-4">
            <li
              v-for="permit in permitsNotNeeded"
              :key="permit.permitId"
              class="ml-12"
            >
              {{ permit.name }}
            </li>
          </ul>
        </AccordionContent>
      </AccordionPanel>
    </Accordion>
    <h3 class="mt-20 mb-8">{{ t('projectView.submittedApplications') }}</h3>
    <div
      v-if="!permitsSubmitted.length"
      class="empty-block p-8"
    >
      {{ t('projectView.submittedApplicationsDesc') }}
    </div>
    <router-link
      v-for="permit in permitsSubmitted"
      :key="permit.permitId"
      :to="{
        name: RouteName.HOUSING_PROJECT_PERMIT,
        params: { permitId: permit.permitId }
      }"
    >
      <Card class="permit-card--hover mb-4">
        <template #title>
          <div class="flex justify-between">
            <h5 class="m-0 app-primary-color cursor-pointer">{{ permit.name }}</h5>
            <font-awesome-icon
              class="ellipsis-icon"
              icon="fa fa-ellipsis"
            />
          </div>
          <Divider />
        </template>
        <template #content>
          <div class="grid grid-cols-12 gap-4">
            <div class="col-span-12 flex mb-4">
              <StatusPill
                class="mr-2"
                :auth-status="permit.authStatus"
              />
              <div>
                <span class="label-verified mr-1">{{ t('projectView.statusVerified') }}</span>
                <span class="label-date">{{ formatDate(permit.statusLastVerified) }}</span>
              </div>
            </div>
            <div class="col-span-3">
              <div class="label-field">{{ t('projectView.trackingId') }}</div>
              <div class="permit-data">
                {{ permit?.trackingId }}
              </div>
            </div>
            <div class="col-span-3">
              <div class="label-field">{{ t('projectView.agency') }}</div>
              <div class="permit-data">
                {{ permit?.agency }}
              </div>
            </div>
            <div class="col-span-6">
              <div class="label-field">{{ t('projectView.latestUpdates') }}</div>
              <div class="permit-data">
                {{ permit?.permitNote?.length ? permit?.permitNote[0].note : t('projectView.noUpdates') }}
              </div>
            </div>
          </div>
        </template>
      </Card>
    </router-link>
    <CreateEnquiryDialog
      v-model:visible="enquiryModalVisible"
      dismissable-mask
      :navigator="assignee"
      :confirmation-id="enquiryConfirmationId"
      @on-hide="handleDialogClose"
      @on-sumbit-enquiry="handleEnquirySubmit"
    />
    <div>
      <div>
        <h3 class="mt-20 mb-8">{{ t('projectView.relatedEnquiries') }}</h3>
      </div>
      <EnquiryListProponent
        :loading="loading"
        :enquiries="getRelatedEnquiries"
      />
    </div>
  </div>
</template>

<style scoped lang="scss">
a {
  text-decoration: none;
}

.hover-underline:hover {
  text-decoration: underline;
}

.disclaimer-block {
  outline: solid 0.063rem $app-grey;
  border-radius: 0.5rem;
}

.ellipsis-icon {
  cursor: pointer;
  width: 1.5rem;
  color: #255a90;

  &:hover {
    color: #053662;
  }
}

.empty-block {
  background-color: $app-grey;
  border-radius: 0.5rem;
}

.header-btn {
  max-height: 2rem;
}

.inapplicable-block {
  background-color: $app-red-background;
  border-radius: 0.5rem;
  border-width: 0.063rem;
  border-style: solid;
  border-color: $app-red-border;
  color: $app-red-text;
}

.permit-card {
  border-color: var(--p-greyscale-100);
  border-style: solid;
  border-width: 0.063rem;
  box-shadow: 0.25rem 0.25rem 0.25rem 0rem $app-proj-black;
  &--hover:hover {
    background-color: $app-grey;
  }
}

.permit-data {
  overflow: auto;
  word-break: break-word;
  text-overflow: ellipsis;
}

.label-field {
  color: #474543;
  font-family: 'BC Sans';
  font-size: 0.75rem;
  margin-bottom: 0.5rem;
}

.label-date {
  color: #2d2d2d;
  font-family: 'BC Sans';
  font-size: 0.75rem;
  font-style: italic;
  font-weight: 700;
}

.label-verified {
  color: #474543;
  font-family: 'BC Sans';
  font-size: 0.75rem;
  font-style: italic;
  font-weight: 400;
}

:deep(.p-accordion-content) {
  padding: 4rem 4rem 4rem 4rem;
  border-style: none;
}

:deep(.p-accordion-header > a) {
  color: inherit;
  font-size: 1.1rem;
  text-decoration: none;
  padding: 1.5rem 2rem 1.5rem 2rem;
  border-top-style: none;
  border-left-style: none;
  border-right-style: none;
}

:deep(.p-accordion-tab) {
  border-color: var(--p-greyscale-100);
  border-style: solid;
  border-width: 1px;
  box-shadow: 4px 4px 4px 0px rgba(0, 0, 0, 0.03);
}

:deep(:not(.p-accordion-tab-active) .p-accordion-header > a) {
  background-color: inherit;
}

:deep(.p-card-body) {
  padding: 1.5rem;
}

:deep(.p-card-content) {
  padding: 0rem;
}

:deep(.p-card:hover .p-card-title) {
  text-decoration: underline;
}
</style>
