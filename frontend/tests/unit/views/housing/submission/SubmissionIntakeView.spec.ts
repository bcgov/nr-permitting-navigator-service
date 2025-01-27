import SubmissionIntakeView from '@/views/housing/submission/ProjectIntakeView.vue';
import { permitService } from '@/services';
import { createTestingPinia } from '@pinia/testing';
import PrimeVue from 'primevue/config';
import ConfirmationService from 'primevue/confirmationservice';
import ToastService from 'primevue/toastservice';
import { shallowMount } from '@vue/test-utils';
import type { AxiosResponse } from 'axios';

const usePermitService = vi.spyOn(permitService, 'getPermitTypes');

usePermitService.mockResolvedValue({ data: [{ fullName: 'dummyName' }] } as AxiosResponse);

const testSubmissionId = 'enquiry123';
const testActivityId = 'activity123';

const wrapperSettings = (testSubmissionIdProp = testSubmissionId, testActivityIdProp = testActivityId) => ({
  props: {
    submissionId: testSubmissionIdProp,
    activityId: testActivityIdProp
  },
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
    stubs: ['font-awesome-icon', 'router-link']
  }
});

describe('SubmissionIntakeView.vue', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('renders the component with the provided props', () => {
    const wrapper = shallowMount(SubmissionIntakeView, wrapperSettings());
    expect(wrapper).toBeTruthy();
  });
});
