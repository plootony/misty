<script setup>
import { computed, ref, watch } from 'vue';

const props = defineProps({
    spreadId: {
        type: String,
        required: true
    },
    cardsCount: {
        type: Number,
        required: true
    },
    animated: {
        type: Boolean,
        default: false
    }
});

// Массив доступных миниатюр карт для анимации
const cardThumbnails = [
    'ace_of_cups-min.jpg',
    'eight_of_cups-min.jpg',
    'five_of_cups-min.jpg',
    'ace_of_pentacles-min.jpg',
    'eight_of_pentacles-min.jpg',
    'five_of_pentacles-min.jpg',
    'ace_of_swords-min.jpg',
    'eight_of_swords-min.jpg',
    'five_of_swords-min.jpg',
    'ace_of_wands-min.jpg',
    'eight_of_wands-min.jpg',
    'five_of_wands-min.jpg'
];

// Генерируем случайные миниатюры для каждой позиции карты
const cardImages = ref([]);

const generateCardImages = () => {
    cardImages.value = [];

    // Создаем копию массива доступных карт
    const availableCards = [...cardThumbnails];

    // Если карт меньше чем нужно, дублируем массив
    while (availableCards.length < props.cardsCount) {
        availableCards.push(...cardThumbnails);
    }

    // Перемешиваем массив для случайности
    for (let i = availableCards.length - 1; i > 0; i--) {
        const j = Math.floor(Math.random() * (i + 1));
        [availableCards[i], availableCards[j]] = [availableCards[j], availableCards[i]];
    }

    // Берем нужное количество уникальных карт
    for (let i = 0; i < props.cardsCount; i++) {
        cardImages.value.push(availableCards[i]);
    }
};

// Генерируем миниатюры при изменении количества карт
if (props.cardsCount > 0) {
    generateCardImages();
}

// Генерируем новые случайные миниатюры при каждом запуске анимации
watch(() => props.animated, (newValue) => {
    if (newValue && props.cardsCount > 0) {
        generateCardImages();
    }
});

const spreadClass = computed(() => {
    const classes = [`spread-preview--${props.spreadId}`];
    if (props.animated) {
        classes.push('spread-preview--animated');
    }
    return classes.join(' ');
});
</script>

<template>
    <div class="spread-preview" :class="spreadClass">
        <div
            v-for="(card, index) in cardsCount"
            :key="index"
            class="spread-preview__card"
        >
            <img
                class="spread-preview__card-image"
                :src="animated ? `src/assets/images/${cardImages[index]}` : 'src/assets/images/back-min.jpg'"
                alt="Карта Таро"
            >
        </div>
    </div>
</template>

<style scoped lang="scss">
@use "../assets/scss/vars.scss" as *;

