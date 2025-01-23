<script setup lang="ts">
import { Form } from 'vee-validate';
import { computed, onMounted, ref } from 'vue';
import { boolean, number, object, string } from 'yup';

import {
  CancelButton,
  Checkbox,
  DatePicker,
  EditableSelect,
  FormNavigationGuard,
  InputMask,
  InputNumber,
  InputText,
  Select,
  SectionHeader,
  TextArea
} from '@/components/form';
import ATSUserLinkModal from '@/components/user/ATSUserLinkModal.vue';
import ATSUserCreateModal from '@/components/user/ATSUserCreateModal.vue';
import ATSUserDetailsModal from '@/components/user/ATSUserDetailsModal.vue';
import { Button, Message, useConfirm, useToast } from '@/lib/primevue';
import { submissionService, userService } from '@/services';
import { useSubmissionStore } from '@/store';
import { YES_NO_LIST, YES_NO_UNSURE_LIST } from '@/utils/constants/application';
import {
  APPLICATION_STATUS_LIST,
  CONTACT_PREFERENCE_LIST,
  INTAKE_STATUS_LIST,
  NUM_RESIDENTIAL_UNITS_LIST,
  PROJECT_RELATIONSHIP_LIST,
  QUEUE_PRIORITY,
  SUBMISSION_TYPE_LIST
} from '@/utils/constants/housing';
import { BasicResponse, Regex } from '@/utils/enums/application';
import { ApplicationStatus, IntakeStatus } from '@/utils/enums/housing';
import {
  assignedToValidator,
  atsClientIdValidator,
  contactValidator,
  latitudeValidator,
  longitudeValidator
} from '@/validators';

import type { Ref } from 'vue';
import type { IInputEvent } from '@/interfaces';
import type { ATSClientResource, Submission, User } from '@/types';
import { omit, setEmptyStringsToNull } from '@/utils/utils';
import type { SelectChangeEvent } from 'primevue/select';

// Interfaces
interface SubmissionForm extends Submission {
  locationAddress: string;
  user?: User;
}

// Props
const { editable = true, submission } = defineProps<{
  editable?: boolean;
  submission: Submission;
}>();

// Store
const submissionStore = useSubmissionStore();

// State
const assigneeOptions: Ref<Array<User>> = ref([]);
const atsUserLinkModalVisible: Ref<boolean> = ref(false);
const atsUserDetailsModalVisible: Ref<boolean> = ref(false);
const atsUserCreateModalVisible: Ref<boolean> = ref(false);
const formRef: Ref<InstanceType<typeof Form> | null> = ref(null);
const initialFormValues: Ref<any | undefined> = ref(undefined);
const showCancelMessage: Ref<boolean> = ref(false);

