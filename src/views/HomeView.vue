<script setup>
import { onMounted, computed, nextTick } from 'vue';
import { useRouter } from 'vue-router';
import { useUserStore } from '@/stores/user.store';
import { useCardSelector } from '@/stores/cardSelector.store';
import { useModalStore } from '@/stores/modal.store';
import { interpretSingleCard, generateFullReading } from '@/services/mistral.service';
import { saveReading } from '@/services/supabase.service';
import { getZodiacSign } from '@/utils/zodiac';
import CardResultModal from '@/components/CardResultModal.vue';
import AnswerModal from '@/components/AnswerModal.vue';
import ButtonSpinner from '@/components/ButtonSpinner.vue';

const router = useRouter();
const userStore = useUserStore();
const cardStore = useCardSelector();
const modalStore = useModalStore();

const zodiacSign = getZodiacSign(userStore.userData?.birth || '01.01.2000');

// Computed для создания массива индексов
const selectedCardSlots = computed(() => {
    const count = modalStore.selectedSpread?.cardsCount || 3;
    return Array.from({ length: count }, (_, i) => i);
});

// Computed для безопасного доступа к выбранным картам
const safeSelectedCards = computed(() => modalStore.selectedCards || []);

// Перемешиваем колоду при каждом заходе на страницу
onMounted(() => {
    cardStore.shuffleDeck();
});

