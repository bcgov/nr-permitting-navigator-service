<script setup lang="ts">
import { storeToRefs } from 'pinia';
import { Form } from 'vee-validate';
import { computed, onBeforeMount, ref } from 'vue';
import { useI18n } from 'vue-i18n';
import { useRouter } from 'vue-router';
import { object, string } from 'yup';

import BackButton from '@/components/common/BackButton.vue';
import Divider from '@/components/common/Divider.vue';
import { FormNavigationGuard, InputMask, InputText, Select, TextArea } from '@/components/form';
import Tooltip from '@/components/common/Tooltip.vue';
import CollectionDisclaimer from '@/components/housing/CollectionDisclaimer.vue';
import { Button, Card, useConfirm, useToast } from '@/lib/primevue';
import { enquiryService, submissionService } from '@/services';
import { useConfigStore, useContactStore } from '@/store';
import { CONTACT_PREFERENCE_LIST, PROJECT_RELATIONSHIP_LIST } from '@/utils/constants/housing';
import { RouteName } from '@/utils/enums/application';
import { IntakeFormCategory, IntakeStatus } from '@/utils/enums/housing';
import { confirmationTemplateEnquiry } from '@/utils/templates';
import { omit } from '@/utils/utils';
import { contactValidator } from '@/validators';

import type { GenericObject } from 'vee-validate';
import type { Ref } from 'vue';
import type { Submission } from '@/types';

// Props
const { enquiryId, projectActivityId, projectName, permitName, permitTrackingId, permitAuthStatus } = defineProps<{
  enquiryId?: string;
  projectActivityId?: string;
  projectName?: string;
  permitName?: string;
  permitTrackingId?: string;
  permitAuthStatus?: string;
}>();

// Store
const contactStore = useContactStore();
const { getConfig } = storeToRefs(useConfigStore());

// State
const editable: Ref<boolean> = ref(true);
const filteredProjectActivityIds: Ref<Array<string>> = ref([]);
const formRef: Ref<InstanceType<typeof Form> | null> = ref(null);
const initialFormValues: Ref<undefined | GenericObject> = ref(undefined);
const projectActivityIds: Ref<Array<string>> = ref([]);
const submissions: Ref<Array<Submission>> = ref([]);
const validationErrors: Ref<string[]> = ref([]);

// Form validation schema
const formSchema = object({
  ...contactValidator,
  [IntakeFormCategory.BASIC]: object({
    enquiryDescription: string().required().label('Enquiry')
  })
});

// Actions
const { t } = useI18n();
const confirm = useConfirm();
const router = useRouter();
const toast = useToast();

const getBackButtonConfig = computed(() => {
  return {
    text: 'Back to Housing',
    routeName: RouteName.HOUSING
  };
});

function confirmSubmit(data: any) {
  confirm.require({
    message: 'Are you sure you wish to submit this form?',
    header: 'Please confirm submission',
    acceptLabel: 'Confirm',
    rejectLabel: 'Cancel',
    rejectProps: { outlined: true },
    accept: () => onSubmit(data)
  });
}