// Form validation schema
const formSchema = object({
  queuePriority: number()
    .required()
    .integer()
    .min(0)
    .max(3)
    .typeError('Queue Priority must be a number')
    .label('Queue Priority'),
  submissionType: string().required().oneOf(SUBMISSION_TYPE_LIST).label('Submission type'),
  submittedAt: string().required().label('Submission date'),
  relatedEnquiries: string().notRequired().label('Related enquiries'),
  ...contactValidator,
  companyNameRegistered: string().notRequired().max(255).label('Company'),
  consentToFeedback: string().notRequired().nullable().label('Consent to feedback'),
  isDevelopedInBC: string().when('companyNameRegistered', {
    is: (val: string) => val,
    then: (schema) => schema.required().oneOf(YES_NO_LIST).label('Company registered in B.C'),
    otherwise: () => string().notRequired()
  }),
  projectName: string().required().label('Project Name'),
  projectDescription: string().notRequired().label('Additional information about project'),
  singleFamilyUnits: string().notRequired().oneOf(NUM_RESIDENTIAL_UNITS_LIST).label('Single family units'),
  multiFamilyUnits: string().notRequired().oneOf(NUM_RESIDENTIAL_UNITS_LIST).label('Multi-family units'),
  otherUnitsDescription: string().notRequired().max(255).label('Other type'),
  otherUnits: string().when('otherUnitsDescription', {
    is: (val: string) => val === BasicResponse.YES,
    then: (schema) => schema.required().oneOf(NUM_RESIDENTIAL_UNITS_LIST).label('Other type units'),
    otherwise: () => string().notRequired()
  }),
  hasRentalUnits: string().required().oneOf(YES_NO_UNSURE_LIST).label('Rental included'),
  rentalUnits: string().when('hasRentalUnits', {
    is: (val: string) => val === BasicResponse.YES,
    then: (schema) => schema.required().oneOf(NUM_RESIDENTIAL_UNITS_LIST).label('Rental units'),
    otherwise: () => string().notRequired()
  }),
  financiallySupportedBC: string().required().oneOf(YES_NO_UNSURE_LIST).label('BC Housing'),
  financiallySupportedIndigenous: string().required().oneOf(YES_NO_UNSURE_LIST).label('Indigenous Housing Provider'),
  indigenousDescription: string().when('financiallySupportedIndigenous', {
    is: (val: string) => val === BasicResponse.YES,
    then: (schema) => schema.required().max(255).label('Name of Indigenous Housing Provider'),
    otherwise: () => string().notRequired()
  }),
  financiallySupportedNonProfit: string().required().oneOf(YES_NO_UNSURE_LIST).label('Non-profit housing society'),
  nonProfitDescription: string().when('financiallySupportedNonProfit', {
    is: (val: string) => val === BasicResponse.YES,
    then: (schema) => schema.required().max(255).label('Name of Non-profit housing society'),
    otherwise: () => string().notRequired()
  }),
  financiallySupportedHousingCoop: string().required().oneOf(YES_NO_UNSURE_LIST).label('Housing co-operative'),
  housingCoopDescription: string().when('financiallySupportedHousingCoop', {
    is: (val: string) => val === BasicResponse.YES,
    then: (schema) => schema.required().max(255).label('Name of Housing co-operative'),
    otherwise: () => string().notRequired()
  }),
  streetAddress: string().notRequired().max(255).label('Street address'),
  locality: string().notRequired().max(255).label('Locality'),
  province: string().notRequired().max(255).label('Province'),
  locationPIDs: string().notRequired().max(255).label('Location PID(s)'),
  latitude: latitudeValidator,
  longitude: longitudeValidator,
  geomarkUrl: string().notRequired().max(255).label('Geomark URL'),
  naturalDisaster: string().oneOf(YES_NO_LIST).required().label('Affected by natural disaster'),
  projectLocationDescription: string().notRequired().max(4000).label('Additional information about location'),
  addedToATS: boolean().required().label('Authorized Tracking System (ATS) updated'),
  atsClientId: atsClientIdValidator,
  ltsaCompleted: boolean().required().label('Land Title Survey Authority (LTSA) completed'),
  bcOnlineCompleted: boolean().required().label('BC Online completed'),
  aaiUpdated: boolean().required().label('Authorization and Approvals Insight (AAI) updated'),
  astNotes: string().notRequired().max(4000).label('Automated Status Tool (AST) Notes'),
  intakeStatus: string().oneOf(INTAKE_STATUS_LIST).label('Intake state'),
  user: assignedToValidator('intakeStatus', IntakeStatus.SUBMITTED),
  applicationStatus: string().oneOf(APPLICATION_STATUS_LIST).label('Project state'),
  waitingOn: string().notRequired().max(255).label('waiting on')
});

// Actions
const confirm = useConfirm();
const toast = useToast();

const getAssigneeOptionLabel = (e: User) => {
  return `${e.fullName} [${e.email}]`;
};

const isCompleted = computed(() => {
  return submission.applicationStatus === ApplicationStatus.COMPLETED;
});