const selectCard = async (card) => {
    const maxCards = modalStore.selectedSpread?.cardsCount || 3;
    const currentCardsCount = modalStore.selectedCards?.length || 0;
    if (currentCardsCount < maxCards && !modalStore.isLoading) {
        modalStore.startLoading();

        try {
            // Создаём карту с случайным положением (прямое/перевёрнутое)
            const cardWithPosition = cardStore.createCardWithPosition(card);

            // Добавляем карту сразу для показа в прелоадере
            const cardIndex = currentCardsCount;
            const position = modalStore.selectedSpread.positions[cardIndex];
            modalStore.addSelectedCard({
                ...cardWithPosition,
                interpretation: 'Загружается толкование...',
                positionInfo: position,
                loading: true
            });

            // Ждем обновления DOM
            await nextTick();

            // Получаем толкование карты от AI
            const interpretation = await interpretSingleCard(
                modalStore.userQuestion,
                cardWithPosition,
                position
            );

            // Обновляем последнюю карту через функцию store
            modalStore.updateLastCard({
                ...cardWithPosition,
                interpretation,
                positionInfo: position,
                loading: false
            });

            modalStore.stopLoading();
            modalStore.openCardResultModal();

        } catch (error) {
            console.error('Ошибка при толковании карты:', error);
            modalStore.stopLoading();
            
            // Fallback: добавляем карту без толкования
            const cardWithPosition = cardStore.createCardWithPosition(card);
            const cardIndex = currentCardsCount; // Используем тот же индекс, что и для основной логики
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

const loadFullReading = async () => {
    try {
        modalStore.startFullReadingLoading();

        const reading = await generateFullReading(
            userStore.userData || { name: 'Гость', birth: '01.01.2000' },
            zodiacSign,
            modalStore.userQuestion,
            modalStore.selectedSpread,
            modalStore.selectedCards
        );

        // Сохраняем гадание в историю
        if (userStore.isAuthenticated && userStore.userData?.id) {
            try {
                await saveReading(userStore.userData.id, {
                    question: modalStore.userQuestion,
                    spreadType: modalStore.selectedSpread.id,
                    spreadName: modalStore.selectedSpread.name,
                    cards: modalStore.selectedCards.map(card => ({
                        name: card.name,
                        arcana: card.arcana,
                        isReversed: card.isReversed,
                        position: card.position,
                        positionInfo: card.positionInfo,
                        interpretation: card.interpretation,
                        meaning: card.meaning
                    })),
                    interpretation: reading
                });
            } catch (saveError) {
                console.error('Ошибка сохранения гадания:', saveError);
                // Не показываем ошибку пользователю, так как толкование уже получено
            }
        }

        modalStore.setFullReadingText(reading);
        modalStore.stopFullReadingLoading();
        modalStore.openAnswerModal();

    } catch (error) {
        console.error('Ошибка получения финального толкования:', error);
        modalStore.stopFullReadingLoading();
        // TODO: показать ошибку пользователю
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
            :class="[
                'card-selector__selected--' + (modalStore.selectedSpread?.id || 'three-cards'),
                { 'card-selector__selected--loading': modalStore.isFullReadingLoading }
            ]"
        >
            <div
                v-for="slotIndex in selectedCardSlots"
                :key="'slot-' + slotIndex"
                class="card-selector__selected-card"
                :class="{
                    'card-selector__selected-card--filled': safeSelectedCards[slotIndex],
                    'card-selector__selected-card--animating': modalStore.isFullReadingLoading && !!safeSelectedCards[slotIndex]
                }"
            >
                <img
                    v-if="safeSelectedCards[slotIndex]"
                    class="card-selector__selected-card-image"
                    :src="safeSelectedCards[slotIndex].image"
                    alt="Выбранная карта"
                >
            </div>
        </div>

        <!-- Подпись во время загрузки итогового предсказания -->
        <div v-if="modalStore.isFullReadingLoading" class="card-selector__loading-text">
            Получаем итоговое толкование...
        </div>

        <div class="card-selector__deck">
            <div
                v-for="card in cardStore.availableCards"
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

        <!-- Прелоадер с выбранной картой -->
        <div v-if="modalStore.isLoading" class="card-selector__loader">
            <div class="card-selector__loader-overlay"></div>
            <div class="card-selector__loader-content">
                <div class="card-selector__selected-card-loader">
                    <div class="card-selector__selected-card-container">
                        <img
                            :src="safeSelectedCards[safeSelectedCards.length - 1]?.image"
                            alt="Выбранная карта"
                            class="card-selector__selected-card-image"
                            :class="{ 'card-selector__selected-card--reversed': safeSelectedCards[safeSelectedCards.length - 1]?.isReversed }"
                        >
                    </div>
                    <div class="card-selector__loader-info">
                        <p class="card-selector__loader-text">Получаю предсказание</p>
                        <ButtonSpinner />
                    </div>
                </div>
            </div>
        </div>

        <CardResultModal v-if="modalStore.isCardResultModalOpen" @loadFullReading="loadFullReading" />
        <AnswerModal v-if="modalStore.isAnswerModalOpen" />
    </div>
</template>

<style scoped lang="scss">
@use "../assets/scss/vars.scss" as *;

.card-selector {
    min-height: calc(100vh - 70px);
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
        align-items: center;
        position: relative;
        margin: 0 auto;

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
                &:nth-child(1) { left: 50%; top: 50%; transform: translate(-50%, -50%); z-index: 1; } // Суть вопроса - центр
                &:nth-child(2) { left: 50%; top: 50%; transform: translate(-50%, -50%) rotate(90deg); z-index: 2; } // Препятствие - крест-накрест поверх первой
                &:nth-child(3) { left: calc(50% - 160px); top: 50%; transform: translate(-50%, -50%); } // Основа - слева
                &:nth-child(4) { left: calc(50% + 160px); top: 50%; transform: translate(-50%, -50%); } // Недавнее прошлое - справа
                &:nth-child(5) { left: 50%; top: calc(50% - 120px); transform: translate(-50%, -50%); } // Возможное будущее - сверху
                &:nth-child(6) { left: 50%; top: calc(50% + 120px); transform: translate(-50%, -50%); } // Ближайшее будущее - снизу

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

    &__selected-card--animating {
        animation: shuffleCard 2s ease-in-out infinite;
    }

    &__selected-card {
        width: 100px;
        height: 150px;
        border: 2px dashed rgba(255, 255, 255, 0.4);
        border-radius: 8px;
        background-color: transparent;
        display: flex;
        align-items: center;
        justify-content: center;
        overflow: hidden;
        transition: all 0.3s ease;

        &--filled {
            background-color: $color-bg-light;
            border: 2px solid rgba(255, 255, 255, 0.8);
            box-shadow: 0px 15px 35px 0px rgba(10, 10, 12, 0.3215686274509804);
        }
    }

    &__selected-card-image {
        width: 100%;
        height: 100%;
        object-fit: cover;
    }

    &__loading-text {
        text-align: center;
        margin: $spacing-large 0;
        font-family: "Inter", Sans-serif;
        font-size: 18px;
        font-weight: 500;
        color: $color-pastel-orange;
        font-style: italic;
        animation: textPulse 2s ease-in-out infinite;
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

    &__selected-card-loader {
        display: flex;
        flex-direction: column;
        align-items: center;
        gap: $spacing-large;
        padding: $spacing-large;
        background-color: $color-bg-light;
        border-radius: 12px;
        box-shadow: 0px 20px 40px 0px rgba(10, 10, 12, 0.4);
        animation: cardReveal 0.6s ease-out;
    }

    &__selected-card-container {
        position: relative;
        animation: cardPulse 2s ease-in-out infinite;
    }

    &__selected-card-image {
        width: 200px;
        height: 280px;
        object-fit: cover;
        border-radius: 12px;
        box-shadow: 0px 10px 30px 0px rgba(213, 132, 110, 0.3);
        transition: transform 0.3s ease;

        &--reversed {
            transform: rotate(180deg);
        }
    }

    &__loader-info {
        display: flex;
        flex-direction: column;
        align-items: center;
        gap: $spacing-middle;
    }

    &__loader-text {
        margin: 0;
        font-family: "Inter", Sans-serif;
        font-size: 16px;
        color: $color-white;
        font-weight: 500;
        text-align: center;
    }
}

// Анимации
@keyframes cardReveal {
    0% {
        opacity: 0;
        transform: scale(0.8) translateY(20px);
    }
    60% {
        opacity: 0.9;
        transform: scale(1.05) translateY(-5px);
    }
    100% {
        opacity: 1;
        transform: scale(1) translateY(0);
    }
}

@keyframes cardPulse {
    0%, 100% {
        transform: scale(1);
        box-shadow: 0px 10px 30px 0px rgba(213, 132, 110, 0.3);
    }
    50% {
        transform: scale(1.02);
        box-shadow: 0px 15px 40px 0px rgba(213, 132, 110, 0.5);
    }
}

@keyframes shuffleCard {
    0% {
        transform: scale(1);
        opacity: 1;
    }
    50% {
        transform: scale(1.1);
        opacity: 0.7;
    }
    100% {
        transform: scale(1);
        opacity: 1;
    }
}

@keyframes textPulse {
    0%, 100% {
        opacity: 0.7;
    }
    50% {
        opacity: 1;
    }
}
</style>