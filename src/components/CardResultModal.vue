<script setup>
import { computed, ref, onMounted } from 'vue';
import { useModalStore } from '@/stores/modal.store';

const modalStore = useModalStore();

const emit = defineEmits(['loadFullReading']);

const currentCard = computed(() => {
    const cards = modalStore.selectedCards;
    return cards.length > 0 ? cards[cards.length - 1] : null;
});

const cardPosition = computed(() => {
    return currentCard.value?.isReversed ? 'Перевёрнутое положение' : 'Прямое положение';
});

// Проверяем, является ли текущая карта последней в раскладе
const isLastCard = computed(() => {
    const maxCards = modalStore.selectedSpread?.cardsCount || 3;
    return modalStore.selectedCards.length === maxCards;
});

// Таймер 5 секунд
const countdown = ref(5);
const isButtonDisabled = ref(true);

onMounted(() => {
    const timer = setInterval(() => {
        countdown.value--;
        if (countdown.value <= 0) {
            isButtonDisabled.value = false;
            clearInterval(timer);
        }
    }, 1000);
});

const goToNext = () => {
    if (isButtonDisabled.value) return;

    modalStore.closeCardResultModal();

    const maxCards = modalStore.selectedSpread?.cardsCount || 3;
    const isAllCardsSelected = modalStore.selectedCards.length === maxCards;

    if (isAllCardsSelected) {
        emit('loadFullReading');
    }
};

const closeModal = () => {
    modalStore.closeCardResultModal();
};
</script>

<template>
    <div class="modal">
        <div class="modal__overlay"></div>
        <div class="modal__container">
            <div class="modal__content modal__content--card-result">
                <div class="card-result">
                    <div class="card-result__card">
                        <img :src="currentCard?.image" alt="Карта Таро" class="card-result__card-image" :class="{ 'card-result__card-image--reversed': currentCard?.isReversed }" v-if="currentCard">
                        <img src="@/assets/images/card.png" alt="Карта Таро" class="card-result__card-image" v-else>
                    </div>

                    <div class="card-result__content" v-if="currentCard">
                        <div class="card-result__header">
                            <p class="card-result__label">{{ currentCard.arcana?.toUpperCase() }}</p>
                            <h1 class="card-result__title">{{ currentCard.name?.toUpperCase() }}</h1>
                            <p class="card-result__position">{{ cardPosition }}</p>
                            <p class="card-result__position-name">{{ currentCard.positionInfo?.name }}</p>
                        </div>

                        <div class="card-result__description">
                            <p class="card-result__text">
                                {{ currentCard.interpretation || 'Загрузка толкования...' }}
                            </p>
                        </div>

                        <button
                            class="btn btn--primary"
                            @click="goToNext"
                            :disabled="isButtonDisabled"
                        >
                            <span v-if="isButtonDisabled">{{ isLastCard ? 'Получить предсказание' : 'Следующая карта' }} ({{ countdown }}с)</span>
                            <span v-else>{{ isLastCard ? 'Получить предсказание' : 'Следующая карта' }}</span>
                        </button>
                    </div>
                </div>
            </div>
        </div>
    </div>
</template>

<style scoped lang="scss">
@use "../assets/scss/vars.scss" as *;

.modal__content {
    max-width: 1000px;
}

.card-result {
    display: flex;
    gap: $spacing-large;
    align-items: center;
    padding: $spacing-large;

    &__card {
        flex-shrink: 0;
    }

    &__card-image {
        max-width: 350px;
        width: 100%;
        height: auto;
        border-radius: 12px;
        transition: transform 0.3s ease;

        &--reversed {
            transform: rotate(180deg);
        }
    }

    &__content {
        flex: 1;
        display: flex;
        flex-direction: column;
        gap: $spacing-small;
    }

    &__header {
        display: flex;
        flex-direction: column;
        gap: $spacing-x-smal;
    }

    &__icon {
        width: 42px;
        height: auto;
        margin-bottom: $spacing-x-smal;
    }

    &__label {
        font-family: "Inter", Sans-serif;
        color: $color-pastel-orange;
        font-size: 14px;
        font-weight: 800;
        text-transform: uppercase;
        letter-spacing: 1px;
    }

    &__title {
        font-family: "Playfair Display", Sans-serif;
        font-size: 42px;
        font-weight: 600;
        line-height: 1.3em;
        color: $color-white;
    }

    &__position {
        font-family: "Inter", Sans-serif;
        font-size: 16px;
        color: $color-grey;
    }

    &__position-name {
        font-family: "Inter", Sans-serif;
        font-size: 14px;
        font-weight: 600;
        color: $color-pastel-orange;
        text-transform: uppercase;
        letter-spacing: 0.5px;
        margin-top: $spacing-x-smal;
    }

    &__description {
        flex: 1;
        margin-bottom: $spacing-middle;
    }

    &__text {
        font-family: "Inter", Sans-serif;
        font-size: 16px;
        line-height: 1.6;
        color: $color-white;
    }

    .btn {
        &--primary {
            &:disabled {
                background-color: $color-bg-dark;
                color: $color-grey;
                cursor: not-allowed;
                opacity: 0.6;

                &:hover {
                    background-color: $color-bg-dark;
                    transform: none;
                }
            }
        }
    }

    // Адаптив для мобильных устройств
    @media (max-width: 768px) {
        flex-direction: column;
        text-align: center;
        gap: $spacing-middle;
        padding: $spacing-middle;

        &__card {
            order: -1; // Карта сверху
        }

        &__card-image {
            max-width: 250px;
            margin: 0 auto;
        }

        &__content {
            gap: $spacing-small;
        }

        &__title {
            font-size: 36px;
        }

        &__text {
            font-size: 15px;
            line-height: 1.5;
        }
    }

    @media (max-width: 480px) {
        padding: $spacing-small;
        gap: $spacing-small;

        &__card-image {
            max-width: 200px;
        }

        &__title {
            font-size: 32px;
        }

        &__position,
        &__position-name {
            font-size: 13px;
        }

        &__text {
            font-size: 14px;
        }
    }
}
</style>

