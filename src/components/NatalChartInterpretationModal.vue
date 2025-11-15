<script setup>
import { watchEffect } from 'vue';
import { useModalStore } from '@/stores/modal.store';

const modalStore = useModalStore();

// Блокировка скролла body при открытии модалки
watchEffect(() => {
    if (modalStore.isNatalChartInterpretationModalOpen) {
        document.body.style.overflow = 'hidden';
    } else {
        document.body.style.overflow = '';
    }

    return () => {
        document.body.style.overflow = '';
    };
});

const closeModal = () => {
    modalStore.closeNatalChartInterpretationModal();
};
</script>

<template>
    <div v-if="modalStore.isNatalChartInterpretationModalOpen" class="modal modal--large modal--natal-chart-interpretation">
        <div class="modal__overlay"></div>
        <div class="modal__container">
            <div class="modal__content">
                <div class="natal-chart-interpretation">
                    <div class="natal-chart-interpretation__header">
                        <p class="natal-chart-interpretation__label">НАТАЛЬНАЯ КАРТА</p>
                        <h1 class="natal-chart-interpretation__title">Персональная интерпретация</h1>
                    </div>

                    <div class="natal-chart-interpretation__content">
                        <div class="natal-chart-interpretation__text" v-html="modalStore.natalChartInterpretationText"></div>
                    </div>

                    <button class="btn btn--primary" @click="closeModal">
                        Закрыть
                    </button>
                </div>
            </div>
        </div>
    </div>
</template>

<style scoped lang="scss">
@use "../assets/scss/vars.scss" as *;

.natal-chart-interpretation {
    padding: $spacing-large;
    display: flex;
    flex-direction: column;
    gap: $spacing-small;

    &__header {
        display: flex;
        flex-direction: column;
        align-items: flex-start;
        gap: $spacing-x-smal;
    }

    &__label {
        font-family: "Inter", Sans-serif;
        color: $color-pastel-gold;
        font-size: 14px;
        font-weight: 800;
        text-transform: uppercase;
        letter-spacing: 1px;
    }

    &__title {
        font-family: "Playfair Display", Sans-serif;
        font-size: 38px;
        font-weight: 600;
        line-height: 1.3em;
        color: $color-white;
        margin-bottom: $spacing-small;
    }

    &__content {
        flex: 1;
        margin-bottom: $spacing-middle;
    }

    &__text {
        font-family: "Inter", Sans-serif;
        font-size: 16px;
        line-height: 1.8;
        color: $color-white;

        // Стили для HTML элементов (deep для v-html контента)
        :deep(h1), :deep(h2), :deep(h3), :deep(h4), :deep(h5), :deep(h6) {
            font-family: "Playfair Display", Sans-serif;
            text-transform: uppercase;
        }

        :deep(h1) {
            font-size: 28px;
            font-weight: 600;
            border-bottom: 2px solid $color-pastel-gold;
            padding-bottom: $spacing-small;
        }

        :deep(h2) {
            margin-bottom: $spacing-small;
            font-size: 22px;
            font-weight: 600;
            color: $color-pastel-gold;
        }

        :deep(h3) {
            font-size: 20px;
            font-weight: 500;
            color: $color-pastel-gold;
        }

        :deep(p) {
            margin-bottom: $spacing-middle;
            text-align: justify;
            line-height: 1.6;
        }

        :deep(ul), :deep(ol) {
            margin-bottom: $spacing-middle;
            padding-left: $spacing-large;
        }

        :deep(li) {
            margin-bottom: $spacing-x-smal;
            line-height: 1.5;
        }

        :deep(strong), :deep(b) {
            font-weight: 600;
            color: $color-pastel-gold;
        }

        :deep(em), :deep(i) {
            font-style: italic;
            color: rgba($color-white, 0.8);
        }

        :deep(blockquote) {
            border-left: 4px solid $color-pastel-gold;
            padding-left: $spacing-middle;
            margin: $spacing-middle 0;
            font-style: italic;
            color: rgba($color-white, 0.9);
        }

        :deep(hr) {
            border: none;
            border-top: 1px solid rgba($color-grey, 0.3);
            margin: $spacing-large 0;
        }
    }

    // Адаптив для мобильных устройств
    @media (max-width: 768px) {
        &__title {
            font-size: 28px;
        }

        &__text {
            font-size: 15px;

            :deep(h1) {
                font-size: 24px;
            }

            :deep(h2) {
                font-size: 20px;
            }

            :deep(h3) {
                font-size: 18px;
            }

            :deep(p) {
                font-size: 15px;
            }
        }
    }

    @media (max-width: 480px) {
        &__title {
            font-size: 24px;
        }

        &__text {
            font-size: 14px;

            :deep(h1) {
                font-size: 20px;
            }

            :deep(h2) {
                font-size: 18px;
            }

            :deep(h3) {
                font-size: 16px;
            }

            :deep(p) {
                font-size: 14px;
            }
        }
    }
}
</style>
