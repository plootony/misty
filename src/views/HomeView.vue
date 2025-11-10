<script setup>
import { useUserStore } from '@/stores/user.store';
import { useCardSelector } from '@/stores/cardSelector.store';
import { useModalStore } from '@/stores/modal.store';
import { interpretSingleCard } from '@/services/mistral.service';
import CardResultModal from '@/components/CardResultModal.vue';
import AnswerModal from '@/components/AnswerModal.vue';
import ButtonSpinner from '@/components/ButtonSpinner.vue';

const userStore = useUserStore();
const cardStore = useCardSelector();
const modalStore = useModalStore();

const selectCard = async (card) => {
    const maxCards = modalStore.selectedSpread?.cardsCount || 3;
    if (modalStore.selectedCards.length < maxCards && !modalStore.isLoading) {
        modalStore.startLoading();

        try {
            // Создаём карту с случайным положением (прямое/перевёрнутое)
            const cardWithPosition = cardStore.createCardWithPosition(card);
            
            // Получаем позицию карты в раскладе
            const cardIndex = modalStore.selectedCards.length;
            const position = modalStore.selectedSpread.positions[cardIndex];

            // Получаем толкование карты от AI
            const interpretation = await interpretSingleCard(
                modalStore.userQuestion,
                cardWithPosition,
                position
            );

            // Сохраняем карту с толкованием
            modalStore.addSelectedCard({
                ...cardWithPosition,
                interpretation,
                positionInfo: position
            });
            
            modalStore.stopLoading();
            modalStore.openCardResultModal();

        } catch (error) {
            console.error('Ошибка при толковании карты:', error);
            modalStore.stopLoading();
            
            // Fallback: добавляем карту без толкования
            const cardWithPosition = cardStore.createCardWithPosition(card);
            const cardIndex = modalStore.selectedCards.length;
            const position = modalStore.selectedSpread.positions[cardIndex];
            
            modalStore.addSelectedCard({
                ...cardWithPosition,
                interpretation: 'Не удалось получить толкование. Попробуйте ещё раз.',
                positionInfo: position
            });
            
            modalStore.openCardResultModal();
        }
    }
};
</script>

<template>
    <div class="card-selector">
        <div class="card-selector__header">
            <img src="@/assets/images/stars-icon.png" alt="star icon" class="card-selector__icon">
            <p class="card-selector__greeting">ПРИВЕТСТВУЮ ТЕБЯ, {{ userStore.userData?.name?.toUpperCase() || 'ГОСТЬ' }}</p>
            <h1 class="card-selector__title">Сделай свой выбор</h1>
            <p class="card-selector__subtitle">Не думай. Доверься судьбе. Просто выбери карту</p>
        </div>

        <div 
            class="card-selector__selected"
            :class="'card-selector__selected--' + (modalStore.selectedSpread?.id || 'three-cards')"
        >
            <div 
                v-for="index in (modalStore.selectedSpread?.cardsCount || 3)" 
                :key="index"
                class="card-selector__selected-card"
                :class="{ 'card-selector__selected-card--filled': modalStore.selectedCards[index - 1] }"
            >
                <img 
                    v-if="modalStore.selectedCards[index - 1]"
                    class="card-selector__selected-card-image" 
                    src="@/assets/images/card-back.png" 
                    alt="Выбранная карта"
                >
            </div>
        </div>

        <div class="card-selector__deck">
            <div 
                v-for="card in cardStore.deck" 
                :key="card.id" 
                class="card-selector__deck-card"
                @click="selectCard(card)"
            >
                <img 
                    class="card-selector__deck-card-image" 
                    src="@/assets/images/card-back.png" 
                    alt="Карта Таро"
                >
            </div>
        </div>

        <div v-if="modalStore.isLoading" class="card-selector__loader">
            <div class="card-selector__loader-overlay"></div>
            <div class="card-selector__loader-content">
                <div class="card-selector__loader-simple">
                    <ButtonSpinner />
                    <p class="card-selector__loader-text">Получаю предсказание</p>
                </div>
            </div>
        </div>

        <CardResultModal v-if="modalStore.isCardResultModalOpen" />
        <AnswerModal v-if="modalStore.isAnswerModalOpen" />
    </div>
