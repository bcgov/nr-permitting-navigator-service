import { createTestingPinia } from '@pinia/testing';
import PrimeVue from 'primevue/config';
import ConfirmationService from 'primevue/confirmationservice';
import ToastService from 'primevue/toastservice';
import Tooltip from 'primevue/tooltip';
import { flushPromises, mount, RouterLinkStub } from '@vue/test-utils';

import EnquiryIntakeForm from '@/components/housing/enquiry/EnquiryIntakeForm.vue';
import { submissionService } from '@/services';
import { BasicResponse, StorageKey } from '@/utils/enums/application';
import { ContactPreference, IntakeFormCategory, ProjectRelationship } from '@/utils/enums/housing';

import type { AxiosResponse } from 'axios';

vi.mock('vue-i18n', () => ({
  useI18n: () => ({
    t: vi.fn()
  })
}));

vi.mock('vue-router', () => ({
  useRouter: () => ({
    push: vi.fn(),
    replace: vi.fn()
  }),
  useRoute: () => ({
    params: {},
    query: {}
  }),
  onBeforeRouteUpdate: vi.fn(),
  onBeforeRouteLeave: vi.fn()
}));

const getActivityIds = vi.spyOn(submissionService, 'getActivityIds');
const getSubmissions = vi.spyOn(submissionService, 'getSubmissions');

getActivityIds.mockResolvedValue({ data: ['someActivityid'] } as AxiosResponse);
getSubmissions.mockResolvedValue({ data: [{ activityId: 'someActivityid' }] } as AxiosResponse);

interface FormValues {
  contactFirstName: string;
  contactLastName: string;
  contactEmail: string;
  contactPhoneNumber: string;
  contactApplicantRelationship: ProjectRelationship;
  contactPreference: ContactPreference;
  basic: {
    isRelated?: string;
    relatedActivityId?: string;
    enquiryDescription?: string;
    applyForPermitConnect?: string;
  };
}

function basicValidFormValues(): FormValues {
  return {
    contactFirstName: 'testFirst',
    contactLastName: 'testLast',
    contactEmail: 'test@email.com',
    contactPhoneNumber: '1234567890',
    contactApplicantRelationship: ProjectRelationship.OWNER,
    contactPreference: ContactPreference.EMAIL,
    basic: {
      isRelated: 'Yes',
      enquiryDescription: 'test description',
      relatedActivityId: 'some Id'
    }
  };
}

const wrapperSettings = () => ({
  global: {
    plugins: [
      () =>
        createTestingPinia({
          initialState: {
            auth: {
              user: {}
            }
          }
        }),
      PrimeVue,
      ConfirmationService,
      ToastService
    ],
    stubs: {
      RouterLink: RouterLinkStub,
      'font-awesome-icon': true
    },
    directives: {
      Tooltip: Tooltip
    }
  }
});

beforeEach(() => {
  sessionStorage.setItem(
    StorageKey.CONFIG,
    JSON.stringify({
      oidc: {
        authority: 'abc',
        clientId: '123'
      }
    })
  );

  vi.clearAllMocks();
});

afterEach(() => {
  sessionStorage.clear();
});

