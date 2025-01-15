<script setup lang="ts">
import { storeToRefs } from 'pinia';
import { Form } from 'vee-validate';
import { computed, onBeforeMount, ref } from 'vue';
import { useI18n } from 'vue-i18n';
import { useRouter } from 'vue-router';
import { object, string } from 'yup';

import BackButton from '@/components/common/BackButton.vue';
import { Dropdown, FormNavigationGuard, InputMask, InputText, TextArea } from '@/components/form';
import CollectionDisclaimer from '@/components/housing/CollectionDisclaimer.vue';
import { Button, Card, Divider, useConfirm, useToast } from '@/lib/primevue';
import { enquiryService, submissionService } from '@/services';
import { useConfigStore } from '@/store';
import { YES_NO_LIST } from '@/utils/constants/application';
import { CONTACT_PREFERENCE_LIST, PROJECT_RELATIONSHIP_LIST } from '@/utils/constants/housing';
import { BasicResponse, RouteName } from '@/utils/enums/application';
import { IntakeFormCategory, IntakeStatus } from '@/utils/enums/housing';
import { confirmationTemplateEnquiry } from '@/utils/templates';
import { contactValidator } from '@/validators';

import type { Ref } from 'vue';
import type { Submission } from '@/types';
import { omit } from '@/utils/utils';

// Props
const { enquiryId = undefined } = defineProps<{
  enquiryId?: string;
}>();

// Store
const { getConfig } = storeToRefs(useConfigStore());

// State
const editable: Ref<boolean> = ref(true);
const filteredProjectActivityIds: Ref<Array<string>> = ref([]);
const formRef: Ref<InstanceType<typeof Form> | null> = ref(null);
const initialFormValues: Ref<undefined | object> = ref(undefined);
const projectActivityIds: Ref<Array<string>> = ref([]);
const submissions: Ref<Array<Submission>> = ref([]);
const validationErrors: Ref<string[]> = ref([]);

