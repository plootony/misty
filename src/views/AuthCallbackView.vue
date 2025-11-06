<script setup>
import { onMounted, ref } from 'vue';
import { useRouter } from 'vue-router';
import { getSession } from '@/services/supabase.service';
import { useUserStore } from '@/stores/user.store';
import ButtonSpinner from '@/components/ButtonSpinner.vue';

const router = useRouter();
const userStore = useUserStore();
const error = ref('');

onMounted(async () => {
    try {
        // Получаем сессию после редиректа от Google
        const session = await getSession();

        if (session && session.user) {
            // Загружаем данные пользователя в store
            await userStore.loadUserFromSupabase(session.user);

            // Всегда перенаправляем на главную страницу
            // Глобальная модалка в App.vue сама проверит и покажет форму настройки профиля
            router.push('/');
        } else {
            error.value = 'Не удалось получить данные пользователя';
            setTimeout(() => {
                router.push('/auth');
            }, 2000);
        }
    } catch (err) {
        console.error('Ошибка обработки callback:', err);
        error.value = 'Произошла ошибка при входе';
        setTimeout(() => {
            router.push('/auth');
        }, 2000);
    }
});
</script>

<template>
    <div class="auth-callback">
        <div class="auth-callback__container">
            <img src="@/assets/images/stars-icon.png" alt="star icon" class="auth-callback__icon">

            <div v-if="error" class="auth-callback__error">
                <p>{{ error }}</p>
                <p class="auth-callback__redirect">Перенаправление на страницу входа...</p>
            </div>

            <div v-else class="auth-callback__loading">
                <ButtonSpinner />
                <p>Завершаем вход...</p>
            </div>
        </div>
    </div>
</template>

<style scoped lang="scss">
@use "../assets/scss/vars.scss" as *;

.auth-callback {
    min-height: 100vh;
    display: flex;
    align-items: center;
    justify-content: center;
    padding: $spacing-large $spacing-middle;

    &__container {
        max-width: 480px;
        width: 100%;
        background-color: $color-bg-light;
        padding: $spacing-large;
        box-shadow: 0px 15px 35px 0px rgba(10, 10, 12, 0.3215686274509804);
        display: flex;
        flex-direction: column;
        align-items: center;
        text-align: center;
        gap: $spacing-large;
    }

    &__icon {
        width: 42px;
        height: auto;
    }

    &__loading {
        display: flex;
        flex-direction: column;
        align-items: center;
        gap: $spacing-middle;
        
        p {
            font-family: "Inter", Sans-serif;
            font-size: 16px;
            color: $color-white;
        }
    }

    &__error {
        display: flex;
        flex-direction: column;
        gap: $spacing-small;
        
        p {
            font-family: "Inter", Sans-serif;
            font-size: 16px;
            color: $color-orange;
        }
    }

    &__redirect {
        font-size: 14px !important;
        color: $color-grey !important;
    }
}
</style>

