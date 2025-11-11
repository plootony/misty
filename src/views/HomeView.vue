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

// Computed для динамического заголовка и подзаголовка
const pageTitle = computed(() => {
    if (modalStore.isFullReadingLoading) {
        return 'Выбор сделан';
    }
    return 'Сделай свой выбор';
});

const pageSubtitle = computed(() => {
    if (modalStore.isFullReadingLoading) {
        return 'Вселенная не спешит, она шепчет свои тайны через символы';
    }
    return 'Не думай. Доверься судьбе. Просто выбери карту';
});

// Перемешиваем колоду при каждом заходе на страницу
onMounted(() => {
    cardStore.shuffleDeck();
});

const selectCard = async (card) => {
    // Проверяем, что расклад выбран
    if (!modalStore.selectedSpread) {
        console.warn('Расклад не выбран, редирект на главную');
        router.push('/');
        return;
    }

    const maxCards = modalStore.selectedSpread.cardsCount;
    const currentCardsCount = modalStore.selectedCards?.length || 0;
    if (currentCardsCount < maxCards && !modalStore.isLoading) {
        modalStore.startLoading();

        try {
            // Создаём карту с случайным положением (прямое/перевёрнутое)
            const cardWithPosition = cardStore.createCardWithPosition(card);

            // Добавляем карту сразу для показа в прелоадере
            const cardIndex = currentCardsCount;
            const position = modalStore.selectedSpread.positions?.[cardIndex];
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
            const position = modalStore.selectedSpread.positions?.[cardIndex];

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
            <p class="card-selector__greeting">ПРИВЕТСТВУЮ ТЕБЯ, {{ userStore.userData?.name?.toUpperCase() || 'ГОСТЬ' }}</p>
            <h1 class="card-selector__title">{{ pageTitle }}</h1>
            <p class="card-selector__subtitle">{{ pageSubtitle }}</p>
        </div>

        <!-- Подпись во время загрузки итогового предсказания -->
        <div v-if="modalStore.isFullReadingLoading" class="card-selector__loading-text">
            Слушаю, что говорит вселенная
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
                    :class="{ 'card-selector__selected-card-image--reversed': safeSelectedCards[slotIndex].isReversed }"
                    :src="safeSelectedCards[slotIndex].image"
                    alt="Выбранная карта"
                >
            </div>
        </div>

        <div v-if="!modalStore.isFullReadingLoading" class="card-selector__deck">
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
                            :class="{ 'card-selector__selected-card-image--reversed': safeSelectedCards[safeSelectedCards.length - 1]?.isReversed }"
                        >
                    </div>
                    <div class="card-selector__loader-info">
                        <p class="card-selector__loader-text">Раскрываю послание карты</p>
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
    min-height: 100%;
    padding: $spacing-large $spacing-middle;
    display: flex;
    flex-direction: column;
    align-items: center;

    &__header {
        display: flex;
        flex-direction: column;
        align-items: center;
        text-align: center;
        gap: $spacing-small;
        margin-bottom: $spacing-large;
    }

    &__icon {
        width: 42px;
        height: auto;
    }

    &__greeting {
        font-family: "Inter", Sans-serif;
        color: $color-pastel-gold;
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

        // Звезда Давида - 6 карт в форме шестиугольника
        &--star-of-david {
            min-height: 450px;

            .card-selector__selected-card {
                position: absolute;

                // 6 позиций в форме шестиугольника
                &:nth-child(1) { left: 50%; top: calc(50% - 140px); transform: translate(-50%, -50%); } // Верх
                &:nth-child(2) { left: calc(50% + 121px); top: calc(50% - 70px); transform: translate(-50%, -50%) rotate(60deg); } // Верх-право
                &:nth-child(3) { left: calc(50% + 121px); top: calc(50% + 70px); transform: translate(-50%, -50%) rotate(120deg); } // Низ-право
                &:nth-child(4) { left: 50%; top: calc(50% + 140px); transform: translate(-50%, -50%) rotate(180deg); } // Низ
                &:nth-child(5) { left: calc(50% - 121px); top: calc(50% + 70px); transform: translate(-50%, -50%) rotate(240deg); } // Низ-лево
                &:nth-child(6) { left: calc(50% - 121px); top: calc(50% - 70px); transform: translate(-50%, -50%) rotate(300deg); } // Верх-лево
            }
        }

        // Крест судьбы - 9 карт в форме креста 3x3
        &--fate-cross {
            min-height: 500px;

            .card-selector__selected-card {
                position: absolute;

                // 9 позиций в форме креста 3x3
                &:nth-child(1) { left: calc(50% - 160px); top: calc(50% - 160px); transform: translate(-50%, -50%); } // Левый верхний
                &:nth-child(2) { left: 50%; top: calc(50% - 160px); transform: translate(-50%, -50%); } // Верхний центр
                &:nth-child(3) { left: calc(50% + 160px); top: calc(50% - 160px); transform: translate(-50%, -50%); } // Правый верхний
                &:nth-child(4) { left: calc(50% - 160px); top: 50%; transform: translate(-50%, -50%); } // Левый центр
                &:nth-child(5) { left: 50%; top: 50%; transform: translate(-50%, -50%); } // Центр
                &:nth-child(6) { left: calc(50% + 160px); top: 50%; transform: translate(-50%, -50%); } // Правый центр
                &:nth-child(7) { left: calc(50% - 160px); top: calc(50% + 160px); transform: translate(-50%, -50%); } // Левый нижний
                &:nth-child(8) { left: 50%; top: calc(50% + 160px); transform: translate(-50%, -50%); } // Нижний центр
                &:nth-child(9) { left: calc(50% + 160px); top: calc(50% + 160px); transform: translate(-50%, -50%); } // Правый нижний
            }
        }

        // Крест решения - 5 карт в форме креста
        &--decision-cross {
            min-height: 450px;

            .card-selector__selected-card {
                position: absolute;

                // 5 позиций в форме креста
                &:nth-child(1) { left: 50%; top: calc(50% - 140px); transform: translate(-50%, -50%); } // Верх
                &:nth-child(2) { left: calc(50% + 140px); top: 50%; transform: translate(-50%, -50%) rotate(90deg); } // Право
                &:nth-child(3) { left: 50%; top: calc(50% + 140px); transform: translate(-50%, -50%) rotate(180deg); } // Низ
                &:nth-child(4) { left: calc(50% - 140px); top: 50%; transform: translate(-50%, -50%) rotate(270deg); } // Лево
                &:nth-child(5) { left: 50%; top: 50%; transform: translate(-50%, -50%); } // Центр
            }
        }

        // Расклад на любовь - 7 карт в форме сердца
        &--love-spread {
            min-height: 500px;

            .card-selector__selected-card {
                position: absolute;

                // 7 позиций в форме сердца
                &:nth-child(1) { left: calc(50% - 80px); top: calc(50% - 120px); transform: translate(-50%, -50%) rotate(-30deg); } // Левый верхний
                &:nth-child(2) { left: calc(50% + 80px); top: calc(50% - 120px); transform: translate(-50%, -50%) rotate(30deg); } // Правый верхний
                &:nth-child(3) { left: 50%; top: calc(50% - 80px); transform: translate(-50%, -50%); } // Верх центра
                &:nth-child(4) { left: calc(50% - 120px); top: calc(50% - 40px); transform: translate(-50%, -50%) rotate(-60deg); } // Левый центр
                &:nth-child(5) { left: calc(50% + 120px); top: calc(50% - 40px); transform: translate(-50%, -50%) rotate(60deg); } // Правый центр
                &:nth-child(6) { left: calc(50% - 60px); top: calc(50% + 60px); transform: translate(-50%, -50%) rotate(-15deg); } // Левый нижний
                &:nth-child(7) { left: calc(50% + 60px); top: calc(50% + 60px); transform: translate(-50%, -50%) rotate(15deg); } // Правый нижний
            }
        }

        // Путь карьеры - 8 карт в форме лестницы
        &--career-path {
            min-height: 550px;

            .card-selector__selected-card {
                position: absolute;

                // 8 позиций в форме лестницы
                &:nth-child(1) { left: calc(50% - 200px); top: calc(50% + 120px); transform: translate(-50%, -50%) rotate(-15deg); } // Нижняя ступень слева
                &:nth-child(2) { left: calc(50% - 120px); top: calc(50% + 80px); transform: translate(-50%, -50%) rotate(-10deg); } // Вторая ступень слева
                &:nth-child(3) { left: calc(50% - 40px); top: calc(50% + 40px); transform: translate(-50%, -50%) rotate(-5deg); } // Третья ступень слева
                &:nth-child(4) { left: calc(50% + 40px); top: calc(50% + 0px); transform: translate(-50%, -50%) rotate(5deg); } // Четвертая ступень справа
                &:nth-child(5) { left: calc(50% + 120px); top: calc(50% - 40px); transform: translate(-50%, -50%) rotate(10deg); } // Пятая ступень справа
                &:nth-child(6) { left: calc(50% + 200px); top: calc(50% - 80px); transform: translate(-50%, -50%) rotate(15deg); } // Шестая ступень справа
                &:nth-child(7) { left: 50%; top: calc(50% - 120px); transform: translate(-50%, -50%); } // Верхняя центральная
                &:nth-child(8) { left: 50%; top: calc(50% - 200px); transform: translate(-50%, -50%); } // Самая верхняя
            }
        }

        // Колесо фортуны - 8 карт по кругу
        &--wheel-of-fortune {
            min-height: 550px;

            .card-selector__selected-card {
                position: absolute;

                // 8 позиций по кругу (каждые 45 градусов)
                &:nth-child(1) { left: 50%; top: calc(50% - 180px); transform: translate(-50%, -50%); } // Север
                &:nth-child(2) { left: calc(50% + 127px); top: calc(50% - 127px); transform: translate(-50%, -50%) rotate(45deg); } // Северо-восток
                &:nth-child(3) { left: calc(50% + 180px); top: 50%; transform: translate(-50%, -50%) rotate(90deg); } // Восток
                &:nth-child(4) { left: calc(50% + 127px); top: calc(50% + 127px); transform: translate(-50%, -50%) rotate(135deg); } // Юго-восток
                &:nth-child(5) { left: 50%; top: calc(50% + 180px); transform: translate(-50%, -50%) rotate(180deg); } // Юг
                &:nth-child(6) { left: calc(50% - 127px); top: calc(50% + 127px); transform: translate(-50%, -50%) rotate(225deg); } // Юго-запад
                &:nth-child(7) { left: calc(50% - 180px); top: 50%; transform: translate(-50%, -50%) rotate(270deg); } // Запад
                &:nth-child(8) { left: calc(50% - 127px); top: calc(50% - 127px); transform: translate(-50%, -50%) rotate(315deg); } // Северо-запад
            }
        }

        // Духовный путь - 9 карт в форме спирали
        &--spiritual-journey {
            min-height: 550px;

            .card-selector__selected-card {
                position: absolute;

                // 9 позиций в форме спирали
                &:nth-child(1) { left: 50%; top: calc(50% - 60px); transform: translate(-50%, -50%); } // Центр
                &:nth-child(2) { left: calc(50% + 80px); top: calc(50% - 40px); transform: translate(-50%, -50%) rotate(30deg); } // Первый виток
                &:nth-child(3) { left: calc(50% + 120px); top: 50%; transform: translate(-50%, -50%) rotate(60deg); } // Второй виток
                &:nth-child(4) { left: calc(50% + 80px); top: calc(50% + 80px); transform: translate(-50%, -50%) rotate(120deg); } // Третий виток
                &:nth-child(5) { left: 50%; top: calc(50% + 120px); transform: translate(-50%, -50%) rotate(180deg); } // Четвертый виток
                &:nth-child(6) { left: calc(50% - 80px); top: calc(50% + 80px); transform: translate(-50%, -50%) rotate(240deg); } // Пятый виток
                &:nth-child(7) { left: calc(50% - 120px); top: 50%; transform: translate(-50%, -50%) rotate(300deg); } // Шестой виток
                &:nth-child(8) { left: calc(50% - 80px); top: calc(50% - 80px); transform: translate(-50%, -50%) rotate(330deg); } // Седьмой виток
                &:nth-child(9) { left: 50%; top: calc(50% - 160px); transform: translate(-50%, -50%); } // Восьмой виток (внешний)
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
        transition: transform 0.3s ease;

        &--reversed {
            transform: rotate(180deg);
        }
    }

    &__loading-text {
        text-align: center;
        margin: $spacing-middle 0;
        font-family: "Inter", Sans-serif;
        font-size: 18px;
        font-weight: 500;
        color: $color-pastel-gold;
        font-style: italic;
        animation: textPulse 2s ease-in-out infinite;
    }

    &__deck {
        display: flex;
        max-width: 1200px;
        width: 100%;
        justify-content: center;
        position: relative;
        height: 400px;
        align-items: center;
        perspective: 1000px; // Добавляем перспективу для 3D эффектов
    }

    &__deck-card {
        width: 120px;
        height: 180px;
        cursor: pointer;
        position: absolute;
        opacity: 0;
        animation: cardFanIn 0.8s ease-out forwards;
        left: 50%;
        transition: filter 0.3s ease;

        &:hover {
            z-index: 200;
            filter: brightness(1.2);
        }

        // Позиционирование карт колоды в веере
        @for $i from 1 through 20 {
            $angle: ($i - 10.5) * 4deg;
            $distance: ($i - 10.5) * 35px;
            $vertical: abs($i - 10.5) * 8px;

            &:nth-child(#{$i}) {
                left: calc(50% + #{$distance});
                top: calc(50% + #{$vertical - 40px});
                transform: rotate($angle) rotateX(5deg);
                z-index: $i;
                animation-delay: #{$i * 0.03}s;
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
        box-shadow: 0px 10px 30px 0px rgba(176, 132, 80, 0.3);
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
        box-shadow: 0px 10px 30px 0px rgba(176, 132, 80, 0.3);
    }
    50% {
        transform: scale(1.02);
        box-shadow: 0px 15px 40px 0px rgba(176, 132, 80, 0.5);
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

@keyframes cardFanIn {
    0% {
        opacity: 0;
        transform: translate(-50%, -50%) scale(0.5) rotateY(180deg) rotateX(45deg);
    }
    50% {
        opacity: 0.7;
        transform: translate(-50%, -50%) scale(1.2) rotateY(90deg) rotateX(22deg);
    }
    100% {
        opacity: 1;
        transform: translate(-50%, -50%) scale(1) rotateY(0deg) rotateX(5deg);
    }
}
</style>