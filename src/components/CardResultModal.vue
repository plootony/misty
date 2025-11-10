<script setup>
import { computed } from 'vue';
import { useModalStore } from '@/stores/modal.store';

const modalStore = useModalStore();

const currentCard = computed(() => {
    const cards = modalStore.selectedCards;
    return cards.length > 0 ? cards[cards.length - 1] : null;
});

const cardPosition = computed(() => {
    return currentCard.value?.isReversed ? 'Перевёрнутое положение' : 'Прямое положение';
});

const goToNext = () => {
    modalStore.closeCardResultModal();
    
    const maxCards = modalStore.selectedSpread?.cardsCount || 3;
    const isAllCardsSelected = modalStore.selectedCards.length === maxCards;
    
    if (isAllCardsSelected) {
        modalStore.openAnswerModal();
    }
};

const closeModal = () => {
    modalStore.closeCardResultModal();
};
</script>

<template>
    <div class="modal">
        <div class="modal__overlay" @click="closeModal"></div>
        <div class="modal__container">
            <div class="modal__content modal__content--card-result">
                <div class="card-result">
                    <div class="card-result__card">
                        <img :src="currentCard?.image" alt="Карта Таро" class="card-result__card-image" v-if="currentCard">
                        <img src="@/assets/images/card.png" alt="Карта Таро" class="card-result__card-image" v-else>
                    </div>

                    <div class="card-result__content" v-if="currentCard">
                        <div class="card-result__header">
                            <img src="@/assets/images/stars-icon.png" alt="star icon" class="card-result__icon">
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

                        <button class="btn btn--primary" @click="goToNext">Далее</button>
                    </div>
                </div>
            </div>
        </div>
    </div>
</template>

<style scoped lang="scss">
@use "../assets/scss/vars.scss" as *;

.modal__content {
    max-width: 920px;
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
    }

    &__content {
        flex: 1;
        display: flex;
        flex-direction: column;
        gap: $spacing-middle;
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
    }

    &__text {
        font-family: "Inter", Sans-serif;
        font-size: 16px;
        line-height: 1.6;
        color: $color-white;
    }
}
</style>

