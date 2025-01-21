import { shallowMount } from '@vue/test-utils';

import HousingView from '@/views/housing/HousingView.vue';
import PrimeVue from 'primevue/config';
import { enquiryService, submissionService } from '@/services';
import type { AxiosResponse } from 'axios';

// Mock dependencies
vi.mock('vue-i18n', () => ({
  useI18n: () => ({
    t: vi.fn()
  })
}));

vi.mock('vue-router', () => ({
  useRoute: () => ({
    query: {},
    params: {},
    name: 'housing-route'
  }),
  useRouter: () => ({
    push: vi.fn()
  })
}));

beforeEach(() => {
  vi.clearAllMocks();
});

afterEach(() => {
  sessionStorage.clear();
});

const getEnquiries = vi.spyOn(enquiryService, 'getEnquiries');
const getDrafts = vi.spyOn(submissionService, 'getDrafts');
const searchSubmissions = vi.spyOn(submissionService, 'searchSubmissions');

searchSubmissions.mockResolvedValue({ data: [{ activityId: 'someActivityid' }] } as AxiosResponse);
getEnquiries.mockResolvedValue({ data: [{ activityId: 'someActivityid' }] } as AxiosResponse);
getDrafts.mockResolvedValue({ data: [{ activityId: 'someActivityid' }] } as AxiosResponse);

const wrapperSettings = () => ({
  global: {
    plugins: [() => PrimeVue],
    stubs: ['font-awesome-icon', 'router-link']
  }
});

describe('HousingView.vue', () => {
  it('renders', () => {
    const wrapper = shallowMount(HousingView, wrapperSettings());

    expect(wrapper).toBeTruthy();
  });
});