const onAssigneeInput = async (e: IInputEvent) => {
  const input = e.target.value;

  if (input.length >= 3) {
    assigneeOptions.value = (await userService.searchUsers({ email: input, fullName: input })).data;
  } else if (input.match(Regex.EMAIL)) {
    assigneeOptions.value = (await userService.searchUsers({ email: input })).data;
  } else {
    assigneeOptions.value = [];
  }
};

function onCancel() {
  formRef.value?.resetForm();
  showCancelMessage.value = true;

  setTimeout(() => {
    document.getElementById('cancelMessage')?.scrollIntoView({ behavior: 'smooth' });
  }, 100);
  setTimeout(() => {
    showCancelMessage.value = false;
  }, 6000);
}

function onInvalidSubmit(e: any) {
  const errors = Object.keys(e.errors);

  // Scrolls to the top-most error
  let first: Element | null = null;

  for (let error of errors) {
    const el = document.querySelector(`[name="${error}"]`);
    const rect = el?.getBoundingClientRect();

    if (rect) {
      if (!first) first = el;
      else if (rect.top < first.getBoundingClientRect().top) first = el;
    }
  }

  first?.scrollIntoView({ behavior: 'smooth' });
}

function onReOpen() {
  confirm.require({
    message: 'Please confirm that you want to re-open this submission',
    header: 'Re-open submission?',
    acceptLabel: 'Confirm',
    rejectLabel: 'Cancel',
    accept: () => {
      formRef.value?.setFieldValue('applicationStatus', ApplicationStatus.IN_PROGRESS);
      onSubmit(formRef.value?.values);
    }
  });
}

const onSubmit = async (values: any) => {
  try {
    // Convert contact fields into contacts array object then remove form keys from data
    const valuesWithContact = omit(
      {
        ...values,
        atsClientId: parseInt(values.atsClientId) || '',
        contacts: [
          {
            contactId: values.contactId,
            firstName: values.contactFirstName,
            lastName: values.contactLastName,
            phoneNumber: values.contactPhoneNumber,
            email: values.contactEmail,
            contactApplicantRelationship: values.contactApplicantRelationship,
            contactPreference: values.contactPreference
          }
        ]
      },
      [
        'contactId',
        'contactFirstName',
        'contactLastName',
        'contactPhoneNumber',
        'contactEmail',
        'contactApplicantRelationship',
        'contactPreference'
      ]
    );

    // Generate final submission object
    const submitData: Submission = omit(setEmptyStringsToNull(valuesWithContact) as SubmissionForm, [
      'locationAddress',
      'user'
    ]);
    submitData.assignedUserId = values.user?.userId ?? undefined;
    submitData.consentToFeedback = values.consentToFeedback === BasicResponse.YES;
    const result = await submissionService.updateSubmission(values.submissionId, submitData);
    submissionStore.setSubmission(result.data);
    formRef.value?.resetForm({
      values: {
        ...submitData,
        contactId: submitData?.contacts[0].contactId,
        contactFirstName: submitData?.contacts[0].firstName,
        contactLastName: submitData?.contacts[0].lastName,
        contactPhoneNumber: submitData?.contacts[0].phoneNumber,
        contactEmail: submitData?.contacts[0].email,
        contactApplicantRelationship: submitData?.contacts[0].contactApplicantRelationship,
        contactPreference: submitData?.contacts[0].contactPreference,
        locationAddress: values.locationAddress,
        user: values.user,
        consentToFeedback: values.consentToFeedback
      }
    });

    toast.success('Form saved');
  } catch (e: any) {
    toast.error('Failed to save submission', e.message);
  }
};

function updateLocationAddress(values: any, setFieldValue?: Function) {
  const locationAddressStr = [values.streetAddress, values.locality, values.province]
    .filter((str) => str?.trim())
    .join(', ');

  if (setFieldValue) setFieldValue('locationAddress', locationAddressStr);

  return locationAddressStr;
}