describe('EnquiryIntakeForm', () => {
  describe('component', async () => {
    it('renders component', async () => {
      const wrapper = mount(EnquiryIntakeForm, wrapperSettings());
      await flushPromises();

      expect(wrapper.isVisible()).toBeTruthy();
    });

    it('renders initial form fields', async () => {
      const wrapper = mount(EnquiryIntakeForm, wrapperSettings());
      await flushPromises();

      const firstNameInput = wrapper.get('[name="contactFirstName"]');
      const lastNameInput = wrapper.get('[name="contactLastName"]');
      const phoneInput = wrapper.get('[name="contactPhoneNumber"]');
      const emailInput = wrapper.get('[name="contactEmail"]');

      expect(firstNameInput.isVisible()).toBeTruthy();
      expect(lastNameInput.isVisible()).toBeTruthy();
      expect(phoneInput.isVisible()).toBeTruthy();
      expect(emailInput.isVisible()).toBeTruthy();

      const descriptionInput = wrapper.find('[name="basic.enquiryDescription"]');
      expect(descriptionInput.exists()).toBe(true);
    });
  });

  describe('validation', async () => {
    it('accepts valid values (isRelated: Yes)', async () => {
      const wrapper = mount(EnquiryIntakeForm, wrapperSettings());
      await flushPromises();

      const formRef = (wrapper.vm as any)?.formRef;
      formRef.setValues(basicValidFormValues());

      const result = await formRef?.validate();
      expect(Object.keys(result.errors).length).toBe(0);
    });

    it('accepts valid values (isRelated: No, applyForPermitConnect: No)', async () => {
      const wrapper = mount(EnquiryIntakeForm, wrapperSettings());
      await flushPromises();

      const formRef = (wrapper.vm as any)?.formRef;

      const modifiedFormValues = {
        ...basicValidFormValues()
      };

      modifiedFormValues[IntakeFormCategory.BASIC].isRelated = BasicResponse.NO;
      modifiedFormValues[IntakeFormCategory.BASIC].applyForPermitConnect = BasicResponse.NO;
      formRef.setValues(modifiedFormValues);

      const result = await formRef?.validate();
      expect(Object.keys(result.errors).length).toBe(0);
    });

    it('accepts valid values (isRelated: No, applyForPermitConnect: No)', async () => {
      const wrapper = mount(EnquiryIntakeForm, wrapperSettings());
      await flushPromises();

      const formRef = (wrapper.vm as any)?.formRef;

      const modifiedFormValues = {
        ...basicValidFormValues()
      };

      modifiedFormValues[IntakeFormCategory.BASIC].isRelated = BasicResponse.NO;
      modifiedFormValues[IntakeFormCategory.BASIC].applyForPermitConnect = BasicResponse.NO;
      formRef.setValues(modifiedFormValues);

      const result = await formRef?.validate();
      expect(Object.keys(result.errors).length).toBe(0);
    });

    it('generates email error', async () => {
      const wrapper = mount(EnquiryIntakeForm, wrapperSettings());
      await flushPromises();

      const formRef = (wrapper.vm as any)?.formRef;

      const modifiedFormValues = {
        ...basicValidFormValues()
      };

      modifiedFormValues.contactEmail = 'bad@email';
      formRef.setValues(modifiedFormValues);

      const result = await formRef?.validate();
      expect(Object.keys(result.errors).length).toBe(1);
      expect(result.errors['contactEmail']).toBeTruthy();
    });

    it('generates missing first and last name missing error', async () => {
      const wrapper = mount(EnquiryIntakeForm, wrapperSettings());
      await flushPromises();

      const formRef = (wrapper.vm as any)?.formRef;

      const modifiedFormValues = {
        ...basicValidFormValues()
      };

      modifiedFormValues.contactFirstName = '';
      modifiedFormValues.contactLastName = '';

      formRef.setValues(modifiedFormValues);

      const result = await formRef?.validate();
      expect(Object.keys(result.errors).length).toBe(2);
      expect(result.errors['contactFirstName']).toBeTruthy();
      expect(result.errors['contactLastName']).toBeTruthy();
    });

    it('generates errors for isRelated', async () => {
      const wrapper = mount(EnquiryIntakeForm, wrapperSettings());
      await flushPromises();

      const formRef = (wrapper.vm as any)?.formRef;

      const modifiedFormValues = {
        ...basicValidFormValues()
      };

      modifiedFormValues[IntakeFormCategory.BASIC].isRelated = 'test';

      formRef.setValues(modifiedFormValues);

      const result1 = await formRef?.validate();
      expect(Object.keys(result1.errors).length).toBe(1);
      expect(result1.errors[`${[IntakeFormCategory.BASIC]}.isRelated`]).toBeTruthy();
    });

    it('generates errors for applyForPermitConnect', async () => {
      const wrapper = mount(EnquiryIntakeForm, wrapperSettings());
      await flushPromises();

      const formRef = (wrapper.vm as any)?.formRef;

      const modifiedFormValues = {
        ...basicValidFormValues()
      };
      modifiedFormValues[IntakeFormCategory.BASIC].isRelated = BasicResponse.NO;
      modifiedFormValues[IntakeFormCategory.BASIC].applyForPermitConnect = 'test';

      formRef.setValues(modifiedFormValues);

      const result2 = await formRef?.validate();
      expect(Object.keys(result2.errors).length).toBe(1);
      expect(result2.errors[`${[IntakeFormCategory.BASIC]}.applyForPermitConnect`]).toBeTruthy();
    });
  });
});
