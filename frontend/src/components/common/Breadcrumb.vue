<script setup lang="ts">
import { Breadcrumb } from '@/lib/primevue';

import type { MenuItem } from 'primevue/menuitem';
import { ref, watch, type Ref } from 'vue';
import { useRoute, useRouter, type RouteLocationMatched, type RouteLocationNormalizedLoadedGeneric } from 'vue-router';

// Props
// const { home, model } = defineProps<{
//   home: MenuItem;
//   model: Array<MenuItem>;
// }>();

const route = useRoute();
const router = useRouter();

const routes: Ref<Array<RouteLocationNormalizedLoadedGeneric>> = ref([]);
const crumbs: Ref<Array<RouteLocationMatched>> = ref([]);

// Maps a param key to a callback function
// eslint-disable-next-line @typescript-eslint/no-explicit-any
// const paramMap = new Map<string, (id: string) => any>([
//   ['bc_submission', submissionStore.getSubmission],
//   ['bc_permit', submissionStore.getPermit]
// ]);

// function generateName(item: RouteLocationMatched) {
//   console.log(item.meta);
//   if (item?.meta?.breadcrumb_dynamic) {
//     console.log('dynamic');
//   } else {
//     return item.meta.breadcrumb;
//   }
// }

// watch( submissionStore.getSubmission, () => {

// });

// watch(route.matched, () => {
//   console.log('route.matched');
// });

watch(route, () => {
  console.log(router.currentRoute);
  console.log(router.getRoutes());
  console.log(route);

  routes.value.push({ ...route });
  let temp = route.matched;
  // compute bunch of shit
  // check each match if dynamic
  // if dynamic get info from some store and modify meta
  crumbs.value = temp;
});

// watch( submissionStore.getSubmission, () => {
// });

// watch( submissionStore.getPermit, () => {
// });
</script>

<template>
  <Breadcrumb :model="routes">
    <template #separator>/</template>
    <template #item="{ item }">
      <!-- TODO: Dont link last item, just plain text -->
      <router-link
        :to="{
          name: item.name,
          params: item.params,
          query: item.query,
          hash: item.hash
        }"
      >
        <span
          class="app-primary-color cursor-pointer hover-underline"
          :class="[item.class]"
        >
          {{ item?.meta?.breadcrumb }}
        </span>
      </router-link>
    </template>
  </Breadcrumb>
</template>

<style scoped lang="scss">
a {
  text-decoration: none;
}

.hover-underline:hover {
  text-decoration: underline;
}

.p-breadcrumb {
  border: none;
  padding: 0.125rem;
}
</style>
