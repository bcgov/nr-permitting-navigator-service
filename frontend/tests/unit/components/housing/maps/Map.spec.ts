import { createTestingPinia } from '@pinia/testing';
//@ts-ignore - Needed for mocks
import * as L from 'leaflet';
import '@geoman-io/leaflet-geoman-free';
import { nextTick } from 'vue';

// import 'leaflet/dist/leaflet.css';
import PrimeVue from 'primevue/config';
import ToastService from 'primevue/toastservice';
import { mount, shallowMount } from '@vue/test-utils';

import Map from '@/components/housing/maps/Map.vue';

const disableInteractionMock = vi.fn();
const enableInteractionMock = vi.fn();

vi.mock('leaflet', async (importOriginal) => {
  const mod = await importOriginal(); // type is inferred
  return {
    //@ts-ignore - insufficient type definitions
    ...mod,
    // replace some exports
    map: vi.fn().mockImplementation(() => ({
      setMaxBounds: () => vi.fn(),
      on: () => vi.fn(),
      invalidateSize: () => vi.fn(),
      pm: {
        addControls: vi.fn(),
        removeControls: vi.fn()
      },
      boxZoom: {
        enable: enableInteractionMock,
        disable: disableInteractionMock
      },
      keyboard: {
        enable: enableInteractionMock,
        disable: disableInteractionMock
      },
      dragging: {
        enable: enableInteractionMock,
        disable: disableInteractionMock
      },
      touchZoom: {
        enable: enableInteractionMock,
        disable: disableInteractionMock
      },
      doubleClickZoom: {
        enable: enableInteractionMock,
        disable: disableInteractionMock
      },
      scrollWheelZoom: {
        enable: enableInteractionMock,
        disable: disableInteractionMock
      },
      eachLayer: () => vi.fn()
    }))
  };
});

vi.mock('@geoman-io/leaflet-geoman-free');

const defaultTestProps = {
  disabled: false,
  geoJsonData: undefined,
  latitude: undefined,
  longitude: undefined,
  pinOrDraw: false
};
const wrapperSettings = (defaultProps = defaultTestProps) => ({
  props: defaultProps,
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
      ToastService
    ],
    stubs: ['font-awesome-icon', 'router-link']
  }
});

describe('ProjectsList.vue', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('renders the component with the provided props', async () => {
    const wrapper = mount(Map, wrapperSettings());
    await nextTick();

    expect(wrapper).toBeTruthy();
  });

  it('calls enableInteraction function when not disabled', async () => {
    mount(Map, wrapperSettings());
    await nextTick();

    expect(enableInteractionMock).toHaveBeenCalledTimes(6);
  });

  it('does not call disableInteraction function when not disabled', async () => {
    const wrapper = mount(Map, wrapperSettings());
    await nextTick();

    wrapper.setProps({ disabled: true });
    await nextTick();

    expect(disableInteractionMock).toHaveBeenCalledTimes(6);
  });
});