onMounted(async () => {
  if (submission.assignedUserId) {
    assigneeOptions.value = (await userService.searchUsers({ userId: [submission.assignedUserId] })).data;
  }

  // Default form values
  initialFormValues.value = {
    activityId: submission.activityId,
    submissionId: submission.submissionId,
    queuePriority: submission.queuePriority,
    submissionType: submission.submissionType,
    submittedAt: new Date(submission.submittedAt),
    relatedEnquiries: submission.relatedEnquiries,
    companyNameRegistered: submission.companyNameRegistered,
    isDevelopedInBC: submission.isDevelopedInBC,
    consentToFeedback: submission.consentToFeedback ? BasicResponse.YES : BasicResponse.NO,
    projectName: submission.projectName,
    projectDescription: submission.projectDescription,
    projectLocationDescription: submission.projectLocationDescription,
    singleFamilyUnits: submission.singleFamilyUnits,
    multiFamilyUnits: submission.multiFamilyUnits,
    otherUnitsDescription: submission.otherUnitsDescription,
    otherUnits: submission.otherUnits,
    hasRentalUnits: submission.hasRentalUnits,
    rentalUnits: submission.rentalUnits,
    financiallySupportedBC: submission.financiallySupportedBC,
    financiallySupportedIndigenous: submission.financiallySupportedIndigenous,
    indigenousDescription: submission.indigenousDescription,
    financiallySupportedNonProfit: submission.financiallySupportedNonProfit,
    nonProfitDescription: submission.nonProfitDescription,
    financiallySupportedHousingCoop: submission.financiallySupportedHousingCoop,
    housingCoopDescription: submission.housingCoopDescription,
    locationAddress: updateLocationAddress(submission),
    streetAddress: submission.streetAddress,
    locality: submission.locality,
    province: submission.province,
    locationPIDs: submission.locationPIDs,
    locationPIDsAuto: submission.locationPIDsAuto,
    latitude: submission.latitude,
    longitude: submission.longitude,
    geomarkUrl: submission.geomarkUrl,
    naturalDisaster: submission.naturalDisaster,
    addedToATS: submission.addedToATS,
    atsClientId: submission.atsClientId,
    ltsaCompleted: submission.ltsaCompleted,
    bcOnlineCompleted: submission.bcOnlineCompleted,
    aaiUpdated: submission.aaiUpdated,
    astNotes: submission.astNotes,
    intakeStatus: submission.intakeStatus,
    contactId: submission?.contacts[0]?.contactId,
    contactFirstName: submission?.contacts[0]?.firstName,
    contactLastName: submission?.contacts[0]?.lastName,
    contactPhoneNumber: submission?.contacts[0]?.phoneNumber,
    contactEmail: submission?.contacts[0]?.email,
    contactApplicantRelationship: submission?.contacts[0]?.contactApplicantRelationship,
    contactPreference: submission?.contacts[0]?.contactPreference,
    user: assigneeOptions.value[0] ?? null,
    applicationStatus: submission.applicationStatus,
    waitingOn: submission.waitingOn
  };
});
</script>