.spread-preview {
    display: flex;
    gap: 6px;
    width: 100%;
    height: 100%;
    justify-content: center;
    align-items: center;
    position: relative;
    min-height: 120px;
    overflow: hidden;

    &__card {
        width: 30px;
        height: 45px;
        background-color: $color-bg-dark;
        border-radius: 3px;
        display: flex;
        align-items: center;
        justify-content: center;
        overflow: hidden;
        position: relative;
        transition: all 0.3s ease-out;
    }

    &__card-image {
        width: 100%;
        height: 100%;
        object-fit: cover;
        transition: opacity 0.1s ease-out;
    }

    // Анимация при наведении - карты вылетают из-за пределов превью
    &--animated {
        .spread-preview__card {
            position: absolute;
            left: 50%;
            top: 50%;
            transform: translate(-50%, -50%) translateY(120px) scale(0.8);
            opacity: 0;

            will-change: transform, opacity;

            &:nth-child(1) { animation: cardDeal 1.2s cubic-bezier(0.25, 0.46, 0.45, 0.94) forwards; animation-delay: 0s; }
            &:nth-child(2) { animation: cardDeal 1.2s cubic-bezier(0.25, 0.46, 0.45, 0.94) forwards; animation-delay: 0.08s; }
            &:nth-child(3) { animation: cardDeal 1.2s cubic-bezier(0.25, 0.46, 0.45, 0.94) forwards; animation-delay: 0.16s; }
            &:nth-child(4) { animation: cardDeal 1.2s cubic-bezier(0.25, 0.46, 0.45, 0.94) forwards; animation-delay: 0.24s; }
            &:nth-child(5) { animation: cardDeal 1.2s cubic-bezier(0.25, 0.46, 0.45, 0.94) forwards; animation-delay: 0.32s; }
            &:nth-child(6) { animation: cardDeal 1.2s cubic-bezier(0.25, 0.46, 0.45, 0.94) forwards; animation-delay: 0.4s; }
            &:nth-child(7) { animation: cardDeal 1.2s cubic-bezier(0.25, 0.46, 0.45, 0.94) forwards; animation-delay: 0.48s; }
            &:nth-child(8) { animation: cardDeal 1.2s cubic-bezier(0.25, 0.46, 0.45, 0.94) forwards; animation-delay: 0.56s; }
            &:nth-child(9) { animation: cardDeal 1.2s cubic-bezier(0.25, 0.46, 0.45, 0.94) forwards; animation-delay: 0.64s; }
            &:nth-child(10) { animation: cardDeal 1.2s cubic-bezier(0.25, 0.46, 0.45, 0.94) forwards; animation-delay: 0.72s; }
            &:nth-child(11) { animation: cardDeal 1.2s cubic-bezier(0.25, 0.46, 0.45, 0.94) forwards; animation-delay: 0.8s; }
            &:nth-child(12) { animation: cardDeal 1.2s cubic-bezier(0.25, 0.46, 0.45, 0.94) forwards; animation-delay: 0.88s; }

            // Скрываем изображения в начале анимации
            .spread-preview__card-image {
                opacity: 0;
                animation: revealCard 0.1s ease-out forwards;
            }

            &:nth-child(1) .spread-preview__card-image { animation-delay: 0.2s; }
            &:nth-child(2) .spread-preview__card-image { animation-delay: 0.28s; }
            &:nth-child(3) .spread-preview__card-image { animation-delay: 0.36s; }
            &:nth-child(4) .spread-preview__card-image { animation-delay: 0.44s; }
            &:nth-child(5) .spread-preview__card-image { animation-delay: 0.52s; }
            &:nth-child(6) .spread-preview__card-image { animation-delay: 0.6s; }
            &:nth-child(7) .spread-preview__card-image { animation-delay: 0.68s; }
            &:nth-child(8) .spread-preview__card-image { animation-delay: 0.76s; }
            &:nth-child(9) .spread-preview__card-image { animation-delay: 0.84s; }
            &:nth-child(10) .spread-preview__card-image { animation-delay: 0.92s; }
            &:nth-child(11) .spread-preview__card-image { animation-delay: 1s; }
            &:nth-child(12) .spread-preview__card-image { animation-delay: 1.08s; }
        }
    }

    // Одна карта - по центру
    &--one-card {
        min-height: 80px;

        .spread-preview__card {
            position: relative;
        }
    }

    // Три карты - в линию
    &--three-cards {
        min-height: 80px;

        .spread-preview__card {
            position: relative;
        }
    }

    // Кельтский крест - крест + столбец
    &--celtic-cross {
        flex-wrap: wrap;
        justify-content: center;
        min-height: 150px;

        .spread-preview__card {
            position: absolute;
            width: 25px;
            height: 38px;

            // Центральный крест
            &:nth-child(1) { left: 50%; top: 50%; transform: translate(-50%, -50%); z-index: 1; }
            &:nth-child(2) { left: 50%; top: 50%; transform: translate(-50%, -50%) rotate(90deg); z-index: 2; }
            &:nth-child(3) { left: calc(50% - 48px); top: 50%; transform: translate(-50%, -50%); }
            &:nth-child(4) { left: calc(50% + 48px); top: 50%; transform: translate(-50%, -50%); }
            &:nth-child(5) { left: 50%; top: calc(50% - 36px); transform: translate(-50%, -50%); }
            &:nth-child(6) { left: 50%; top: calc(50% + 36px); transform: translate(-50%, -50%); }

            // Столбец справа
            &:nth-child(7) { left: calc(50% + 96px); top: calc(50% - 54px); transform: translate(-50%, -50%); }
            &:nth-child(8) { left: calc(50% + 96px); top: calc(50% - 18px); transform: translate(-50%, -50%); }
            &:nth-child(9) { left: calc(50% + 96px); top: calc(50% + 18px); transform: translate(-50%, -50%); }
            &:nth-child(10) { left: calc(50% + 96px); top: calc(50% + 54px); transform: translate(-50%, -50%); }
        }
    }

    // Подкова - полукруг
    &--horseshoe {
        min-height: 120px;

        .spread-preview__card {
            position: absolute;
            width: 25px;
            height: 38px;

            &:nth-child(1) { left: calc(50% - 81px); top: 50%; transform: translate(-50%, -50%) rotate(-30deg); }
            &:nth-child(2) { left: calc(50% - 54px); top: calc(50% - 22px); transform: translate(-50%, -50%) rotate(-20deg); }
            &:nth-child(3) { left: calc(50% - 27px); top: calc(50% - 32px); transform: translate(-50%, -50%) rotate(-10deg); }
            &:nth-child(4) { left: 50%; top: calc(50% - 35px); transform: translate(-50%, -50%); }
            &:nth-child(5) { left: calc(50% + 27px); top: calc(50% - 32px); transform: translate(-50%, -50%) rotate(10deg); }
            &:nth-child(6) { left: calc(50% + 54px); top: calc(50% - 22px); transform: translate(-50%, -50%) rotate(20deg); }
            &:nth-child(7) { left: calc(50% + 81px); top: 50%; transform: translate(-50%, -50%) rotate(30deg); }
        }
    }

    // Годовой круг - по кругу (12 карт)
    &--year-circle {
        min-height: 165px;

        .spread-preview__card {
            position: absolute;
            width: 25px;
            height: 38px;

            // 12 позиций по кругу (начиная с 12 часов)
            &:nth-child(1) { left: 50%; top: calc(50% - 63px); transform: translate(-50%, -50%); }
            &:nth-child(2) { left: calc(50% + 32px); top: calc(50% - 55px); transform: translate(-50%, -50%) rotate(30deg); }
            &:nth-child(3) { left: calc(50% + 55px); top: calc(50% - 32px); transform: translate(-50%, -50%) rotate(60deg); }
            &:nth-child(4) { left: calc(50% + 63px); top: 50%; transform: translate(-50%, -50%) rotate(90deg); }
            &:nth-child(5) { left: calc(50% + 55px); top: calc(50% + 32px); transform: translate(-50%, -50%) rotate(120deg); }
            &:nth-child(6) { left: calc(50% + 32px); top: calc(50% + 55px); transform: translate(-50%, -50%) rotate(150deg); }
            &:nth-child(7) { left: 50%; top: calc(50% + 63px); transform: translate(-50%, -50%) rotate(180deg); }
            &:nth-child(8) { left: calc(50% - 32px); top: calc(50% + 55px); transform: translate(-50%, -50%) rotate(210deg); }
            &:nth-child(9) { left: calc(50% - 55px); top: calc(50% + 32px); transform: translate(-50%, -50%) rotate(240deg); }
            &:nth-child(10) { left: calc(50% - 63px); top: 50%; transform: translate(-50%, -50%) rotate(270deg); }
            &:nth-child(11) { left: calc(50% - 55px); top: calc(50% - 32px); transform: translate(-50%, -50%) rotate(300deg); }
            &:nth-child(12) { left: calc(50% - 32px); top: calc(50% - 55px); transform: translate(-50%, -50%) rotate(330deg); }
        }
    }

    // Звезда Давида - 6 карт в форме шестиугольника
    &--star-of-david {
        min-height: 140px;

        .spread-preview__card {
            position: absolute;
            width: 25px;
            height: 38px;

            // 6 позиций в форме шестиугольника
            &:nth-child(1) { left: 50%; top: calc(50% - 45px); transform: translate(-50%, -50%); }
            &:nth-child(2) { left: calc(50% + 39px); top: calc(50% - 22px); transform: translate(-50%, -50%) rotate(60deg); }
            &:nth-child(3) { left: calc(50% + 39px); top: calc(50% + 22px); transform: translate(-50%, -50%) rotate(120deg); }
            &:nth-child(4) { left: 50%; top: calc(50% + 45px); transform: translate(-50%, -50%) rotate(180deg); }
            &:nth-child(5) { left: calc(50% - 39px); top: calc(50% + 22px); transform: translate(-50%, -50%) rotate(240deg); }
            &:nth-child(6) { left: calc(50% - 39px); top: calc(50% - 22px); transform: translate(-50%, -50%) rotate(300deg); }
        }
    }

    // Крест судьбы - 9 карт в форме креста 3x3
    &--fate-cross {
        min-height: 150px;

        .spread-preview__card {
            position: absolute;
            width: 25px;
            height: 38px;

            // 9 позиций в форме креста 3x3
            &:nth-child(1) { left: calc(50% - 48px); top: calc(50% - 48px); transform: translate(-50%, -50%); }
            &:nth-child(2) { left: 50%; top: calc(50% - 48px); transform: translate(-50%, -50%); }
            &:nth-child(3) { left: calc(50% + 48px); top: calc(50% - 48px); transform: translate(-50%, -50%); }
            &:nth-child(4) { left: calc(50% - 48px); top: 50%; transform: translate(-50%, -50%); }
            &:nth-child(5) { left: 50%; top: 50%; transform: translate(-50%, -50%); }
            &:nth-child(6) { left: calc(50% + 48px); top: 50%; transform: translate(-50%, -50%); }
            &:nth-child(7) { left: calc(50% - 48px); top: calc(50% + 48px); transform: translate(-50%, -50%); }
            &:nth-child(8) { left: 50%; top: calc(50% + 48px); transform: translate(-50%, -50%); }
            &:nth-child(9) { left: calc(50% + 48px); top: calc(50% + 48px); transform: translate(-50%, -50%); }
        }
    }

    // Крест решения - 5 карт в форме креста
    &--decision-cross {
        min-height: 140px;

        .spread-preview__card {
            position: absolute;
            width: 25px;
            height: 38px;

            // 5 позиций в форме креста
            &:nth-child(1) { left: 50%; top: calc(50% - 45px); transform: translate(-50%, -50%); }
            &:nth-child(2) { left: calc(50% + 45px); top: 50%; transform: translate(-50%, -50%) rotate(90deg); }
            &:nth-child(3) { left: 50%; top: calc(50% + 45px); transform: translate(-50%, -50%) rotate(180deg); }
            &:nth-child(4) { left: calc(50% - 45px); top: 50%; transform: translate(-50%, -50%) rotate(270deg); }
            &:nth-child(5) { left: 50%; top: 50%; transform: translate(-50%, -50%); }
        }
    }

    // Расклад на любовь - 7 карт в форме сердца
    &--love-spread {
        min-height: 130px;

        .spread-preview__card {
            position: absolute;
            width: 25px;
            height: 38px;

            // 7 позиций в форме сердца (упрощенная версия)
            &:nth-child(1) { left: calc(50% - 25px); top: calc(50% - 35px); transform: translate(-50%, -50%) rotate(-30deg); }
            &:nth-child(2) { left: calc(50% + 25px); top: calc(50% - 35px); transform: translate(-50%, -50%) rotate(30deg); }
            &:nth-child(3) { left: 50%; top: calc(50% - 25px); transform: translate(-50%, -50%); }
            &:nth-child(4) { left: calc(50% - 35px); top: calc(50% - 10px); transform: translate(-50%, -50%) rotate(-45deg); }
            &:nth-child(5) { left: calc(50% + 35px); top: calc(50% - 10px); transform: translate(-50%, -50%) rotate(45deg); }
            &:nth-child(6) { left: calc(50% - 20px); top: calc(50% + 15px); transform: translate(-50%, -50%) rotate(-15deg); }
            &:nth-child(7) { left: calc(50% + 20px); top: calc(50% + 15px); transform: translate(-50%, -50%) rotate(15deg); }
        }
    }

    // Путь карьеры - 8 карт в форме лестницы
    &--career-path {
        min-height: 140px;

        .spread-preview__card {
            position: absolute;
            width: 25px;
            height: 38px;

            // 8 позиций в форме лестницы (упрощенная версия)
            &:nth-child(1) { left: calc(50% - 50px); top: calc(50% + 25px); transform: translate(-50%, -50%) rotate(-10deg); }
            &:nth-child(2) { left: calc(50% - 30px); top: calc(50% + 15px); transform: translate(-50%, -50%) rotate(-5deg); }
            &:nth-child(3) { left: calc(50% - 10px); top: calc(50% + 5px); transform: translate(-50%, -50%); }
            &:nth-child(4) { left: calc(50% + 10px); top: calc(50% - 5px); transform: translate(-50%, -50%) rotate(5deg); }
            &:nth-child(5) { left: calc(50% + 30px); top: calc(50% - 15px); transform: translate(-50%, -50%) rotate(10deg); }
            &:nth-child(6) { left: calc(50% + 50px); top: calc(50% - 25px); transform: translate(-50%, -50%) rotate(15deg); }
            &:nth-child(7) { left: 50%; top: calc(50% - 35px); transform: translate(-50%, -50%); }
            &:nth-child(8) { left: 50%; top: calc(50% - 50px); transform: translate(-50%, -50%); }
        }
    }

    // Колесо фортуны - 8 карт по кругу
    &--wheel-of-fortune {
        min-height: 140px;

        .spread-preview__card {
            position: absolute;
            width: 25px;
            height: 38px;

            // 8 позиций по кругу (упрощенная версия)
            &:nth-child(1) { left: 50%; top: calc(50% - 45px); transform: translate(-50%, -50%); }
            &:nth-child(2) { left: calc(50% + 32px); top: calc(50% - 32px); transform: translate(-50%, -50%) rotate(45deg); }
            &:nth-child(3) { left: calc(50% + 45px); top: 50%; transform: translate(-50%, -50%) rotate(90deg); }
            &:nth-child(4) { left: calc(50% + 32px); top: calc(50% + 32px); transform: translate(-50%, -50%) rotate(135deg); }
            &:nth-child(5) { left: 50%; top: calc(50% + 45px); transform: translate(-50%, -50%) rotate(180deg); }
            &:nth-child(6) { left: calc(50% - 32px); top: calc(50% + 32px); transform: translate(-50%, -50%) rotate(225deg); }
            &:nth-child(7) { left: calc(50% - 45px); top: 50%; transform: translate(-50%, -50%) rotate(270deg); }
            &:nth-child(8) { left: calc(50% - 32px); top: calc(50% - 32px); transform: translate(-50%, -50%) rotate(315deg); }
        }
    }

    // Духовный путь - 9 карт в форме спирали
    &--spiritual-journey {
        min-height: 140px;

        .spread-preview__card {
            position: absolute;
            width: 25px;
            height: 38px;

            // 9 позиций в форме спирали (упрощенная версия)
            &:nth-child(1) { left: 50%; top: calc(50% - 15px); transform: translate(-50%, -50%); }
            &:nth-child(2) { left: calc(50% + 20px); top: calc(50% - 10px); transform: translate(-50%, -50%) rotate(30deg); }
            &:nth-child(3) { left: calc(50% + 30px); top: 50%; transform: translate(-50%, -50%) rotate(60deg); }
            &:nth-child(4) { left: calc(50% + 20px); top: calc(50% + 20px); transform: translate(-50%, -50%) rotate(120deg); }
            &:nth-child(5) { left: 50%; top: calc(50% + 30px); transform: translate(-50%, -50%) rotate(180deg); }
            &:nth-child(6) { left: calc(50% - 20px); top: calc(50% + 20px); transform: translate(-50%, -50%) rotate(240deg); }
            &:nth-child(7) { left: calc(50% - 30px); top: 50%; transform: translate(-50%, -50%) rotate(300deg); }
            &:nth-child(8) { left: calc(50% - 20px); top: calc(50% - 20px); transform: translate(-50%, -50%) rotate(330deg); }
            &:nth-child(9) { left: 50%; top: calc(50% - 40px); transform: translate(-50%, -50%); }
        }
    }

    // Пентакль - 5 карт в форме пентакля
    &--pentacle {
        min-height: 120px;

        .spread-preview__card {
            position: absolute;
            width: 25px;
            height: 38px;

            // 5 позиций в форме пентакля
            &:nth-child(1) { left: 50%; top: calc(50% - 35px); transform: translate(-50%, -50%); }
            &:nth-child(2) { left: calc(50% + 35px); top: calc(50% - 10px); transform: translate(-50%, -50%) rotate(72deg); }
            &:nth-child(3) { left: calc(50% + 22px); top: calc(50% + 30px); transform: translate(-50%, -50%) rotate(144deg); }
            &:nth-child(4) { left: calc(50% - 22px); top: calc(50% + 30px); transform: translate(-50%, -50%) rotate(216deg); }
            &:nth-child(5) { left: calc(50% - 35px); top: calc(50% - 10px); transform: translate(-50%, -50%) rotate(288deg); }
        }
    }

    // Чакры - 7 карт в форме вертикальной линии
    &--chakras {
        min-height: 140px;

        .spread-preview__card {
            position: absolute;
            width: 25px;
            height: 38px;

            // 7 позиций по вертикали (от коронной до корневой чакры)
            &:nth-child(1) { left: 50%; top: calc(50% - 60px); transform: translate(-50%, -50%); }
            &:nth-child(2) { left: 50%; top: calc(50% - 45px); transform: translate(-50%, -50%); }
            &:nth-child(3) { left: 50%; top: calc(50% - 30px); transform: translate(-50%, -50%); }
            &:nth-child(4) { left: 50%; top: calc(50% - 15px); transform: translate(-50%, -50%); }
            &:nth-child(5) { left: 50%; top: 50%; transform: translate(-50%, -50%); }
            &:nth-child(6) { left: 50%; top: calc(50% + 15px); transform: translate(-50%, -50%); }
            &:nth-child(7) { left: 50%; top: calc(50% + 30px); transform: translate(-50%, -50%); }
        }
    }

    // Ромб - 7 карт в форме ромба
    &--diamond {
        min-height: 130px;

        .spread-preview__card {
            position: absolute;
            width: 25px;
            height: 38px;

            // 7 позиций в форме ромба
            &:nth-child(1) { left: 50%; top: calc(50% - 40px); transform: translate(-50%, -50%); }
            &:nth-child(2) { left: calc(50% + 28px); top: calc(50% - 20px); transform: translate(-50%, -50%) rotate(45deg); }
            &:nth-child(3) { left: calc(50% + 40px); top: 50%; transform: translate(-50%, -50%) rotate(90deg); }
            &:nth-child(4) { left: calc(50% + 28px); top: calc(50% + 20px); transform: translate(-50%, -50%) rotate(135deg); }
            &:nth-child(5) { left: 50%; top: calc(50% + 40px); transform: translate(-50%, -50%) rotate(180deg); }
            &:nth-child(6) { left: calc(50% - 28px); top: calc(50% + 20px); transform: translate(-50%, -50%) rotate(225deg); }
            &:nth-child(7) { left: 50%; top: 50%; transform: translate(-50%, -50%); }
        }
    }

    // Мост - 6 карт в форме моста
    &--bridge {
        min-height: 120px;

        .spread-preview__card {
            position: absolute;
            width: 25px;
            height: 38px;

            // 6 позиций в форме моста
            &:nth-child(1) { left: calc(50% - 50px); top: calc(50% + 20px); transform: translate(-50%, -50%) rotate(-10deg); }
            &:nth-child(2) { left: calc(50% - 25px); top: calc(50% + 10px); transform: translate(-50%, -50%) rotate(-5deg); }
            &:nth-child(3) { left: 50%; top: calc(50% - 15px); transform: translate(-50%, -50%); }
            &:nth-child(4) { left: calc(50% + 25px); top: calc(50% + 10px); transform: translate(-50%, -50%) rotate(5deg); }
            &:nth-child(5) { left: calc(50% + 50px); top: calc(50% + 20px); transform: translate(-50%, -50%) rotate(10deg); }
            &:nth-child(6) { left: 50%; top: calc(50% + 30px); transform: translate(-50%, -50%); }
        }
    }

    // Ключ - 7 карт в форме ключа
    &--key {
        min-height: 120px;

        .spread-preview__card {
            position: absolute;
            width: 25px;
            height: 38px;

            // 7 позиций в форме ключа
            &:nth-child(1) { left: calc(50% - 45px); top: 50%; transform: translate(-50%, -50%) rotate(-90deg); }
            &:nth-child(2) { left: calc(50% - 30px); top: 50%; transform: translate(-50%, -50%) rotate(-90deg); }
            &:nth-child(3) { left: calc(50% - 15px); top: 50%; transform: translate(-50%, -50%) rotate(-90deg); }
            &:nth-child(4) { left: 50%; top: 50%; transform: translate(-50%, -50%) rotate(-90deg); }
            &:nth-child(5) { left: calc(50% + 15px); top: 50%; transform: translate(-50%, -50%) rotate(-90deg); }
            &:nth-child(6) { left: calc(50% + 30px); top: calc(50% - 15px); transform: translate(-50%, -50%) rotate(-45deg); }
            &:nth-child(7) { left: calc(50% + 30px); top: calc(50% + 15px); transform: translate(-50%, -50%) rotate(45deg); }
        }
    }

    // Цветок лотоса - 8 карт в форме цветка лотоса
    &--lotus-flower {
        min-height: 130px;

        .spread-preview__card {
            position: absolute;
            width: 25px;
            height: 38px;

            // 8 позиций в форме цветка лотоса (упрощенная версия)
            &:nth-child(1) { left: 50%; top: calc(50% + 40px); transform: translate(-50%, -50%) rotate(180deg); } // Корень
            &:nth-child(2) { left: 50%; top: calc(50% + 25px); transform: translate(-50%, -50%) rotate(180deg); } // Стебель
            &:nth-child(3) { left: calc(50% - 15px); top: calc(50% + 15px); transform: translate(-50%, -50%) rotate(-135deg); } // Лист 1
            &:nth-child(4) { left: calc(50% + 15px); top: calc(50% + 15px); transform: translate(-50%, -50%) rotate(135deg); } // Лист 2
            &:nth-child(5) { left: 50%; top: calc(50% + 5px); transform: translate(-50%, -50%); } // Бутон
            &:nth-child(6) { left: calc(50% - 20px); top: calc(50% - 10px); transform: translate(-50%, -50%) rotate(-45deg); } // Лепесток 1
            &:nth-child(7) { left: calc(50% + 20px); top: calc(50% - 10px); transform: translate(-50%, -50%) rotate(45deg); } // Лепесток 2
            &:nth-child(8) { left: 50%; top: calc(50% - 30px); transform: translate(-50%, -50%); } // Цветок
        }
    }

    // Анкх - 7 карт в форме египетского креста жизни
    &--ankh {
        min-height: 140px;

        .spread-preview__card {
            position: absolute;
            width: 25px;
            height: 38px;

            // 7 позиций в форме анкха (упрощенная версия)
            &:nth-child(1) { left: 50%; top: calc(50% - 40px); transform: translate(-50%, -50%); } // Верхняя петля
            &:nth-child(2) { left: calc(50% - 25px); top: calc(50% - 15px); transform: translate(-50%, -50%) rotate(90deg); } // Левая часть петли
            &:nth-child(3) { left: calc(50% + 25px); top: calc(50% - 15px); transform: translate(-50%, -50%) rotate(90deg); } // Правая часть петли
            &:nth-child(4) { left: 50%; top: 50%; transform: translate(-50%, -50%) rotate(90deg); } // Горизонтальная перекладина
            &:nth-child(5) { left: 50%; top: calc(50% + 15px); transform: translate(-50%, -50%); } // Вертикальный столб
            &:nth-child(6) { left: 50%; top: calc(50% + 30px); transform: translate(-50%, -50%); } // Основание
            &:nth-child(7) { left: 50%; top: calc(50% + 45px); transform: translate(-50%, -50%); } // Крест жизни
        }
    }

    // Магический квадрат - 9 карт в форме квадрата 3x3
    &--magic-square {
        min-height: 130px;

        .spread-preview__card {
            position: absolute;
            width: 25px;
            height: 38px;

            // 9 позиций в форме квадрата 3x3 (упрощенная версия)
            &:nth-child(1) { left: calc(50% - 30px); top: calc(50% - 30px); transform: translate(-50%, -50%); } // Северо-запад
            &:nth-child(2) { left: 50%; top: calc(50% - 30px); transform: translate(-50%, -50%); } // Север
            &:nth-child(3) { left: calc(50% + 30px); top: calc(50% - 30px); transform: translate(-50%, -50%); } // Северо-восток
            &:nth-child(4) { left: calc(50% - 30px); top: 50%; transform: translate(-50%, -50%); } // Запад
            &:nth-child(5) { left: 50%; top: 50%; transform: translate(-50%, -50%); } // Центр
            &:nth-child(6) { left: calc(50% + 30px); top: 50%; transform: translate(-50%, -50%); } // Восток
            &:nth-child(7) { left: calc(50% - 30px); top: calc(50% + 30px); transform: translate(-50%, -50%); } // Юго-запад
            &:nth-child(8) { left: 50%; top: calc(50% + 30px); transform: translate(-50%, -50%); } // Юг
            &:nth-child(9) { left: calc(50% + 30px); top: calc(50% + 30px); transform: translate(-50%, -50%); } // Юго-восток
        }
    }

    // Древо Жизни - 10 карт в форме каббалистического древа
    &--tree-of-life {
        min-height: 140px;

        .spread-preview__card {
            position: absolute;
            width: 25px;
            height: 38px;

            // 10 позиций в форме Древа Жизни (упрощенная версия)
            &:nth-child(1) { left: 50%; top: calc(50% - 50px); transform: translate(-50%, -50%); } // Кетер
            &:nth-child(2) { left: calc(50% - 25px); top: calc(50% - 35px); transform: translate(-50%, -50%); } // Хокма
            &:nth-child(3) { left: calc(50% + 25px); top: calc(50% - 35px); transform: translate(-50%, -50%); } // Бина
            &:nth-child(4) { left: calc(50% - 40px); top: calc(50% - 5px); transform: translate(-50%, -50%); } // Хесед
            &:nth-child(5) { left: calc(50% + 40px); top: calc(50% - 5px); transform: translate(-50%, -50%); } // Гебура
            &:nth-child(6) { left: 50%; top: calc(50% + 5px); transform: translate(-50%, -50%); } // Типарет
            &:nth-child(7) { left: calc(50% - 25px); top: calc(50% + 25px); transform: translate(-50%, -50%); } // Нецах
            &:nth-child(8) { left: calc(50% + 25px); top: calc(50% + 25px); transform: translate(-50%, -50%); } // Ход
            &:nth-child(9) { left: 50%; top: calc(50% + 40px); transform: translate(-50%, -50%); } // Йесод
            &:nth-child(10) { left: 50%; top: calc(50% + 55px); transform: translate(-50%, -50%); } // Малкут
        }
    }
}

@keyframes cardDeal {
    0% {
        opacity: 0;
        transform: translateY(120px) translateX(-10px) scale(0.8) rotate(-25deg);
    }
    30% {
        opacity: 0.8;
        transform: translateY(-15px) translateX(5px) scale(1.1) rotate(10deg);
    }
    60% {
        opacity: 1;
        transform: translateY(-5px) translateX(-2px) scale(1.05) rotate(-5deg);
    }
    100% {
        opacity: 1;
        transform: translateY(0) translateX(0) scale(1) rotate(0deg);
    }
}

@keyframes revealCard {
    0% {
        opacity: 0;
    }
    100% {
        opacity: 1;
    }
}
</style>

