<script setup lang="ts">
import { computed, nextTick, onMounted, ref, watch } from 'vue';
import { useI18n } from 'vue-i18n';
import { useRoute, useRouter } from 'vue-router';

import Tooltip from '@/components/common/Tooltip.vue';
import SubmissionDraftListProponent from '@/components/housing/submission/SubmissionDraftListProponent.vue';
import { Button, Paginator } from '@/lib/primevue';
import { enquiryService, submissionService } from '@/services';
import { RouteName } from '@/utils/enums/application';
import { formatDate } from '@/utils/formatters';

import type { Ref } from 'vue';
import type { Enquiry, Submission } from '@/types';
import EnquiryListProponent from '@/components/housing/enquiry/EnquiryListProponent.vue';

// Constants
const PAGE_ROWS = 5;

// State
const drafts: Ref<Array<any>> = ref([]);
const enquiries: Ref<Array<Enquiry>> = ref([]);
const projects: Ref<Array<Submission>> = ref([]);
const first: Ref<number> = ref(0);
const displayedProjects = computed(() => projects.value.slice(first.value, first.value + PAGE_ROWS));
const loading: Ref<boolean> = ref(true);

// Actions
const { t } = useI18n();
const route = useRoute();
const router = useRouter();

function onSubmissionDraftDelete(draftId: string) {
  drafts.value = drafts.value.filter((x) => x.draftId !== draftId);
}

watch(
  () => route.hash,
  async (newHash) => {
    if (newHash) {
      await nextTick();
      const target = document.querySelector(newHash);
      if (target && target instanceof HTMLElement) {
        target.focus();
      }
    }
  }
);

onMounted(async () => {
  [enquiries.value, projects.value, drafts.value] = (
    await Promise.all([
      enquiryService.getEnquiries(),
      submissionService.searchSubmissions({ includeDeleted: false }),
      submissionService.getDrafts()
    ])
  ).map((r) => r.data);

  drafts.value = drafts.value.map((x, index) => ({ ...x, index: index + 1 }));

  // Filter enquiries to only include enquiries with no relatedActivityId
  enquiries.value = enquiries.value.filter((enquiry) => !enquiry.relatedActivityId);

  loading.value = false;
});
</script>

