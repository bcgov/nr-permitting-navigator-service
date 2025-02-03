<script setup lang="ts">
import { storeToRefs } from 'pinia';
import { onMounted, ref } from 'vue';
import { useI18n } from 'vue-i18n';

import { CopyToClipboard } from '@/components/form';
import { Column, DataTable, Select } from '@/lib/primevue';
import { yarsService } from '@/services';
import { useAuthNStore, useAuthZStore, useConfigStore } from '@/store';
import { ButtonMode } from '@/utils/enums/application';
import { GROUP_NAME_LIST } from '@/utils/constants/application';

import type { Ref } from 'vue';

// Types
type GroupList = { id: string; text: string };

// Store
const authnStore = useAuthNStore();
const { getAccessToken, getProfile } = storeToRefs(authnStore);
const { getConfig } = storeToRefs(useConfigStore());
const authzStore = useAuthZStore();

// State
const groupNames: Ref<Array<string>> = ref([]);
const resourceNames: Ref<Array<string>> = ref([]);
const actionNames: Ref<Array<string>> = ref([]);
const attributeNames: Ref<Array<string>> = ref([]);

const groupFilter: Ref<string | undefined> = ref(undefined);
const resourceFilter: Ref<string | undefined> = ref(undefined);
const actionFilter: Ref<string | undefined> = ref(undefined);
const attributeFilter: Ref<string | undefined> = ref(undefined);
const yarsData: Ref<Array<any>> = ref([]);
const yarsDataFiltered: Ref<Array<any>> = ref([]);

// Actions
const { t } = useI18n();

function filterYarsData() {
  yarsDataFiltered.value = yarsData.value.filter(
    (x) =>
      (!groupFilter.value || x.group_name === groupFilter.value) &&
      (!resourceFilter.value || x.resource_name === resourceFilter.value) &&
      (!actionFilter.value || x.action_name === actionFilter.value) &&
      (!attributeFilter.value || x.attribute_name === attributeFilter.value)
  );
}

onMounted(async () => {
  yarsData.value = (await yarsService.getGroupRolePolicyVw()).data;
  groupNames.value = Array.from(new Set(yarsData.value.map((item: any) => item.group_name)));
  groupNames.value.unshift('');
  resourceNames.value = Array.from(new Set(yarsData.value.map((item: any) => item.resource_name)));
  resourceNames.value.unshift('');
  actionNames.value = Array.from(new Set(yarsData.value.map((item: any) => item.action_name)));
  actionNames.value.unshift('');
  attributeNames.value = Array.from(new Set(yarsData.value.map((item: any) => item.attribute_name)));

  filterYarsData();
});
</script>

<template>
  <h2>Developer</h2>
  <div class="flex">
    <div>Application version:</div>
    <div
      v-if="getConfig"
      class="version pl-2"
    >
      v{{ getConfig.version }}{{ getConfig.gitRev ? '-' + getConfig.gitRev.substring(0, 8) : '' }}
    </div>
  </div>
  <div>
    <div class="flex items-center">
      <p class="m-0 mr-2">Begin viewing site as:</p>
      <div class="w-2/12 mr-2">
        <Select
          class="w-full"
          :options="groupNames"
          :option-label="(e: GroupList) => t(`${e.text}`)"
          :option-value="(e: GroupList) => e.id"
          @change="
            (e) => {
              authzStore.setGroupOverride(e.value);
            }
          "
        />
      </div>
    </div>

    <div class="flex items-center mt-4">
      <h3 class="mr-2">Config</h3>
      <div>
        <CopyToClipboard
          :mode="ButtonMode.ICON"
          :to-copy="JSON.stringify(getConfig)"
        />
      </div>
    </div>
    {{ getConfig }}

    <div class="flex items-center mt-4">
      <h3 class="mr-2">Token</h3>
      <div>
        <CopyToClipboard
          :mode="ButtonMode.ICON"
          :to-copy="getAccessToken"
        />
      </div>
    </div>
    <div class="wrap-block">
      {{ getAccessToken }}
    </div>

    <div class="flex items-center mt-4">
      <h3 class="mr-2">Profile</h3>
      <div>
        <CopyToClipboard
          :mode="ButtonMode.ICON"
          :to-copy="JSON.stringify(getProfile)"
        />
      </div>
    </div>
    {{ getProfile }}

    <div class="flex flex-col mt-4">
      <h3 class="mr-2">YARS</h3>
      <div class="grid grid-cols-4 gap-4">
        <Select
          v-model="groupFilter"
          :options="groupNames"
          @change="filterYarsData"
        />
        <Select
          v-model="resourceFilter"
          :options="resourceNames"
          @change="filterYarsData"
        />
        <Select
          v-model="actionFilter"
          :options="actionNames"
          @change="filterYarsData"
        />
        <Select
          v-model="attributeFilter"
          :options="attributeNames"
          @change="filterYarsData"
        />
      </div>
      <DataTable
        :value="yarsDataFiltered"
        data-key="row_number"
        scrollable
        responsive-layout="scroll"
        :paginator="true"
        :rows="100"
        sort-field="row_number"
        :sort-order="1"
        paginator-template="RowsPerPageDropdown CurrentPageReport PrevPageLink NextPageLink "
        current-page-report-template="{first}-{last} of {totalRecords}"
        :rows-per-page-options="[100, 200, 500]"
        selection-mode="single"
      >
        <Column
          field="initiative_code"
          header="initiative_code"
          :sortable="true"
        />
        <Column
          field="group_name"
          header="group_name"
          :sortable="true"
        />
        <Column
          field="role_name"
          header="role_name"
          :sortable="true"
        />
        <Column
          field="resource_name"
          header="resource_name"
          :sortable="true"
        />
        <Column
          field="action_name"
          header="action_name"
          :sortable="true"
        />
        <Column
          field="attribute_name"
          header="attribute_name"
          :sortable="true"
        />
      </DataTable>
    </div>
  </div>
</template>

<style lang="scss" scoped>
h3 {
  margin-top: 1em;
}
</style>