<template>
  <Message
    v-if="showCancelMessage"
    id="cancelMessage"
    severity="warn"
    :closable="false"
    :life="5500"
  >
    Your changes have not been saved.
  </Message>
  <Form
    v-if="initialFormValues"
    v-slot="{ setFieldValue, values }"
    ref="formRef"
    :initial-values="initialFormValues"
    :validation-schema="formSchema"
    @invalid-submit="(e) => onInvalidSubmit(e)"
    @submit="onSubmit"
  >
    <FormNavigationGuard v-if="!isCompleted" />

    <div class="grid grid-cols-12 gap-4">
      <Select
        class="col-span-3"
        name="queuePriority"
        label="Priority"
        :disabled="!editable"
        :options="QUEUE_PRIORITY"
      />
      <Select
        class="col-span-3"
        name="submissionType"
        label="Submission type"
        :disabled="!editable"
        :options="SUBMISSION_TYPE_LIST"
      />
      <DatePicker
        class="col-span-3"
        name="submittedAt"
        label="Submission date"
        :disabled="true"
      />
      <InputText
        class="col-span-3"
        name="relatedEnquiries"
        label="Related enquiries"
        :disabled="true"
      />

      <SectionHeader title="Basic information" />

      <InputText
        class="col-span-3"
        name="contactFirstName"
        label="First name"
        :disabled="true"
      />
      <InputText
        class="col-span-3"
        name="contactLastName"
        label="Last name"
        :disabled="true"
      />
      <InputText
        class="col-span-3"
        name="companyNameRegistered"
        label="Company"
        :disabled="!editable"
        @on-change="
          (e) => {
            if (!e.target.value) {
              setFieldValue('companyNameRegistered', null);
              setFieldValue('isDevelopedInBC', null);
            }
          }
        "
      />
      <Select
        class="col-span-3"
        name="isDevelopedInBC"
        label="Company registered in B.C?"
        :disabled="!editable || !values.companyNameRegistered"
        :options="YES_NO_LIST"
      />
      <Select
        class="col-span-3"
        name="contactApplicantRelationship"
        label="Relationship to project"
        :disabled="!editable"
        :options="PROJECT_RELATIONSHIP_LIST"
      />
      <Select
        class="col-span-3"
        name="contactPreference"
        label="Preferred contact method"
        :disabled="!editable"
        :options="CONTACT_PREFERENCE_LIST"
      />
      <InputMask
        class="col-span-3"
        name="contactPhoneNumber"
        mask="(999) 999-9999"
        label="Contact phone"
        :disabled="true"
      />
      <InputText
        class="col-span-3"
        name="contactEmail"
        label="Contact email"
        :disabled="true"
      />
      <Select
        class="col-span-3"
        name="consentToFeedback"
        label="Research opt-in"
        :disabled="!editable"
        :options="YES_NO_LIST"
      />

      <SectionHeader title="Housing" />

      <InputText
        class="col-span-3"
        name="projectName"
        label="Project name"
        :disabled="!editable"
      />
      <div class="col-span-9" />
      <TextArea
        class="col-span-12"
        name="projectDescription"
        label="Additional information about project"
        :disabled="!editable"
      />
      <Select
        class="col-span-3"
        name="singleFamilyUnits"
        label="Single family units"
        :disabled="!editable"
        :options="NUM_RESIDENTIAL_UNITS_LIST"
      />
      <Select
        class="col-span-3"
        name="multiFamilyUnits"
        label="Multi-family units"
        :disabled="!editable"
        :options="NUM_RESIDENTIAL_UNITS_LIST"
      />
      <InputText
        class="col-span-3"
        name="otherUnitsDescription"
        label="Other type"
        :disabled="!editable"
        @on-change="
          (e) => {
            if (!e.target.value) {
              setFieldValue('otherUnitsDescription', null);
              setFieldValue('otherUnits', null);
            }
          }
        "
      />
      <Select
        class="col-span-3"
        name="otherUnits"
        label="Other type units"
        :disabled="!editable || !values.otherUnitsDescription"
        :options="NUM_RESIDENTIAL_UNITS_LIST"
      />
      <Select
        class="col-span-3"
        name="hasRentalUnits"
        label="Rental included?"
        :disabled="!editable"
        :options="YES_NO_UNSURE_LIST"
        @on-change="
          (e: SelectChangeEvent) => {
            if (e.value !== BasicResponse.YES) setFieldValue('rentalUnits', null);
          }
        "
      />
      <Select
        class="col-span-3"
        name="rentalUnits"
        label="Rental units"
        :disabled="!editable || values.hasRentalUnits !== BasicResponse.YES"
        :options="NUM_RESIDENTIAL_UNITS_LIST"
      />

      <SectionHeader title="Financially supported" />

      <Select
        class="col-span-3"
        name="financiallySupportedBC"
        label="BC Housing"
        :disabled="!editable"
        :options="YES_NO_UNSURE_LIST"
      />
      <div class="col-span-9" />
      <Select
        class="col-span-3"
        name="financiallySupportedIndigenous"
        label="Indigenous Housing Provider"
        :disabled="!editable"
        :options="YES_NO_UNSURE_LIST"
        @on-change="
          (e: SelectChangeEvent) => {
            if (e.value !== BasicResponse.YES) setFieldValue('indigenousDescription', null);
          }
        "
      />
      <InputText
        class="col-span-3"
        name="indigenousDescription"
        label="Name of Indigenous Housing Provider"
        :disabled="!editable || values.financiallySupportedIndigenous !== BasicResponse.YES"
      />
      <div class="col-span-6" />
      <Select
        class="col-span-3"
        name="financiallySupportedNonProfit"
        label="Non-profit housing society"
        :disabled="!editable"
        :options="YES_NO_UNSURE_LIST"
        @on-change="
          (e: SelectChangeEvent) => {
            if (e.value !== BasicResponse.YES) setFieldValue('nonProfitDescription', null);
          }
        "
      />
      <InputText
        class="col-span-3"
        name="nonProfitDescription"
        label="Name of Non-profit housing society"
        :disabled="!editable || values.financiallySupportedNonProfit !== BasicResponse.YES"
      />
      <div class="col-span-6" />
      <Select
        class="col-span-3"
        name="financiallySupportedHousingCoop"
        label="Housing co-operative"
        :disabled="!editable"
        :options="YES_NO_UNSURE_LIST"
        @on-change="
          (e: SelectChangeEvent) => {
            if (e.value !== BasicResponse.YES) setFieldValue('housingCoopDescription', null);
          }
        "
      />
      <InputText
        class="col-span-3"
        name="housingCoopDescription"
        label="Name of Housing co-operative"
        :disabled="!editable || values.financiallySupportedHousingCoop !== BasicResponse.YES"
      />
      <div class="col-span-6" />

      <SectionHeader title="Location" />

      <InputText
        class="col-span-3"
        name="locationAddress"
        label="Location address"
        :disabled="true"
      />
      <InputText
        class="col-span-3"
        name="streetAddress"
        label="Street address"
        :disabled="!editable"
        @on-change="updateLocationAddress(values, setFieldValue)"
      />
      <InputText
        class="col-span-3"
        name="locality"
        label="Locality"
        :disabled="!editable"
        @on-change="updateLocationAddress(values, setFieldValue)"
      />
      <InputText
        class="col-span-3"
        name="province"
        label="Province"
        :disabled="!editable"
        @on-change="updateLocationAddress(values, setFieldValue)"
      />
      <InputText
        class="col-span-3"
        name="locationPIDs"
        label="Location PID(s)"
        :disabled="!editable"
      />
      <InputNumber
        class="col-span-3"
        name="latitude"
        label="Location latitude"
        help-text="Optionally provide a number between 48 and 60"
        :disabled="!editable"
      />
      <InputNumber
        class="col-span-3"
        name="longitude"
        label="Location longitude"
        help-text="Optionally provide a number between -114 and -139"
        :disabled="!editable"
      />
      <InputText
        class="col-span-3"
        name="geomarkUrl"
        label="Geomark URL"
        :disabled="!editable"
      />
      <Select
        class="col-span-3"
        name="naturalDisaster"
        label="Affected by natural disaster?"
        :disabled="!editable"
        :options="YES_NO_LIST"
      />
      <TextArea
        class="col-12"
        name="locationPIDsAuto"
        label="Auto Generated Location PID(s)"
        :disabled="!editable"
      />
      <TextArea
        class="col-12"
        name="projectLocationDescription"
        label="Additional information about location"
        :disabled="!editable"
      />
      <div class="col-span-6" />

      <SectionHeader title="ATS" />
      <div class="grid grid-cols-subgrid gap-4 col-span-12">
        <div
          v-if="values.atsClientId"
          class="col-start-1 col-span-12"
        >
          <div class="flex items-center">
            <h5 class="mr-2">Client #</h5>
            <a
              class="hover-hand"
              @click="atsUserDetailsModalVisible = true"
            >
              {{ values.atsClientId }}
            </a>
          </div>
        </div>
        <input
          type="hidden"
          name="atsClientId"
        />
        <Button
          v-if="!values.atsClientId"
          class="col-start-1 col-span-2"
          aria-label="Link to ATS"
          :disabled="!editable"
          @click="atsUserLinkModalVisible = true"
        >
          Search ATS
        </Button>
        <Button
          v-if="!values.atsClientId"
          class="grid-col-start-3 col-span-2"
          aria-label="New ATS client"
          :disabled="!editable"
          @click="atsUserCreateModalVisible = true"
        >
          New ATS Client
        </Button>
      </div>
      <Checkbox
        class="col-span-12 mt-2"
        name="addedToATS"
        label="Authorized Tracking System (ATS) updated"
        :disabled="!editable"
        :bold="true"
      />

      <SectionHeader
        title="Other"
        class="mt-2"
      />

      <Checkbox
        class="col-span-12"
        name="ltsaCompleted"
        label="Land Title Survey Authority (LTSA) completed"
        :disabled="!editable"
      />
      <Checkbox
        class="col-span-12"
        name="bcOnlineCompleted"
        label="BC Online completed"
        :disabled="!editable"
      />
      <Checkbox
        class="col-span-12"
        name="aaiUpdated"
        label="Authorization and Approvals Insight (AAI) updated"
        :disabled="!editable"
      />
      <TextArea
        class="col-span-12"
        name="astNotes"
        label="Automated Status Tool (AST) Notes"
        :disabled="!editable"
      />

      <SectionHeader title="Submission state" />

      <Select
        class="col-span-3"
        name="intakeStatus"
        label="Intake state"
        :disabled="!editable"
        :options="INTAKE_STATUS_LIST"
      />
      <EditableSelect
        class="col-span-3"
        name="user"
        label="Assigned to"
        :disabled="!editable"
        :options="assigneeOptions"
        :get-option-label="getAssigneeOptionLabel"
        @on-input="onAssigneeInput"
      />
      <Select
        class="col-span-3"
        name="applicationStatus"
        label="Project state"
        :disabled="!editable"
        :options="APPLICATION_STATUS_LIST"
      />
      <InputText
        class="col-span-3"
        name="waitingOn"
        label="Waiting on"
        :disabled="!editable"
      />

      <div class="field col-span-12 mt-8">
        <Button
          v-if="!isCompleted"
          label="Save"
          type="submit"
          icon="pi pi-check"
          :disabled="!editable"
        />
        <CancelButton
          v-if="!isCompleted"
          :editable="editable"
          @clicked="onCancel"
        />
        <Button
          v-if="isCompleted"
          label="Re-open submission"
          icon="pi pi-check"
          @click="onReOpen()"
        />
      </div>
    </div>
    <ATSUserLinkModal
      v-model:visible="atsUserLinkModalVisible"
      :submission-or-enquiry="submission"
      @ats-user-link:link="
        (atsClientResource: ATSClientResource) => {
          atsUserLinkModalVisible = false;
          setFieldValue('atsClientId', atsClientResource.clientId?.toString());
        }
      "
    />
    <ATSUserDetailsModal
      v-model:visible="atsUserDetailsModalVisible"
      :ats-client-id="values.atsClientId"
      @ats-user-details:un-link="
        () => {
          atsUserDetailsModalVisible = false;
          setFieldValue('atsClientId', null);
        }
      "
    />
    <ATSUserCreateModal
      v-model:visible="atsUserCreateModalVisible"
      :submission-or-enquiry="submission"
      @ats-user-link:link="
        (atsClientId: string) => {
          atsUserCreateModalVisible = false;
          setFieldValue('atsClientId', atsClientId.toString());
        }
      "
    />
  </Form>
</template>