async function emailConfirmation(activityId: string, enquiryId: string) {
  const configCC = getConfig.value.ches?.submission?.cc;

  // Get the first two sentences of the enquiry description
  // If there are more than two sentences in enquiryDescription, add '..' to the end
  const enquiryDescription = formRef.value?.values.basic.enquiryDescription || '';
  let firstTwoSentences = enquiryDescription.split('.').slice(0, 2).join('.') + '.';
  const sentences = enquiryDescription.split('.').filter((sentence: string) => sentence.trim().length > 0);
  firstTwoSentences = sentences.length > 2 ? firstTwoSentences.concat('..') : firstTwoSentences;

  const body = confirmationTemplateEnquiry({
    '{{ contactName }}': formRef.value?.values.contactFirstName,
    '{{ activityId }}': activityId,
    '{{ enquiryDescription }}': firstTwoSentences.trim(),
    '{{ enquiryId }}': enquiryId
  });
  let applicantEmail = formRef.value?.values.contactEmail;
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

async function loadEnquiry() {
  try {
    let response;

    if (enquiryId) {
      response = (await enquiryService.getEnquiry(enquiryId as string)).data;
      editable.value = response?.intakeStatus !== IntakeStatus.SUBMITTED;
    } else {
      // Load contact data for new enquiry
      response = { contacts: [contactStore.getContact] };
    }

    initialFormValues.value = {
      activityId: response?.activityId,
      enquiryId: response?.enquiryId,
      contactFirstName: response?.contacts[0]?.firstName,
      contactLastName: response?.contacts[0]?.lastName,
      contactPhoneNumber: response?.contacts[0]?.phoneNumber,
      contactEmail: response?.contacts[0]?.email,
      contactApplicantRelationship: response?.contacts[0]?.contactApplicantRelationship,
      contactPreference: response?.contacts[0]?.contactPreference,
      contactId: response?.contacts[0]?.contactId,
      basic: {
        relatedActivityId: response?.relatedActivityId,
        enquiryDescription: response?.enquiryDescription
      }
    };
  } catch (e: any) {
    router.replace({ name: RouteName.HOUSING_ENQUIRY_INTAKE });
  }
}

function onInvalidSubmit(e: any) {
  validationErrors.value = Array.from(new Set(e.errors ? Object.keys(e.errors).map((x) => x.split('.')[0]) : []));
  document.getElementById('form')?.scrollIntoView({ behavior: 'smooth' });
}

async function onSubmit(data: any) {
  editable.value = false;

  let enquiryResponse;

  try {
    // Set related activity id if project activity id is passed in as a prop
    if (projectActivityId) {
      data.basic.relatedActivityId = projectActivityId;
    }

    // Convert contact fields into contacts array object then remove form keys from data
    const enquiryData = omit(
      {
        ...data,
        contacts: [
          {
            firstName: data.contactFirstName,
            lastName: data.contactLastName,
            phoneNumber: data.contactPhoneNumber,
            email: data.contactEmail,
            contactApplicantRelationship: data.contactApplicantRelationship,
            contactPreference: data.contactPreference,
            contactId: data.contactId
          }
        ]
      },
      [
        'contactFirstName',
        'contactLastName',
        'contactPhoneNumber',
        'contactEmail',
        'contactApplicantRelationship',
        'contactPreference',
        'contactId'
      ]
    );

    if (permitName && permitAuthStatus) {
      let permitDescription =
        t('enquiryIntakeForm.re') + ': ' + permitName + '\n' + t('enquiryIntakeForm.trackingId') + ': ';
      const trackingId = permitTrackingId ? permitTrackingId : t('enquiryIntakeForm.notApplicable');
      const authStatus = t('enquiryIntakeForm.authStatus') + ': ' + permitAuthStatus;
      permitDescription = permitDescription + trackingId + '\n' + authStatus + '\n\n';
      enquiryData.basic.enquiryDescription = permitDescription + enquiryData.basic.enquiryDescription;
    }

    enquiryResponse = await enquiryService.createEnquiry(enquiryData);

    if (enquiryResponse.data.activityId && enquiryResponse.data.enquiryId) {
      formRef.value?.setFieldValue('activityId', enquiryResponse.data.activityId);
      formRef.value?.setFieldValue('enquiryId', enquiryResponse.data.enquiryId);

      // Send confirmation email
      emailConfirmation(enquiryResponse.data.activityId, enquiryResponse.data.enquiryId);

      // Save contact data to store
      contactStore.setContact(enquiryData.contacts[0]);

      router.push({
        name: RouteName.HOUSING_ENQUIRY_CONFIRMATION,
        params: {
          activityId: enquiryResponse.data.activityId,
          enquiryId: enquiryResponse.data.enquiryId
        },
        query: {
          showEnquiryLink: projectName || permitName ? '' : 'true'
        }
      });
    } else {
      throw new Error('Failed to retrieve correct enquiry data');
    }
  } catch (e: any) {
    toast.error('Failed to save intake', e);
  } finally {
    editable.value = true;
  }
}

onBeforeMount(async () => {
  loadEnquiry();
  projectActivityIds.value = filteredProjectActivityIds.value = (await submissionService.getActivityIds()).data;
  submissions.value = (await submissionService.getSubmissions()).data;
});
</script>

<template>
  <div>
    <div class="mb-2 p-0">
      <BackButton
        :route-name="getBackButtonConfig.routeName"
        :text="getBackButtonConfig.text"
      />
    </div>
    <div class="flex justify-center items-center app-primary-color mb-2 mt-4">
      <h3
        role="heading"
        aria-level="1"
      >
        Enquiry Form
      </h3>
    </div>

    <CollectionDisclaimer />

    <Form
      v-if="initialFormValues"
      ref="formRef"
      keep-values
      :initial-values="initialFormValues"
      :validation-schema="formSchema"
      @invalid-submit="(e) => onInvalidSubmit(e)"
      @submit="confirmSubmit"
    >
      <FormNavigationGuard v-if="editable" />

      <input
        type="hidden"
        name="activityId"
      />

      <input
        type="hidden"
        name="enquiryId"
      />
      <Card v-if="projectName && projectActivityId">
        <template #title>
          <span class="section-header">
            {{ t('enquiryIntakeForm.about') }}
            <span class="text-primary">
              {{ projectName }}| {{ t('enquiryIntakeForm.projectId') }}:
              {{ projectActivityId }}
            </span>
          </span>
        </template>
      </Card>

      <Card v-if="permitName && permitAuthStatus">
        <template #title>
          <span class="section-header">
            {{ t('enquiryIntakeForm.about') }}
            <span class="text-primary">
              {{ t('enquiryIntakeForm.permit') }}: {{ permitName }}| {{ t('enquiryIntakeForm.trackingId') }}:
              {{ permitTrackingId ? permitTrackingId : t('enquiryIntakeForm.notApplicable') }}|
              {{ t('enquiryIntakeForm.authStatus') }}:
              {{ permitAuthStatus }}
            </span>
          </span>
        </template>
      </Card>

      <Card>
        <template #title>
          <div class="flex">
            <span
              class="section-header"
              role="heading"
              aria-level="2"
            >
              {{ t('enquiryIntakeForm.contactInformation') }}
            </span>
            <Tooltip
              right
              :text="t('enquiryIntakeForm.contactTooltip')"
            />
          </div>
          <Divider type="solid" />
        </template>
        <template #content>
          <div class="grid grid-cols-12 gap-4">
            <InputText
              class="col-span-6"
              name="contactFirstName"
              label="First name"
              :bold="false"
              :disabled="!!initialFormValues?.contactFirstName || !editable"
            />
            <InputText
              class="col-span-6"
              name="contactLastName"
              label="Last name"
              :bold="false"
              :disabled="!!initialFormValues?.contactLastName || !editable"
            />
            <InputMask
              class="col-span-6"
              name="contactPhoneNumber"
              mask="(999) 999-9999"
              label="Phone number"
              :bold="false"
              :disabled="!!initialFormValues?.contactPhoneNumber || !editable"
            />
            <InputText
              class="col-span-6"
              name="contactEmail"
              label="Email"
              :bold="false"
              :disabled="!!initialFormValues?.contactEmail || !editable"
            />
            <Select
              class="col-span-6"
              name="contactApplicantRelationship"
              label="Relationship to project"
              :bold="false"
              :disabled="!!initialFormValues?.contactApplicantRelationship || !editable"
              :options="PROJECT_RELATIONSHIP_LIST"
            />
            <Select
              class="col-span-6"
              :name="`contactPreference`"
              label="Preferred contact method"
              :bold="false"
              :disabled="!!initialFormValues?.contactPreference || !editable"
              :options="CONTACT_PREFERENCE_LIST"
            />
          </div>
        </template>
      </Card>
      <Card>
        <template #title>
          <span
            class="section-header"
            role="heading"
            aria-level="2"
          >
            Tell us about your enquiry
          </span>
          <Divider type="solid" />
        </template>
        <template #content>
          <div class="grid grid-cols-12 gap-4">
            <TextArea
              class="col-span-12"
              name="basic.enquiryDescription"
              placeholder="Type here..."
              :disabled="!editable"
            />
          </div>
        </template>
      </Card>
      <div class="flex align-center justify-center mt-4">
        <Button
          label="Submit"
          type="submit"
          icon="pi pi-upload"
          :disabled="!editable"
        />
      </div>
    </Form>
  </div>
</template>

<style scoped lang="scss">
.disclaimer {
  font-weight: 500;
}

.p-card {
  border-color: rgb(242, 241, 241);
  border-radius: 8px;
  border-style: solid;
  border-width: 1px;
  margin-bottom: 1rem;

  .section-header {
    font-weight: bold;
    padding-left: 1rem;
    padding-right: 0.5rem;
  }

  :deep(.p-card-title) {
    font-size: 1rem;
  }

  :deep(.p-card-body) {
    padding-bottom: 0.5rem;

    padding-left: 0;
    padding-right: 0;
  }

  :deep(.p-card-content) {
    padding-bottom: 0;
    padding-top: 0;

    padding-left: 1rem;
    padding-right: 1rem;
  }
}

:deep(.p-message-wrapper) {
  padding: 0.5rem;
}

:deep(.p-card.p-component:has(.p-invalid)) {
  border-color: var(--p-red-500) !important;
}
</style>
