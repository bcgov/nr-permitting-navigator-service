<script setup lang="ts">
import { storeToRefs } from 'pinia';
import { computed, onMounted, ref } from 'vue';
import { useRouter } from 'vue-router';

import EnquiryForm from '@/components/housing/enquiry/EnquiryForm.vue';
import NoteCard from '@/components/note/NoteCard.vue';
import NoteModal from '@/components/note/NoteModal.vue';
import { Button, Message, Tab, Tabs, TabList, TabPanel, TabPanels } from '@/lib/primevue';
import { enquiryService, noteService, submissionService } from '@/services';
import { useAuthZStore, useEnquiryStore } from '@/store';
import { Action, Initiative, Resource, RouteName } from '@/utils/enums/application';
import { ApplicationStatus } from '@/utils/enums/housing';

import type { Note, Submission } from '@/types';
import type { Ref } from 'vue';

// Props
const {
  activityId,
  initialTab = '0',
  enquiryId
} = defineProps<{
  activityId: string;
  initialTab?: string;
  enquiryId: string;
}>();

// State
const activeTab: Ref<number> = ref(Number(initialTab));
const relatedSubmission: Ref<Submission | undefined> = ref(undefined);
const loading: Ref<boolean> = ref(true);
const noteModalVisible: Ref<boolean> = ref(false);
const router = useRouter();

// Store
const enquiryStore = useEnquiryStore();
const { getEnquiry, getNotes } = storeToRefs(enquiryStore);

// Actions

const isCompleted = computed(() => {
  return getEnquiry.value?.enquiryStatus === ApplicationStatus.COMPLETED;
});

onMounted(async () => {
  if (enquiryId && activityId) {
    const [enquiry, notes] = (
      await Promise.all([enquiryService.getEnquiry(enquiryId), noteService.listNotes(activityId)])
    ).map((r) => r.data);
    enquiryStore.setEnquiry(enquiry);
    enquiryStore.setNotes(notes);

    updateRelatedEnquiry();
  }

  loading.value = false;
});

function onAddNote(note: Note) {
  enquiryStore.addNote(note, true);
}
const onUpdateNote = (oldNote: Note, newNote: Note) => {
  enquiryStore.updateNote(oldNote, newNote);
};
const onDeleteNote = (note: Note) => {
  enquiryStore.removeNote(note);
};

async function updateRelatedEnquiry() {
  if (getEnquiry?.value?.relatedActivityId) {
    relatedSubmission.value = (
      await submissionService.searchSubmissions({
        activityId: [getEnquiry?.value?.relatedActivityId]
      })
    ).data[0];
  } else relatedSubmission.value = undefined;
}

function onEnquiryFormSaved() {
  updateRelatedEnquiry();
}
</script>

<template>
  <Button
    class="p-0"
    text
    @click="router.back()"
  >
    <font-awesome-icon
      icon="fa fa-arrow-circle-left"
      class="mr-1 app-primary-color"
    />
    <span class="app-primary-color">Back to Submissions</span>
  </Button>

  <h1>
    Enquiry submission:
    <span
      v-if="getEnquiry?.activityId"
      class="mr-1"
    >
      {{ getEnquiry.activityId }}
    </span>
    <span
      v-if="isCompleted"
      class="ml-0"
    >
      (Completed)
    </span>
  </h1>
  <Tabs :value="activeTab">
    <TabList>
      <Tab :value="0">Information</Tab>
      <Tab :value="1">Notes</Tab>
    </TabList>
    <TabPanels>
      <TabPanel :value="0">
        <Message
          v-if="relatedSubmission"
          severity="info"
          class="text-center"
          :closable="false"
        >
          This activity is linked to Activity
          <router-link
            :to="{
              name: RouteName.HOUSING_SUBMISSIONS_PROJECT,
              params: { submissionId: relatedSubmission.submissionId },
              query: { activityId: getEnquiry?.relatedActivityId }
            }"
          >
            {{ getEnquiry?.relatedActivityId }}
          </router-link>
        </Message>

        <Message
          v-if="getEnquiry?.relatedActivityId && !relatedSubmission"
          severity="error"
          class="text-center"
          :closable="false"
        >
          This activity is linked to an invalid Activity
        </Message>
        <span v-if="!loading && getEnquiry">
          <EnquiryForm
            :editable="!isCompleted && useAuthZStore().can(Initiative.HOUSING, Resource.ENQUIRY, Action.UPDATE)"
            :enquiry="getEnquiry"
            @enquiry-form:saved="onEnquiryFormSaved"
          />
        </span>
      </TabPanel>
      <TabPanel :value="1">
        <div class="flex items-center pb-2">
          <div class="grow">
            <p class="font-bold">Notes ({{ getNotes.length }})</p>
          </div>
          <Button
            aria-label="Add note"
            :disabled="!isCompleted && !useAuthZStore().can(Initiative.HOUSING, Resource.NOTE, Action.CREATE)"
            @click="noteModalVisible = true"
          >
            <font-awesome-icon
              class="pr-2"
              icon="fa-solid fa-plus"
            />
            Add note
          </Button>
        </div>
        <div
          v-for="(note, index) in getNotes"
          :key="note.noteId"
          :index="index"
          class="col-span-12"
        >
          <NoteCard
            :editable="!isCompleted"
            :note="note"
            @delete-note="onDeleteNote"
            @update-note="onUpdateNote"
          />
        </div>
        <NoteModal
          v-if="noteModalVisible"
          v-model:visible="noteModalVisible"
          :activity-id="activityId"
          @add-note="onAddNote"
        />
      </TabPanel>
    </TabPanels>
  </Tabs>
</template>
