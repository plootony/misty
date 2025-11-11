<script setup>
import { ref, onMounted } from 'vue';
import { useRouter } from 'vue-router';
import { useSpreadSelector } from '@/stores/spreadSelector.store';
import { useUserStore } from '@/stores/user.store';
import { useModalStore } from '@/stores/modal.store';
import SpreadPreview from '@/components/SpreadPreview.vue';

const router = useRouter();
const spreadStore = useSpreadSelector();
const userStore = useUserStore();
const modalStore = useModalStore();

// Очищаем состояние расклада при заходе на главную страницу
onMounted(() => {
    modalStore.resetSelection();
});

const hoveredSpreadId = ref(null);

const selectSpread = (spread) => {
    if (!userStore.canAccessSpread(spread.id)) {
        return;
    }
    modalStore.selectedSpread = spread;
    router.push('/question');
};

const onMouseEnter = (spreadId) => {
    hoveredSpreadId.value = spreadId;
};

const onMouseLeave = () => {
    hoveredSpreadId.value = null;
};
</script>

<template>
    <div class="spread-selector">
        <div class="spread-selector__header">
            <img src="@/assets/images/stars-icon.png" alt="star icon" class="spread-selector__icon">
            <p class="spread-selector__greeting">ПРИВЕТСТВУЮ ТЕБЯ, {{ userStore.userData?.name?.toUpperCase() || 'ГОСТЬ' }}</p>
            <h1 class="spread-selector__title">Сделай свой выбор</h1>
        </div>

        <div class="spread-selector__grid">
            <div 
                v-for="spread in spreadStore.spreads" 
                :key="spread.id" 
                class="spread-selector__card"
                :class="{ 'spread-selector__card--disabled': !userStore.canAccessSpread(spread.id) }"
                @click="selectSpread(spread)"
                @mouseenter="onMouseEnter(spread.id)"
                @mouseleave="onMouseLeave"
            >
                <div class="spread-selector__card-preview">
                    <SpreadPreview 
                        :spread-id="spread.id" 
                        :cards-count="spread.cardsCount"
                        :animated="hoveredSpreadId === spread.id && userStore.canAccessSpread(spread.id)"
                    />
                    
                    <!-- Overlay для заблокированных раскладов -->
                    <div v-if="!userStore.canAccessSpread(spread.id)" class="spread-selector__card-overlay">
                        <div class="spread-selector__card-lock">
                            <span class="spread-selector__card-lock-icon">🔒</span>
                            <span class="spread-selector__card-lock-text">
                                Доступно на уровне<br>"{{ userStore.getRequiredTariffForSpread(spread.id)?.name }}"
                            </span>
                        </div>
                    </div>
                </div>
                
                <div class="spread-selector__card-body">
                    <strong class="spread-selector__card-title">{{ spread.name }}</strong>
                    <p class="spread-selector__card-subtitle">{{ spread.description }}</p>
                </div>
            </div>
        </div>
    </div>
</template>

<style scoped lang="scss">
@use "../assets/scss/vars.scss" as *;

.spread-selector {
    min-height: calc(100vh - 70px);
    padding: $spacing-middle;
    display: flex;
    flex-direction: column;
    align-items: center;
    gap: $spacing-middle;

    &__header {
        display: flex;
        flex-direction: column;
        align-items: center;
        text-align: center;
        gap: $spacing-small;
    }

    &__icon {
        width: 42px;
        height: auto;
    }

    &__greeting {
        font-family: "Inter", Sans-serif;
        color: $color-pastel-orange;
        font-size: 14px;
        font-weight: 800;
        text-transform: uppercase;
        letter-spacing: 1px;
    }

    &__title {
        font-family: "Playfair Display", Sans-serif;
        font-size: 46px;
        font-weight: 600;
        line-height: 1.3em;
        color: $color-white;
    }

    &__grid {
        display: flex;
        flex-wrap: wrap;
        gap: $spacing-middle;
        max-width: 1200px;
        width: 100%;
    }

    &__card {
        padding: $spacing-middle;
        display: flex;
        flex-direction: column;
        align-items: center;
        gap: $spacing-middle;
        font-family: "Playfair Display", Sans-serif;
        background-color: $color-bg-light;
        box-shadow: 0px 15px 35px 0px rgba(10, 10, 12, 0.3215686274509804);
        cursor: pointer;
        flex: 1 1 calc(33.333% - $spacing-middle);
        min-width: 320px;
        outline: 2px solid transparent;
        transition: outline 0.3s, opacity 0.3s;
        position: relative;

        &:hover:not(&--disabled) {
            outline-color: $color-orange;
        }

        &--disabled {
            opacity: 0.5;
            cursor: not-allowed;

            .spread-selector__card-preview {
                filter: grayscale(50%);
            }
        }
    }

    &__card-preview {
        width: 100%;
        min-height: 140px;
        flex-shrink: 0;
        display: flex;
        align-items: center;
        justify-content: center;
        background-color: $color-bg-dark;
        border-radius: 4px;
        padding: $spacing-middle;
        position: relative;
    }

    &__card-overlay {
        position: absolute;
        top: 0;
        left: 0;
        right: 0;
        bottom: 0;
        background-color: rgba($color-bg-dark, 0.85);
        backdrop-filter: blur(3px);
        display: flex;
        align-items: center;
        justify-content: center;
        border-radius: 4px;
        z-index: 10;
    }

    &__card-body {
        display: flex;
        flex-direction: column;
        gap: $spacing-x-smal;
        flex: 1;
    }

    &__card-title {
        font-size: 20px;
        color: $color-white;
        font-weight: 600;
    }

    &__card-subtitle {
        font-size: 14px;
        color: $color-grey;
        line-height: 1.4;
    }

    &__card-link {
        font-weight: bold;
        font-size: 14px;
        text-transform: uppercase;
        color: $color-pastel-orange;
    }

    &__card-lock {
        display: flex;
        flex-direction: column;
        align-items: center;
        gap: $spacing-small;
        padding: $spacing-middle;
    }

    &__card-lock-icon {
        font-size: 32px;
        filter: drop-shadow(0 2px 4px rgba(0, 0, 0, 0.5));
    }

    &__card-lock-text {
        font-family: "Inter", Sans-serif;
        font-size: 13px;
        font-weight: 700;
        text-transform: uppercase;
        color: $color-white;
        text-align: center;
        letter-spacing: 0.5px;
        line-height: 1.4;
        text-shadow: 0 2px 4px rgba(0, 0, 0, 0.5);
    }
}
</style>