<template>
  <div class="flex flex-col items-center justify-start h-full">
    <div class="flex flex-row items-center w-full justify-between shadow px-4">
      <h1>{{ t('housing.housing') }}</h1>
      <img
        class="mr-4"
        src="@/assets/images/housing_2.png"
        width="120"
        alt="Housing image"
      />
    </div>

    <div class="flex flex-row items-center w-full mt-4 mb-9">
      <div class="font-bold mr-2">{{ t('housing.onThisPage') }}</div>
      <!-- eslint-disable vue/multiline-html-element-content-newline -->
      <!-- prettier-ignore -->
      <div>
        <router-link
          :to="{
            name: RouteName.HOUSING,
            hash: '#projects'
          }"
          class="no-underline"
          @keydown.space.prevent="router.push({ name: RouteName.HOUSING, hash: '#projects' })"
        >
        {{ t('housing.myProjects') }}</router-link>
        |
        <router-link
          :to="{
            name: RouteName.HOUSING,
            hash: '#drafts'
          }"
          class="no-underline"
          @keydown.space.prevent="router.push({ name: RouteName.HOUSING, hash: '#drafts' })"
        >
        {{ t('housing.drafts') }}</router-link>
        |
        <router-link
          :to="{
            name: RouteName.HOUSING,
            hash: '#enquiries'
          }"
          class="no-underline"
          @keydown.space.prevent="router.push({ name: RouteName.HOUSING, hash: '#enquiries' })"
        >
        {{ t('housing.generalEnquiries') }}</router-link>
      </div>
      <!-- eslint-enable vue/multiline-html-element-content-newline -->
    </div>

    <!--
      Projects
    -->
    <div class="flex flex-row items-center w-full justify-between">
      <div class="flex items-center flex-row">
        <h2
          id="projects"
          tabindex="-1"
        >
          {{ t('housing.myProjects') }}
        </h2>
        <Tooltip
          class="pl-2 text-xl"
          right
          :text="t('housing.projectsTooltip')"
        />
      </div>
      <Button @click="router.push({ name: RouteName.HOUSING_INTAKE })">
        {{ t('housing.submitNewProject') }}
        <font-awesome-icon
          class="ml-2"
          icon="fa-solid fa-arrow-right"
        />
      </Button>
    </div>

    <div class="w-full">
      <div
        v-if="!projects.length"
        class="flex flex-col items-center justify-center rounded-sm shadow-md custom-card px-4 py-4 bg"
      >
        <p class="font-bold">{{ t('housing.projectsEmpty') }}</p>
      </div>
      <div
        v-for="(project, index) in displayedProjects"
        v-else
        :key="project.activityId"
        :index="index"
        class="rounded-sm shadow-md hover:shadow-lg px-6 py-4 custom-card hover-hand"
        :class="{ 'mb-2': index != displayedProjects.length - 1 }"
      >
        <div class="grid grid-cols-12 gap-4">
          <div class="col-span-3 flex items-center">
            <router-link
              class="no-underline"
              :to="{
                name: RouteName.HOUSING_PROJECT,
                params: { submissionId: project.submissionId }
              }"
            >
              <h4 class="font-bold mb-0">{{ project.projectName }}</h4>
            </router-link>
          </div>
          <div class="col-span-3 flex items-center">
            <p>{{ t('housing.projectState') }}: {{ project.applicationStatus }}</p>
          </div>
          <div class="col-span-3 flex items-center">
            <p>{{ t('housing.confirmationId') }}: {{ project.activityId }}</p>
          </div>
          <div class="col-span-3 flex items-center">
            <p>{{ t('housing.lastUpdated') }}: {{ project.updatedAt ? formatDate(project.updatedAt) : 'N/A' }}</p>
          </div>
        </div>
      </div>
      <div class="flex justify-end mt-2">
        <Paginator
          v-model:first="first"
          :rows="PAGE_ROWS"
          :total-records="projects.length"
          template="FirstPageLink PrevPageLink CurrentPageReport NextPageLink LastPageLink"
          :current-page-report-template="`({currentPage} ${t('housing.of')} {totalPages})`"
        />
      </div>
    </div>

    <!--
      Drafts
    -->
    <div class="flex flex-row items-center w-full justify-between">
      <h2
        id="drafts"
        class="flex font-bold"
        tabindex="-1"
      >
        {{ t('housing.drafts') }}
      </h2>
    </div>

    <div class="w-full">
      <SubmissionDraftListProponent
        :loading="loading"
        :drafts="drafts"
        @submission-draft:delete="onSubmissionDraftDelete"
      />
    </div>

    <!--
      Enquiries
    -->
    <div class="flex flex-row items-center w-full justify-between">
      <div class="flex items-center flex-row">
        <h2
          id="enquiries"
          class="font-bold"
          tabindex="-1"
        >
          {{ t('housing.generalEnquiries') }}
        </h2>
        <Tooltip
          class="pl-2 text-xl"
          right
          :text="t('housing.enquiriesTooltip')"
        />
      </div>

      <Button @click="router.push({ name: RouteName.HOUSING_ENQUIRY_INTAKE })">
        {{ t('housing.submitNewEnquiry') }}
        <font-awesome-icon
          class="ml-2"
          icon="fa-solid fa-arrow-right"
        />
      </Button>
    </div>

    <div class="w-full">
      <EnquiryListProponent
        :loading="loading"
        :enquiries="enquiries"
      />
    </div>
  </div>
</template>

<style scoped lang="scss">
.custom-card {
  background-color: #f7f9fc;

  &:hover {
    a {
      text-decoration: underline !important;
    }
  }
}

:deep(.p-paginator) {
  padding: 0;
}
</style>