// Form validation schema
const formSchema = object({
  ...contactValidator,
  [IntakeFormCategory.BASIC]: object({
    isRelated: string().required().oneOf(YES_NO_LIST).label('Related to existing application'),
    relatedActivityId: string().when('isRelated', {
      is: (isRelated: string) => isRelated === BasicResponse.YES,
      then: (schema) => schema.required().max(255).label('Project ID'),
      otherwise: (schema) => schema.notRequired().label('Project ID')
    }),
    enquiryDescription: string().required().label('Enquiry'),
    applyForPermitConnect: string()
      .label('Service application')
      .when('isRelated', {
        is: (isRelated: string) => isRelated === BasicResponse.NO,
        then: (schema) => schema.required().oneOf(YES_NO_LIST),
        otherwise: (schema) => schema.notRequired()
      })
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
    '{{ contactName }}': formRef.value?.values.contacts[0].firstName,
    '{{ activityId }}': activityId,
    '{{ enquiryDescription }}': firstTwoSentences.trim(),
    '{{ enquiryId }}': enquiryId
  });
  let applicantEmail = formRef.value?.values.contacts[0].email;
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
    }

    initialFormValues.value = {
      activityId: response?.activityId,
      enquiryId: response?.enquiryId,
      contactFirstName: response?.contacts[0].firstName,
      contactLastName: response?.contacts[0].lastName,
      contactPhoneNumber: response?.contacts[0].phoneNumber,
      contactEmail: response?.contacts[0].email,
      contactApplicantRelationship: response?.contacts[0].contactApplicantRelationship,
      contactPreference: response?.contacts[0].contactPreference,
      basic: {
        isRelated: response?.isRelated,
        relatedActivityId: response?.relatedActivityId,
        enquiryDescription: response?.enquiryDescription,
        applyForPermitConnect: response?.applyForPermitConnect
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

  let enquiryResponse, submissionResponse;

  try {
    // Need to first create the submission to relate to if asking to apply
    if (data.basic.applyForPermitConnect === BasicResponse.YES) {
      submissionResponse = await submissionService.submitDraft({ applicant: data.applicant });
      if (submissionResponse.data.activityId) {
        formRef.value?.setFieldValue('basic.relatedActivityId', submissionResponse.data.activityId);
      } else {
        throw new Error('Failed to retrieve correct submission draft data');
      }
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
            contactPreference: data.contactPreference
          }
        ]
      },
      [
        'contactFirstName',
        'contactLastName',
        'contactPhoneNumber',
        'contactEmail',
        'contactApplicantRelationship',
        'contactPreference'
      ]
    );

    enquiryResponse = await enquiryService.createEnquiry(enquiryData);

    if (enquiryResponse.data.activityId && enquiryResponse.data.enquiryId) {
      formRef.value?.setFieldValue('activityId', enquiryResponse.data.activityId);
      formRef.value?.setFieldValue('enquiryId', enquiryResponse.data.enquiryId);

      // Send confirmation email
      emailConfirmation(enquiryResponse.data.activityId, enquiryResponse.data.enquiryId);

      router.push({
        name: RouteName.HOUSING_ENQUIRY_CONFIRMATION,
        query: {
          activityId: enquiryResponse.data.activityId,
          enquiryId: enquiryResponse.data.enquiryId
        }
      });
    } else {
      throw new Error('Failed to retrieve correct enquiry data');
    }
  } catch (e: any) {
    toast.error('Failed to save intake', e);
  } finally {
    editable.value = true;

    if (data.basic.applyForPermitConnect === BasicResponse.YES) {
      router.push({
        name: RouteName.HOUSING_SUBMISSION_INTAKE,
        query: {
          activityId: submissionResponse?.data.activityId,
          submissionId: submissionResponse?.data.submissionId
        }
      });
    }
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
    <div class="flex justify-content-center align-items-center app-primary-color mb-2 mt-3">
      <h3>Enquiry Form</h3>
    </div>

    <CollectionDisclaimer />

    <Form
      v-if="initialFormValues"
      v-slot="{ values }"
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

      <Card>
        <template #title>
          <span class="section-header">{{ t('enquiryIntakeForm.contactInformation') }}</span>

          <Divider type="solid" />
        </template>
        <template #content>
          <div class="formgrid grid">
            <InputText
              class="col-6"
              name="contactFirstName"
              label="First name"
              :bold="false"
              :disabled="!editable"
            />
            <InputText
              class="col-6"
              name="contactLastName"
              label="Last name"
              :bold="false"
              :disabled="!editable"
            />
            <InputMask
              class="col-6"
              name="contactPhoneNumber"
              mask="(999) 999-9999"
              label="Phone number"
              :bold="false"
              :disabled="!editable"
            />
            <InputText
              class="col-6"
              name="contactEmail"
              label="Email"
              :bold="false"
              :disabled="!editable"
            />
            <Dropdown
              class="col-6"
              name="contactApplicantRelationship"
              label="Relationship to project"
              :bold="false"
              :disabled="!editable"
              :options="PROJECT_RELATIONSHIP_LIST"
            />
            <Dropdown
              class="col-6"
              :name="`contactPreference`"
              label="Preferred contact method"
              :bold="false"
              :disabled="!editable"
              :options="CONTACT_PREFERENCE_LIST"
            />
          </div>
        </template>
      </Card>
      <Card>
        <template #title>
          <span class="section-header">Tell us about your enquiry</span>
          <Divider type="solid" />
        </template>
        <template #content>
          <div class="formgrid grid">
            <TextArea
              class="col-12"
              name="basic.enquiryDescription"
              placeholder="Type here..."
              :disabled="!editable"
            />
          </div>
        </template>
      </Card>
      <div class="flex align-items-center justify-content-center mt-4">
        <Button
          label="Submit"
          type="submit"
          icon="pi pi-upload"
          :disabled="!editable || values.basic?.applyForPermitConnect === BasicResponse.YES"
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

:deep(.p-invalid),
:deep(.p-card.p-component:has(.p-invalid)) {
  border-color: $app-error !important;
}
</style>
