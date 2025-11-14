<script setup>
import { watch } from 'vue';
import { useRoute } from 'vue-router';
import { useUserStore } from '@/stores/user.store';
import AppHeader from '@/components/AppHeader.vue';
import AppFooter from '@/components/AppFooter.vue';
import ProfileSetupModal from '@/components/ProfileSetupModal.vue';
import ButtonSpinner from '@/components/ButtonSpinner.vue';
import { useProfileSetup } from '@/composables/useProfileSetup';

const route = useRoute();
const userStore = useUserStore();
const { showProfileSetup, checkProfileSetup, handleProfileSetupComplete } = useProfileSetup();

// Проверяем профиль при первой загрузке и при каждой смене роута
watch(() => route.path, () => {
  // Не проверяем на страницах auth и callback
  if (!route.path.startsWith('/auth') && userStore.isAuthenticated) {
    checkProfileSetup();
  }
}, { immediate: true }); // Добавляем immediate: true для проверки при первой загрузке

// Также проверяем профиль при завершении проверки авторизации
watch(() => userStore.isAuthChecking, (newValue) => {
  if (!newValue && userStore.isAuthenticated && !route.path.startsWith('/auth')) {
    checkProfileSetup();
  }
});
</script>

<template>
  <!-- Глобальный индикатор загрузки авторизации -->
  <div v-if="userStore.isAuthChecking" class="auth-loading">
    <div class="auth-loading__content">
      <ButtonSpinner />
      <p>Загрузка...</p>
    </div>
  </div>

  <template v-else>
    <div class="app-layout">
      <!-- Header показывается только не на страницах авторизации -->
      <AppHeader v-if="!route.path.startsWith('/auth')" />
      <main class="app-main">
        <RouterView />
      </main>
      <!-- Футер показывается только не на страницах авторизации -->
      <AppFooter v-if="!route.path.startsWith('/auth')" />
    </div>

    <!-- Глобальная модалка настройки профиля -->
    <ProfileSetupModal
      :show="showProfileSetup"
      @complete="handleProfileSetupComplete"
    />
  </template>
</template>

<style scoped>
.app-layout {
  min-height: 100vh;
  display: flex;
  flex-direction: column;
}

.app-main {
  flex: 1;
  display: flex;
  flex-direction: column;
  justify-content: center;

  background-image: url('/images/bg-1.png');
    background-size: contain;
    background-position: top center;
    background-attachment: fixed;
}

.auth-loading {
  position: fixed;
  top: 0;
  left: 0;
  width: 100%;
  height: calc(100vh - 70px);
  background-color: #21212c;
  display: flex;
  align-items: center;
  justify-content: center;
  z-index: 9999;
}

.auth-loading__content {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 24px;
}

.auth-loading__content p {
  font-family: "Inter", sans-serif;
  font-size: 16px;
  color: #b2abb5;
}
</style>