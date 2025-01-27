<script setup lang="ts">
import { useRouter } from 'vue-router';
import { Button } from '@/lib/primevue';
import { RouteName } from '@/utils/enums/application';
import { useAuthZStore } from '@/store';
import { NavigationPermission } from '@/store/authzStore';

// Store
const router = useRouter();
const toHousing = (): void => {
  if (useAuthZStore().canNavigate(NavigationPermission.HOUSING_SUBMISSIONS))
    router.push({ name: RouteName.HOUSING_SUBMISSIONS });
  else router.push({ name: RouteName.HOUSING });
};
</script>

<template>
  <div class="h-screen">
    <div class="bg" />
    <div class="poly" />
    <div class="flex items-center justify-start h-full">
      <div class="text-left text-white/90">
        <h1 class="mb-0">
          Welcome to the
          <br />
          Permit Connect Services
        </h1>
        <h2>Choose your project type</h2>
        <Button @click="toHousing">
          <font-awesome-icon
            icon="fa-solid fa-house"
            class="mr-1"
          />
          Housing
        </Button>
      </div>
    </div>
  </div>
</template>

<style scoped lang="scss">
h1,
h2 {
  color: rgba(255, 255, 255, 0.9) !important;
}

.bg {
  position: fixed;
  top: 0;
  left: 0;
  z-index: -1000;
  background: url('../assets/images/home-bg.avif') no-repeat;
  background-size: cover;
  width: 100%;
  height: 100%;
}

.poly {
  clip-path: polygon(0% 0%, 55% 0%, 45% 100%, 0% 100%);
  z-index: -500;
  position: fixed;
  top: 0;
  left: 0;
  width: 100%;
  height: 100%;
  background-color: var(--p-primary-color);
  opacity: 0.9;
}

.p-button {
  border-width: 2px;
  &:not(.p-button-secondary, .p-button-success, .p-button-info, .p-button-warning, .p-button-help, .p-button-danger) {
    color: var(--p-primary-color);
    &:not(.p-button-outlined, .p-button-text) {
      background-color: white;
      border-color: white;
      color: var(--p-primary-color);
    }
  }
}
</style>
