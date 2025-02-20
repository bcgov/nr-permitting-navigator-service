import { createTestingPinia } from '@pinia/testing';
// Needed to be imported before mocking
// eslint-disable-next-line no-unused-vars, @typescript-eslint/no-unused-vars
import * as L from 'leaflet';
import '@geoman-io/leaflet-geoman-free';
import { nextTick } from 'vue';

import Map from '@/components/housing/maps/Map.vue';
import { externalApiService } from '@/services';
import { mount } from '@vue/test-utils';
import PrimeVue from 'primevue/config';
import ToastService from 'primevue/toastservice';

import type { AxiosResponse } from 'axios';
import type { GeoJSON } from 'geojson';

type Props = {
  disabled?: boolean;
  geoJsonData?: GeoJSON;
  latitude?: number;
  longitude?: number;
  pinOrDraw?: boolean;
};

const disableInteractionMock = vi.fn();
const eachLayerMock = vi.fn();
const enableInteractionMock = vi.fn();
const invalidateSizeMock = vi.fn();
const onMock = vi.fn();
const setMaxBoundsMock = vi.fn();

vi.mock('leaflet', async (importOriginal) => {
  const mod = await importOriginal(); // type is inferred
  return {
    //@ts-ignore - insufficient type definitions
    ...mod,
    // replace some exports
    map: vi.fn().mockImplementation(() => ({
      addLayer: () => vi.fn(),
      eachLayer: () => eachLayerMock,
      invalidateSize: () => invalidateSizeMock,
      on: () => onMock,
      setMaxBounds: () => setMaxBoundsMock,
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
      tapHold: {
        enable: enableInteractionMock,
        disable: disableInteractionMock
      }
    }))
  };
});

vi.mock('@geoman-io/leaflet-geoman-free');

const getNearestOccupantSpy = vi.spyOn(externalApiService, 'getNearestOccupant');

const testGeoJson: GeoJSON = {
  type: 'Feature',
  properties: {},
  geometry: {
    type: 'Polygon',
    coordinates: [
      [
        [-123.370564, 48.428039],
        [-123.370564, 48.428565],
        [-123.369663, 48.428565],
        [-123.369663, 48.428039],
        [-123.370564, 48.428039]
      ]
    ]
  }
};
const defaultTestProps: Props = {
  disabled: false,
  geoJsonData: undefined,
  latitude: undefined,
  longitude: undefined,
  pinOrDraw: false
};
const wrapperSettings = (defaultProps: Props = defaultTestProps) => ({
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

    expect(enableInteractionMock).toHaveBeenCalledTimes(7);
  });

  it('does not call disableInteraction function when not disabled', async () => {
    const wrapper = mount(Map, wrapperSettings());
    await nextTick();

    wrapper.setProps({ disabled: true });
    await nextTick();

    expect(disableInteractionMock).toHaveBeenCalledTimes(7);
  });

  it('getNearestOccupant fcn calls externalApiService', async () => {
    const addressString = 'address string';

    getNearestOccupantSpy.mockResolvedValue({
      data: {
        properties: {
          occupantAliasAddress: addressString
        }
      }
    } as AxiosResponse);
    const newProps: Props = {
      ...defaultTestProps,
      latitude: 45,
      longitude: -130
    };
    const wrapper = mount(Map, wrapperSettings(newProps));
    await nextTick();

    //@ts-ignore - wrapper.vm functions not exposed for typing
    wrapper.vm.getNearestOccupant(newProps.longitude, newProps.latitude);
    await nextTick();

    expect(getNearestOccupantSpy).toHaveBeenCalledTimes(1);
    expect(getNearestOccupantSpy).toHaveBeenCalledWith(newProps.longitude, newProps.latitude);
  });

  it('getNearestOccupant fcn returns properly formatted data', async () => {
    const addressString = 'address string2';

    getNearestOccupantSpy.mockResolvedValue({
      data: {
        properties: {
          occupantAliasAddress: addressString
        }
      }
    } as AxiosResponse);
    const newProps: Props = {
      ...defaultTestProps,
      latitude: 45,
      geoJsonData: testGeoJson,
      longitude: -130
    };
    const wrapper = mount(Map, wrapperSettings(newProps));
    await nextTick();

    //@ts-ignore - wrapper.vm functions not exposed for typing
    wrapper.vm.getNearestOccupant(newProps.longitude, newProps.latitude);
    await nextTick();

    // Listen to emits
    const pinUpdatedEmit = wrapper.emitted('map:pinUpdated');

    // Emitted once
    expect(pinUpdatedEmit).toHaveLength(1);
    expect(pinUpdatedEmit?.[0]?.[0]).toMatchObject({
      latitude: newProps.latitude,
      longitude: newProps.longitude,
      address: addressString
    });
  });
});
