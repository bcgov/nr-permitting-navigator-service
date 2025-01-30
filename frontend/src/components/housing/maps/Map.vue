<script setup lang="ts">
import * as L from 'leaflet';
import 'leaflet/dist/leaflet.css';
import '@geoman-io/leaflet-geoman-free';
import '@geoman-io/leaflet-geoman-free/dist/leaflet-geoman.css';
import { onMounted, onUpdated, ref, watch } from 'vue';

import { useToast } from '@/lib/primevue';
import { externalApiService } from '@/services';
import {
  BC_BOUNDARIES_LOWER,
  BC_BOUNDARIES_UPPER,
  MAP_ICON_OPTIONS_RED,
  MAP_INITIAL_START_POINT,
  OSM_TILE_LAYER_OPTIONS,
  OSM_URL_TEMPLATE
} from '@/utils/constants/mapping';

import type { GeoJSON } from 'geojson';
import type { Ref } from 'vue';

// Props
const {
  disabled = false,
  latitude = undefined,
  longitude = undefined,
  pinOrDraw = false
} = defineProps<{
  disabled?: boolean;
  latitude?: number;
  longitude?: number;
  pinOrDraw?: boolean;
}>();

// Constants
const POINT = 'Point';

// Actions
let marker: L.Marker;
let map: L.Map;
const geoJSON: Ref<GeoJSON | undefined> = ref(undefined);
const toast = useToast();
const oldLayer = ref<L.Layer | undefined>(undefined);

// Emits
const emit = defineEmits(['map:polygonUpdated', 'map:pinUpdated', 'map:erased']);

async function initMap() {
  L.Icon.Default.prototype = new L.Icon(MAP_ICON_OPTIONS_RED);
  const osm = L.tileLayer(OSM_URL_TEMPLATE, OSM_TILE_LAYER_OPTIONS);

  map = L.map('map', {
    ...MAP_INITIAL_START_POINT,
    layers: [osm]
  });

  // Don't allow dragging outside BC
  const bcBounds = new L.LatLngBounds(BC_BOUNDARIES_LOWER, BC_BOUNDARIES_UPPER);
  map.setMaxBounds(bcBounds);
  map.on('drag', function () {
    map.panInsideBounds(bcBounds, { animate: false });
  });

  if (pinOrDraw) {
    map.on('pm:create', async (e) => {
      try {
        const geo = e.layer as L.GeoJSON;

        if (oldLayer.value) {
          //@ts-ignore - insufficient type definitions
          map.removeLayer(oldLayer.value);
          oldLayer.value = undefined;
        }
        oldLayer.value = e.layer;

        //@ts-ignore - insufficient type definitions
        if (geo.toGeoJSON().geometry.type === POINT) {
          //@ts-ignore - insufficient type definitions
          let latitude = geo.toGeoJSON().geometry.coordinates[1];
          //@ts-ignore - insufficient type definitions
          let longitude = geo.toGeoJSON().geometry.coordinates[0];

          getNearestOccupant(longitude, latitude);
        } else {
          geoJSON.value = geo.toGeoJSON();

          emit('map:polygonUpdated', { geoJSON: geoJSON.value });
        }
        // Zoom in
        if (geo.getBounds) map.fitBounds(geo.getBounds());
        //@ts-ignore - insufficient type definitions
        else map.flyTo(geo.getLatLng(), 17);
      } catch (e: any) {
        toast.error('Error', e.message);
      }
    });
    // On erase
    map.on('pm:remove', () => {
      emit('map:erased');
    });
    initControls();
  }
}

// Function to remove all markers from the map
function removeAllMarkers() {
  map.eachLayer((layer) => {
    if (layer instanceof L.Marker) {
      map.removeLayer(layer);
    }
  });
}

// show parcel data from Geocoder
async function getNearestOccupant(longitude: string, latitude: string) {
  const result = await externalApiService.getNearestOccupant(longitude, latitude);
  const address = result.data.properties.occupantAliasAddress;
  if (!address || address.length == 0) {
    toast.warn('No address found');
  }
  emit('map:pinUpdated', {
    longitude: longitude,
    latitude: latitude,
    address: address
  });
}

function initControls() {
  map.pm.addControls({
    position: 'topleft',

    // Create
    drawCircleMarker: false,
    drawCircle: false,
    drawText: false,
    drawPolyline: false,

    // Edit
    cutPolygon: false,
    dragMode: false,
    editMode: false,
    rotateMode: false
  });
}

function disableInteraction() {
  map.dragging.disable();
  map.touchZoom.disable();
  map.doubleClickZoom.disable();
  map.scrollWheelZoom.disable();
  map.boxZoom.disable();
  map.keyboard.disable();
  if (map.tapHold) map.tapHold.disable();
}

function enableInteraction() {
  map.dragging.enable();
  map.touchZoom.enable();
  map.doubleClickZoom.enable();
  map.scrollWheelZoom.enable();
  map.boxZoom.enable();
  map.keyboard.enable();
  if (map.tapHold) map.tapHold.enable();
}

// Map component will be misaligned if mounted while not visible. Trigger resize to fix on show
// Parent component needs to trigger nextTick().then(() => mapRef?.value?.resizeMap()
function resizeMap() {
  if (map) map.invalidateSize();
}

function setAddressMarker(coords: any) {
  if (marker) map.removeLayer(marker);
  // Custom(-ish) markers courtesy of https://github.com/pointhi/leaflet-color-markers
  const redIcon = new L.Icon(MAP_ICON_OPTIONS_RED);
  marker = L.marker(coords, { icon: redIcon });
  map.addLayer(marker);
}

defineExpose({ resizeMap });

onMounted(async () => {
  await initMap();
  // Clear all markers on mount
  removeAllMarkers();
});

onUpdated(async () => {
  if (latitude && longitude) {
    const addressLocation = { lat: latitude, lng: longitude };
    map.flyTo(addressLocation, 17);
    setAddressMarker(addressLocation);
  }
});

watch(
  () => disabled,
  (val) => {
    if (val) disableInteraction();
    else enableInteraction();
  }
);
</script>

<template>
  <div class="grid grid-cols-12 gap-4 nested-grid">
    <div class="col-span-12">
      <!-- map -->
      <div id="map" />
    </div>
  </div>
</template>

<style scoped lang="scss">
#map {
  height: 400px;
  width: 100%;
}
</style>
