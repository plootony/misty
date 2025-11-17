<script setup>
import { useUserStore } from '@/stores/user.store';

const userStore = useUserStore();
</script>

<template>
    <header class="header">
        <div class="header__container">
            <RouterLink to="/" class="header__logo">
                <img src="@/assets/images/stars-icon.png" alt="Misty" class="header__logo-icon">
                <span class="header__logo-text">MISTY</span>
            </RouterLink>

            <nav class="header__nav">
                <RouterLink
                    to="/"
                    class="header__link"
                >
                    Таролог
                </RouterLink>
                <RouterLink
                    v-if="userStore.isAuthenticated"
                    to="/natal-chart"
                    class="header__link"
                >
                    Натальная карта
                </RouterLink>
               
                <RouterLink
                    v-if="userStore.isAuthenticated"
                    to="/profile"
                    class="header__link header__link--profile"
                >
                    <div class="header__user-info">
                        <span class="header__user-name">{{ userStore.userData?.name || 'Пользователь' }}</span>
                        <span class="header__tariff">{{ userStore.currentTariff.name }}</span>
                    </div>
                </RouterLink>
                <RouterLink
                    v-else
                    to="/auth"
                    class="header__link"
                >
                    Войти
                </RouterLink>
            </nav>
        </div>
    </header>
</template>

<style scoped lang="scss">
@use "../assets/scss/vars.scss" as *;

.header {
    background-color: $color-bg-light;
    box-shadow: 0px 4px 12px 0px rgba(10, 10, 12, 0.3);
    position: sticky;
    top: 0;
    z-index: 100;

    &__container {
        max-width: 1200px;
        margin: 0 auto;
        padding: $spacing-small;
        display: flex;
        justify-content: space-between;
        align-items: center;
    }

    &__logo {
        display: flex;
        align-items: center;
        gap: $spacing-small;
        text-decoration: none;
        transition: opacity 0.3s;

        &:hover {
            opacity: 0.8;
        }
    }

    &__logo-icon {
        width: 32px;
        height: auto;
    }

    &__logo-text {
        font-family: "Playfair Display", Sans-serif;
        font-size: 24px;
        font-weight: 600;
        color: $color-white;
    }

    &__nav {
        display: flex;
        align-items: center;
        gap: $spacing-large;
    }

    &__link {
        font-family: "Inter", Sans-serif;
        font-size: 15px;
        font-weight: 500;
        color: $color-grey;
        text-decoration: none;
        transition: color 0.3s;

        &:hover {
            color: $color-white;
        }

        &.router-link-active {
            color: $color-pastel-gold;
        }

        &--profile {
            display: flex;
            align-items: center;
            gap: $spacing-small;
            padding: $spacing-x-smal $spacing-middle;
            background-color: $color-bg-dark;
            border: 2px solid transparent;
            transition: border-color 0.3s;

            &:hover {
                border-color: $color-pastel-gold;
            }

            &.router-link-active {
                border-color: $color-gold;
            }
        }
    }

    &__user-info {
        display: flex;
        flex-direction: column;
        gap: 2px;
        align-items: flex-start;
    }

    &__user-name {
        color: $color-white;
        font-size: 15px;
    }

    &__tariff {
        font-size: 10px;
        font-weight: 700;
        text-transform: uppercase;
        color: $color-pastel-gold;
        letter-spacing: 0.5px;
    }
}
</style>