</template>

<style scoped lang="scss">
@use "../assets/scss/vars.scss" as *;

.card-selector {
    min-height: 100vh;
    padding: $spacing-large $spacing-middle;
    display: flex;
    flex-direction: column;
    align-items: center;
    gap: $spacing-large;

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

    &__subtitle {
        font-family: "Inter", Sans-serif;
        font-size: 16px;
        color: $color-grey;
    }

    &__selected {
        display: flex;
        gap: $spacing-middle;
        max-width: 1200px;
        width: 100%;
        justify-content: center;
        min-height: 300px;
        align-items: center;
        position: relative;

        // Одна карта - по центру
        &--one-card {
            min-height: 250px;

            .card-selector__selected-card {
                &:nth-child(1) {
                    position: relative;
                }
            }
        }

        // Три карты - в линию
        &--three-cards {
            min-height: 250px;

            .card-selector__selected-card {
                position: relative;
            }
        }

        // Кельтский крест - крест + столбец
        &--celtic-cross {
            flex-wrap: wrap;
            justify-content: center;
            min-height: 500px;

            .card-selector__selected-card {
                position: absolute;

                // Центральный крест
                &:nth-child(1) { left: 50%; top: 50%; transform: translate(-50%, -50%); }
                &:nth-child(2) { left: 50%; top: 50%; transform: translate(-50%, -50%) rotate(90deg); }
                &:nth-child(3) { left: calc(50% - 160px); top: 50%; transform: translate(-50%, -50%); }
                &:nth-child(4) { left: calc(50% + 160px); top: 50%; transform: translate(-50%, -50%); }
                &:nth-child(5) { left: 50%; top: calc(50% - 120px); transform: translate(-50%, -50%); }
                &:nth-child(6) { left: 50%; top: calc(50% + 120px); transform: translate(-50%, -50%); }

                // Столбец справа
                &:nth-child(7) { left: calc(50% + 320px); top: calc(50% - 180px); transform: translate(-50%, -50%); }
                &:nth-child(8) { left: calc(50% + 320px); top: calc(50% - 60px); transform: translate(-50%, -50%); }
                &:nth-child(9) { left: calc(50% + 320px); top: calc(50% + 60px); transform: translate(-50%, -50%); }
                &:nth-child(10) { left: calc(50% + 320px); top: calc(50% + 180px); transform: translate(-50%, -50%); }
            }
        }

        // Подкова - полукруг
        &--horseshoe {
            min-height: 400px;

            .card-selector__selected-card {
                position: absolute;

                &:nth-child(1) { left: calc(50% - 270px); top: 50%; transform: translate(-50%, -50%) rotate(-30deg); }
                &:nth-child(2) { left: calc(50% - 180px); top: calc(50% - 75px); transform: translate(-50%, -50%) rotate(-20deg); }
                &:nth-child(3) { left: calc(50% - 90px); top: calc(50% - 105px); transform: translate(-50%, -50%) rotate(-10deg); }
                &:nth-child(4) { left: 50%; top: calc(50% - 115px); transform: translate(-50%, -50%); }
                &:nth-child(5) { left: calc(50% + 90px); top: calc(50% - 105px); transform: translate(-50%, -50%) rotate(10deg); }
                &:nth-child(6) { left: calc(50% + 180px); top: calc(50% - 75px); transform: translate(-50%, -50%) rotate(20deg); }
                &:nth-child(7) { left: calc(50% + 270px); top: 50%; transform: translate(-50%, -50%) rotate(30deg); }
            }
        }

        // Годовой круг - по кругу (12 карт)
        &--year-circle {
            min-height: 550px;

            .card-selector__selected-card {
                position: absolute;

                // 12 позиций по кругу (начиная с 12 часов)
                &:nth-child(1) { left: 50%; top: calc(50% - 210px); transform: translate(-50%, -50%); }
                &:nth-child(2) { left: calc(50% + 105px); top: calc(50% - 182px); transform: translate(-50%, -50%) rotate(30deg); }
                &:nth-child(3) { left: calc(50% + 182px); top: calc(50% - 105px); transform: translate(-50%, -50%) rotate(60deg); }
                &:nth-child(4) { left: calc(50% + 210px); top: 50%; transform: translate(-50%, -50%) rotate(90deg); }
                &:nth-child(5) { left: calc(50% + 182px); top: calc(50% + 105px); transform: translate(-50%, -50%) rotate(120deg); }
                &:nth-child(6) { left: calc(50% + 105px); top: calc(50% + 182px); transform: translate(-50%, -50%) rotate(150deg); }
                &:nth-child(7) { left: 50%; top: calc(50% + 210px); transform: translate(-50%, -50%) rotate(180deg); }
                &:nth-child(8) { left: calc(50% - 105px); top: calc(50% + 182px); transform: translate(-50%, -50%) rotate(210deg); }
                &:nth-child(9) { left: calc(50% - 182px); top: calc(50% + 105px); transform: translate(-50%, -50%) rotate(240deg); }
                &:nth-child(10) { left: calc(50% - 210px); top: 50%; transform: translate(-50%, -50%) rotate(270deg); }
                &:nth-child(11) { left: calc(50% - 182px); top: calc(50% - 105px); transform: translate(-50%, -50%) rotate(300deg); }
                &:nth-child(12) { left: calc(50% - 105px); top: calc(50% - 182px); transform: translate(-50%, -50%) rotate(330deg); }
            }
        }
    }

    &__selected-card {
        width: 100px;
        height: 150px;
        background-color: $color-bg-light;
        border-radius: 8px;
        box-shadow: 0px 15px 35px 0px rgba(10, 10, 12, 0.3215686274509804);
        display: flex;
        align-items: center;
        justify-content: center;
        overflow: hidden;
    }

    &__selected-card-image {
        width: 100%;
        height: 100%;
        object-fit: cover;
    }

    &__deck {
        display: flex;
        max-width: 1200px;
        width: 100%;
        justify-content: center;
        position: relative;
        height: 200px;
        align-items: center;
    }

    &__deck-card {
        width: 120px;
        height: 180px;
        cursor: pointer;
        transition: transform 0.3s;
        position: absolute;
        left: 50%;

        &:hover {
            transform: translateX(-50%) translateY(-24px) scale(1.05);
            z-index: 100;
        }

        @for $i from 1 through 12 {
            &:nth-child(#{$i}) {
                transform: translateX(-50%) translateX(calc((#{$i} - 6.5) * 32px));
                z-index: #{$i};
            }
        }
    }

    &__deck-card-image {
        width: 100%;
        height: 100%;
        object-fit: cover;
        border-radius: 6px;
        box-shadow: 0px 5px 15px 0px rgba(10, 10, 12, 0.5);
    }

    &__loader {
        position: fixed;
        top: 0;
        left: 0;
        right: 0;
        bottom: 0;
        z-index: 1000;
        display: flex;
        align-items: center;
        justify-content: center;
    }

    &__loader-overlay {
        position: absolute;
        top: 0;
        left: 0;
        right: 0;
        bottom: 0;
        background-color: rgba(0, 0, 0, 0.8);
    }

    &__loader-content {
        position: relative;
        z-index: 1001;
    }

    &__loader-simple {
        display: flex;
        flex-direction: column;
        align-items: center;
        gap: $spacing-middle;
        padding: $spacing-large;
        background-color: $color-bg-light;
        border-radius: 8px;
        box-shadow: 0px 15px 35px 0px rgba(10, 10, 12, 0.3215686274509804);
    }

    &__loader-text {
        margin: 0;
        font-family: "Inter", Sans-serif;
        font-size: 16px;
        color: $color-white;
        font-weight: 500;
    }
}
</style>