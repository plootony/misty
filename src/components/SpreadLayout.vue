<script setup>
const props = defineProps({
  spreadId: {
    type: String,
    required: true
  },
  cardsCount: {
    type: Number,
    required: true
  }
});
</script>

<template>
  <div class="spread-layout" :class="`spread-layout--${spreadId}`">
    <div
      v-for="index in cardsCount"
      :key="index"
      class="spread-layout__card"
    >
      <span class="spread-layout__number">{{ index }}</span>
    </div>
  </div>
</template>

<style scoped lang="scss">
@use "../assets/scss/vars.scss" as *;

.spread-layout {
  position: relative;
  display: flex;
  justify-content: center;
  align-items: center;
  min-height: 200px;
  width: 100%;
  max-width: 400px;
  margin: 0 auto;
  background-color: $color-bg-light;
  border-radius: 8px;
  padding: $spacing-middle;

  &__card {
    position: absolute;
    width: 40px;
    height: 60px;
    background-color: $color-pastel-gold;
    border-radius: 6px;
    display: flex;
    align-items: center;
    justify-content: center;
    box-shadow: 0px 4px 8px rgba(0, 0, 0, 0.3);
    border: 2px solid $color-gold;
  }

  &__number {
    font-weight: 700;
    font-size: 16px;
    color: $color-bg-dark;
    font-family: "Inter", Sans-serif;
  }

  // Одна карта - по центру
  &--one-card {
    min-height: 120px;

    .spread-layout__card {
      &:nth-child(1) {
        left: 50%;
        top: 50%;
        transform: translate(-50%, -50%);
      }
    }
  }

  // Три карты - в линию
  &--three-cards {
    min-height: 120px;

    .spread-layout__card {
      &:nth-child(1) { left: calc(50% - 60px); top: 50%; transform: translate(-50%, -50%); }
      &:nth-child(2) { left: 50%; top: 50%; transform: translate(-50%, -50%); }
      &:nth-child(3) { left: calc(50% + 60px); top: 50%; transform: translate(-50%, -50%); }
    }
  }

  // Кельтский крест - крест + столбец
  &--celtic-cross {
    min-height: 200px;

    .spread-layout__card {
      width: 35px;
      height: 53px;

      // Центральный крест
      &:nth-child(1) { left: 50%; top: 50%; transform: translate(-50%, -50%); z-index: 1; }
      &:nth-child(2) { left: 50%; top: 50%; transform: translate(-50%, -50%) rotate(90deg); z-index: 2; }
      &:nth-child(3) { left: calc(50% - 60px); top: 50%; transform: translate(-50%, -50%); }
      &:nth-child(4) { left: calc(50% + 60px); top: 50%; transform: translate(-50%, -50%); }
      &:nth-child(5) { left: 50%; top: calc(50% - 45px); transform: translate(-50%, -50%); }
      &:nth-child(6) { left: 50%; top: calc(50% + 45px); transform: translate(-50%, -50%); }

      // Столбец справа
      &:nth-child(7) { left: calc(50% + 120px); top: calc(50% - 67px); transform: translate(-50%, -50%); }
      &:nth-child(8) { left: calc(50% + 120px); top: calc(50% - 22px); transform: translate(-50%, -50%); }
      &:nth-child(9) { left: calc(50% + 120px); top: calc(50% + 22px); transform: translate(-50%, -50%); }
      &:nth-child(10) { left: calc(50% + 120px); top: calc(50% + 67px); transform: translate(-50%, -50%); }
    }
  }

  // Подкова - полукруг
  &--horseshoe {
    min-height: 160px;

    .spread-layout__card {
      width: 35px;
      height: 53px;

      &:nth-child(1) { left: calc(50% - 80px); top: 50%; transform: translate(-50%, -50%) rotate(-30deg); }
      &:nth-child(2) { left: calc(50% - 53px); top: calc(50% - 29px); transform: translate(-50%, -50%) rotate(-20deg); }
      &:nth-child(3) { left: calc(50% - 27px); top: calc(50% - 42px); transform: translate(-50%, -50%) rotate(-10deg); }
      &:nth-child(4) { left: 50%; top: calc(50% - 47px); transform: translate(-50%, -50%); }
      &:nth-child(5) { left: calc(50% + 27px); top: calc(50% - 42px); transform: translate(-50%, -50%) rotate(10deg); }
      &:nth-child(6) { left: calc(50% + 53px); top: calc(50% - 29px); transform: translate(-50%, -50%) rotate(20deg); }
      &:nth-child(7) { left: calc(50% + 80px); top: 50%; transform: translate(-50%, -50%) rotate(30deg); }
    }
  }

  // Годовой круг - по кругу (12 карт)
  &--year-circle {
    min-height: 220px;

    .spread-layout__card {
      width: 35px;
      height: 53px;

      // 12 позиций по кругу (начиная с 12 часов)
      &:nth-child(1) { left: 50%; top: calc(50% - 80px); transform: translate(-50%, -50%); }
      &:nth-child(2) { left: calc(50% + 40px); top: calc(50% - 69px); transform: translate(-50%, -50%) rotate(30deg); }
      &:nth-child(3) { left: calc(50% + 69px); top: calc(50% - 40px); transform: translate(-50%, -50%) rotate(60deg); }
      &:nth-child(4) { left: calc(50% + 80px); top: 50%; transform: translate(-50%, -50%) rotate(90deg); }
      &:nth-child(5) { left: calc(50% + 69px); top: calc(50% + 40px); transform: translate(-50%, -50%) rotate(120deg); }
      &:nth-child(6) { left: calc(50% + 40px); top: calc(50% + 69px); transform: translate(-50%, -50%) rotate(150deg); }
      &:nth-child(7) { left: 50%; top: calc(50% + 80px); transform: translate(-50%, -50%) rotate(180deg); }
      &:nth-child(8) { left: calc(50% - 40px); top: calc(50% + 69px); transform: translate(-50%, -50%) rotate(210deg); }
      &:nth-child(9) { left: calc(50% - 69px); top: calc(50% + 40px); transform: translate(-50%, -50%) rotate(240deg); }
      &:nth-child(10) { left: calc(50% - 80px); top: 50%; transform: translate(-50%, -50%) rotate(270deg); }
      &:nth-child(11) { left: calc(50% - 69px); top: calc(50% - 40px); transform: translate(-50%, -50%) rotate(300deg); }
      &:nth-child(12) { left: calc(50% - 40px); top: calc(50% - 69px); transform: translate(-50%, -50%) rotate(330deg); }
    }
  }

  // Звезда Давида - 6 карт в форме шестиугольника
  &--star-of-david {
    min-height: 180px;

    .spread-layout__card {
      width: 35px;
      height: 53px;

      // 6 позиций в форме шестиугольника
      &:nth-child(1) { left: 50%; top: calc(50% - 60px); transform: translate(-50%, -50%); }
      &:nth-child(2) { left: calc(50% + 52px); top: calc(50% - 30px); transform: translate(-50%, -50%) rotate(60deg); }
      &:nth-child(3) { left: calc(50% + 52px); top: calc(50% + 30px); transform: translate(-50%, -50%) rotate(120deg); }
      &:nth-child(4) { left: 50%; top: calc(50% + 60px); transform: translate(-50%, -50%) rotate(180deg); }
      &:nth-child(5) { left: calc(50% - 52px); top: calc(50% + 30px); transform: translate(-50%, -50%) rotate(240deg); }
      &:nth-child(6) { left: calc(50% - 52px); top: calc(50% - 30px); transform: translate(-50%, -50%) rotate(300deg); }
    }
  }

  // Крест судьбы - 9 карт в форме креста 3x3
  &--fate-cross {
    min-height: 200px;

    .spread-layout__card {
      width: 35px;
      height: 53px;

      // 9 позиций в форме креста 3x3
      &:nth-child(1) { left: calc(50% - 60px); top: calc(50% - 60px); transform: translate(-50%, -50%); }
      &:nth-child(2) { left: 50%; top: calc(50% - 60px); transform: translate(-50%, -50%); }
      &:nth-child(3) { left: calc(50% + 60px); top: calc(50% - 60px); transform: translate(-50%, -50%); }
      &:nth-child(4) { left: calc(50% - 60px); top: 50%; transform: translate(-50%, -50%); }
      &:nth-child(5) { left: 50%; top: 50%; transform: translate(-50%, -50%); }
      &:nth-child(6) { left: calc(50% + 60px); top: 50%; transform: translate(-50%, -50%); }
      &:nth-child(7) { left: calc(50% - 60px); top: calc(50% + 60px); transform: translate(-50%, -50%); }
      &:nth-child(8) { left: 50%; top: calc(50% + 60px); transform: translate(-50%, -50%); }
      &:nth-child(9) { left: calc(50% + 60px); top: calc(50% + 60px); transform: translate(-50%, -50%); }
    }
  }

  // Крест решения - 5 карт в форме креста
  &--decision-cross {
    min-height: 180px;

    .spread-layout__card {
      width: 35px;
      height: 53px;

      // 5 позиций в форме креста
      &:nth-child(1) { left: 50%; top: calc(50% - 60px); transform: translate(-50%, -50%); }
      &:nth-child(2) { left: calc(50% + 60px); top: 50%; transform: translate(-50%, -50%) rotate(90deg); }
      &:nth-child(3) { left: 50%; top: calc(50% + 60px); transform: translate(-50%, -50%) rotate(180deg); }
      &:nth-child(4) { left: calc(50% - 60px); top: 50%; transform: translate(-50%, -50%) rotate(270deg); }
      &:nth-child(5) { left: 50%; top: 50%; transform: translate(-50%, -50%); }
    }
  }

  // Расклад на любовь - 7 карт в форме сердца
  &--love-spread {
    min-height: 170px;

    .spread-layout__card {
      width: 35px;
      height: 53px;

      // 7 позиций в форме сердца (упрощенная версия)
      &:nth-child(1) { left: calc(50% - 31px); top: calc(50% - 46px); transform: translate(-50%, -50%) rotate(-30deg); }
      &:nth-child(2) { left: calc(50% + 31px); top: calc(50% - 46px); transform: translate(-50%, -50%) rotate(30deg); }
      &:nth-child(3) { left: 50%; top: calc(50% - 31px); transform: translate(-50%, -50%); }
      &:nth-child(4) { left: calc(50% - 46px); top: calc(50% - 12px); transform: translate(-50%, -50%) rotate(-45deg); }
      &:nth-child(5) { left: calc(50% + 46px); top: calc(50% - 12px); transform: translate(-50%, -50%) rotate(45deg); }
      &:nth-child(6) { left: calc(50% - 23px); top: calc(50% + 19px); transform: translate(-50%, -50%) rotate(-15deg); }
      &:nth-child(7) { left: calc(50% + 23px); top: calc(50% + 19px); transform: translate(-50%, -50%) rotate(15deg); }
    }
  }

  // Путь карьеры - 8 карт в форме лестницы
  &--career-path {
    min-height: 180px;

    .spread-layout__card {
      width: 35px;
      height: 53px;

      // 8 позиций в форме лестницы (упрощенная версия)
      &:nth-child(1) { left: calc(50% - 62px); top: calc(50% + 31px); transform: translate(-50%, -50%) rotate(-10deg); }
      &:nth-child(2) { left: calc(50% - 37px); top: calc(50% + 19px); transform: translate(-50%, -50%) rotate(-5deg); }
      &:nth-child(3) { left: calc(50% - 12px); top: calc(50% + 6px); transform: translate(-50%, -50%); }
      &:nth-child(4) { left: calc(50% + 12px); top: calc(50% - 6px); transform: translate(-50%, -50%) rotate(5deg); }
      &:nth-child(5) { left: calc(50% + 37px); top: calc(50% - 19px); transform: translate(-50%, -50%) rotate(10deg); }
      &:nth-child(6) { left: calc(50% + 62px); top: calc(50% - 31px); transform: translate(-50%, -50%) rotate(15deg); }
      &:nth-child(7) { left: 50%; top: calc(50% - 43px); transform: translate(-50%, -50%); }
      &:nth-child(8) { left: 50%; top: calc(50% - 62px); transform: translate(-50%, -50%); }
    }
  }

  // Колесо фортуны - 8 карт по кругу
  &--wheel-of-fortune {
    min-height: 180px;

    .spread-layout__card {
      width: 35px;
      height: 53px;

      // 8 позиций по кругу (упрощенная версия)
      &:nth-child(1) { left: 50%; top: calc(50% - 60px); transform: translate(-50%, -50%); }
      &:nth-child(2) { left: calc(50% + 42px); top: calc(50% - 42px); transform: translate(-50%, -50%) rotate(45deg); }
      &:nth-child(3) { left: calc(50% + 60px); top: 50%; transform: translate(-50%, -50%) rotate(90deg); }
      &:nth-child(4) { left: calc(50% + 42px); top: calc(50% + 42px); transform: translate(-50%, -50%) rotate(135deg); }
      &:nth-child(5) { left: 50%; top: calc(50% + 60px); transform: translate(-50%, -50%) rotate(180deg); }
      &:nth-child(6) { left: calc(50% - 42px); top: calc(50% + 42px); transform: translate(-50%, -50%) rotate(225deg); }
      &:nth-child(7) { left: calc(50% - 60px); top: 50%; transform: translate(-50%, -50%) rotate(270deg); }
      &:nth-child(8) { left: calc(50% - 42px); top: calc(50% - 42px); transform: translate(-50%, -50%) rotate(315deg); }
    }
  }

  // Духовный путь - 9 карт в форме спирали
  &--spiritual-journey {
    min-height: 180px;

    .spread-layout__card {
      width: 35px;
      height: 53px;

      // 9 позиций в форме спирали (упрощенная версия)
      &:nth-child(1) { left: 50%; top: calc(50% - 19px); transform: translate(-50%, -50%); }
      &:nth-child(2) { left: calc(50% + 26px); top: calc(50% - 13px); transform: translate(-50%, -50%) rotate(30deg); }
      &:nth-child(3) { left: calc(50% + 39px); top: 50%; transform: translate(-50%, -50%) rotate(60deg); }
      &:nth-child(4) { left: calc(50% + 26px); top: calc(50% + 26px); transform: translate(-50%, -50%) rotate(120deg); }
      &:nth-child(5) { left: 50%; top: calc(50% + 39px); transform: translate(-50%, -50%) rotate(180deg); }
      &:nth-child(6) { left: calc(50% - 26px); top: calc(50% + 26px); transform: translate(-50%, -50%) rotate(240deg); }
      &:nth-child(7) { left: calc(50% - 39px); top: 50%; transform: translate(-50%, -50%) rotate(300deg); }
      &:nth-child(8) { left: calc(50% - 26px); top: calc(50% - 26px); transform: translate(-50%, -50%) rotate(330deg); }
      &:nth-child(9) { left: 50%; top: calc(50% - 52px); transform: translate(-50%, -50%); }
    }
  }

  // Пентакль - 5 карт в форме пентакля
  &--pentacle {
    min-height: 160px;

    .spread-layout__card {
      width: 35px;
      height: 53px;

      // 5 позиций в форме пентакля
      &:nth-child(1) { left: 50%; top: calc(50% - 47px); transform: translate(-50%, -50%); }
      &:nth-child(2) { left: calc(50% + 47px); top: calc(50% - 15px); transform: translate(-50%, -50%) rotate(72deg); }
      &:nth-child(3) { left: calc(50% + 29px); top: calc(50% + 43px); transform: translate(-50%, -50%) rotate(144deg); }
      &:nth-child(4) { left: calc(50% - 29px); top: calc(50% + 43px); transform: translate(-50%, -50%) rotate(216deg); }
      &:nth-child(5) { left: calc(50% - 47px); top: calc(50% - 15px); transform: translate(-50%, -50%) rotate(288deg); }
    }
  }

  // Чакры - 7 карт в форме вертикальной линии
  &--chakras {
    min-height: 180px;

    .spread-layout__card {
      width: 35px;
      height: 53px;

      // 7 позиций по вертикали (от коронной до корневой чакры)
      &:nth-child(1) { left: 50%; top: calc(50% - 78px); transform: translate(-50%, -50%); }
      &:nth-child(2) { left: 50%; top: calc(50% - 55px); transform: translate(-50%, -50%); }
      &:nth-child(3) { left: 50%; top: calc(50% - 32px); transform: translate(-50%, -50%); }
      &:nth-child(4) { left: 50%; top: calc(50% - 9px); transform: translate(-50%, -50%); }
      &:nth-child(5) { left: 50%; top: 50%; transform: translate(-50%, -50%); }
      &:nth-child(6) { left: 50%; top: calc(50% + 23px); transform: translate(-50%, -50%); }
      &:nth-child(7) { left: 50%; top: calc(50% + 46px); transform: translate(-50%, -50%); }
    }
  }

  // Ромб - 7 карт в форме ромба
  &--diamond {
    min-height: 170px;

    .spread-layout__card {
      width: 35px;
      height: 53px;

      // 7 позиций в форме ромба
      &:nth-child(1) { left: 50%; top: calc(50% - 55px); transform: translate(-50%, -50%); }
      &:nth-child(2) { left: calc(50% + 39px); top: calc(50% - 27px); transform: translate(-50%, -50%) rotate(45deg); }
      &:nth-child(3) { left: calc(50% + 55px); top: 50%; transform: translate(-50%, -50%) rotate(90deg); }
      &:nth-child(4) { left: calc(50% + 39px); top: calc(50% + 27px); transform: translate(-50%, -50%) rotate(135deg); }
      &:nth-child(5) { left: 50%; top: calc(50% + 55px); transform: translate(-50%, -50%) rotate(180deg); }
      &:nth-child(6) { left: calc(50% - 39px); top: calc(50% + 27px); transform: translate(-50%, -50%) rotate(225deg); }
      &:nth-child(7) { left: 50%; top: 50%; transform: translate(-50%, -50%); }
    }
  }

  // Мост - 6 карт в форме моста
  &--bridge {
    min-height: 160px;

    .spread-layout__card {
      width: 35px;
      height: 53px;

      // 6 позиций в форме моста
      &:nth-child(1) { left: calc(50% - 62px); top: calc(50% + 31px); transform: translate(-50%, -50%) rotate(-10deg); }
      &:nth-child(2) { left: calc(50% - 31px); top: calc(50% + 15px); transform: translate(-50%, -50%) rotate(-5deg); }
      &:nth-child(3) { left: 50%; top: calc(50% - 23px); transform: translate(-50%, -50%); }
      &:nth-child(4) { left: calc(50% + 31px); top: calc(50% + 15px); transform: translate(-50%, -50%) rotate(5deg); }
      &:nth-child(5) { left: calc(50% + 62px); top: calc(50% + 31px); transform: translate(-50%, -50%) rotate(10deg); }
      &:nth-child(6) { left: 50%; top: calc(50% + 46px); transform: translate(-50%, -50%); }
    }
  }

  // Ключ - 7 карт в форме ключа
  &--key {
    min-height: 170px;

    .spread-layout__card {
      width: 35px;
      height: 53px;

      // 7 позиций в форме ключа
      &:nth-child(1) { left: calc(50% - 55px); top: 50%; transform: translate(-50%, -50%) rotate(-90deg); }
      &:nth-child(2) { left: calc(50% - 37px); top: 50%; transform: translate(-50%, -50%) rotate(-90deg); }
      &:nth-child(3) { left: calc(50% - 18px); top: 50%; transform: translate(-50%, -50%) rotate(-90deg); }
      &:nth-child(4) { left: 50%; top: 50%; transform: translate(-50%, -50%) rotate(-90deg); }
      &:nth-child(5) { left: calc(50% + 18px); top: 50%; transform: translate(-50%, -50%) rotate(-90deg); }
      &:nth-child(6) { left: calc(50% + 37px); top: calc(50% - 23px); transform: translate(-50%, -50%) rotate(-45deg); }
      &:nth-child(7) { left: calc(50% + 37px); top: calc(50% + 23px); transform: translate(-50%, -50%) rotate(45deg); }
    }
  }

  // Цветок лотоса - 8 карт в форме цветка лотоса
  &--lotus-flower {
    min-height: 180px;

    .spread-layout__card {
      width: 35px;
      height: 53px;

      // 8 позиций в форме цветка лотоса
      &:nth-child(1) { left: 50%; top: calc(50% + 46px); transform: translate(-50%, -50%) rotate(180deg); }
      &:nth-child(2) { left: 50%; top: calc(50% + 31px); transform: translate(-50%, -50%) rotate(180deg); }
      &:nth-child(3) { left: calc(50% - 23px); top: calc(50% + 23px); transform: translate(-50%, -50%) rotate(-135deg); }
      &:nth-child(4) { left: calc(50% + 23px); top: calc(50% + 23px); transform: translate(-50%, -50%) rotate(135deg); }
      &:nth-child(5) { left: 50%; top: calc(50% + 8px); transform: translate(-50%, -50%); }
      &:nth-child(6) { left: calc(50% - 31px); top: calc(50% - 15px); transform: translate(-50%, -50%) rotate(-45deg); }
      &:nth-child(7) { left: calc(50% + 31px); top: calc(50% - 15px); transform: translate(-50%, -50%) rotate(45deg); }
      &:nth-child(8) { left: 50%; top: calc(50% - 46px); transform: translate(-50%, -50%); }
    }
  }

  // Анкх - 7 карт в форме египетского креста жизни
  &--ankh {
    min-height: 180px;

    .spread-layout__card {
      width: 35px;
      height: 53px;

      // 7 позиций в форме анкха
      &:nth-child(1) { left: 50%; top: calc(50% - 50px); transform: translate(-50%, -50%); }
      &:nth-child(2) { left: calc(50% - 31px); top: calc(50% - 23px); transform: translate(-50%, -50%) rotate(90deg); }
      &:nth-child(3) { left: calc(50% + 31px); top: calc(50% - 23px); transform: translate(-50%, -50%) rotate(90deg); }
      &:nth-child(4) { left: 50%; top: 50%; transform: translate(-50%, -50%) rotate(90deg); }
      &:nth-child(5) { left: 50%; top: calc(50% + 23px); transform: translate(-50%, -50%); }
      &:nth-child(6) { left: 50%; top: calc(50% + 46px); transform: translate(-50%, -50%); }
      &:nth-child(7) { left: 50%; top: calc(50% + 62px); transform: translate(-50%, -50%); }
    }
  }

  // Магический квадрат - 9 карт в форме квадрата 3x3
  &--magic-square {
    min-height: 170px;

    .spread-layout__card {
      width: 35px;
      height: 53px;

      // 9 позиций в форме квадрата 3x3
      &:nth-child(1) { left: calc(50% - 39px); top: calc(50% - 39px); transform: translate(-50%, -50%); }
      &:nth-child(2) { left: 50%; top: calc(50% - 39px); transform: translate(-50%, -50%); }
      &:nth-child(3) { left: calc(50% + 39px); top: calc(50% - 39px); transform: translate(-50%, -50%); }
      &:nth-child(4) { left: calc(50% - 39px); top: 50%; transform: translate(-50%, -50%); }
      &:nth-child(5) { left: 50%; top: 50%; transform: translate(-50%, -50%); }
      &:nth-child(6) { left: calc(50% + 39px); top: 50%; transform: translate(-50%, -50%); }
      &:nth-child(7) { left: calc(50% - 39px); top: calc(50% + 39px); transform: translate(-50%, -50%); }
      &:nth-child(8) { left: 50%; top: calc(50% + 39px); transform: translate(-50%, -50%); }
      &:nth-child(9) { left: calc(50% + 39px); top: calc(50% + 39px); transform: translate(-50%, -50%); }
    }
  }

  // Древо Жизни - 10 карт в форме каббалистического древа
  &--tree-of-life {
    min-height: 200px;

    .spread-layout__card {
      width: 35px;
      height: 53px;

      // 10 позиций в форме Древа Жизни (сефирот)
      &:nth-child(1) { left: 50%; top: calc(50% - 62px); transform: translate(-50%, -50%); }
      &:nth-child(2) { left: calc(50% - 39px); top: calc(50% - 46px); transform: translate(-50%, -50%); }
      &:nth-child(3) { left: calc(50% + 39px); top: calc(50% - 46px); transform: translate(-50%, -50%); }
      &:nth-child(4) { left: calc(50% - 62px); top: calc(50% - 8px); transform: translate(-50%, -50%); }
      &:nth-child(5) { left: calc(50% + 62px); top: calc(50% - 8px); transform: translate(-50%, -50%); }
      &:nth-child(6) { left: 50%; top: calc(50% + 8px); transform: translate(-50%, -50%); }
      &:nth-child(7) { left: calc(50% - 39px); top: calc(50% + 31px); transform: translate(-50%, -50%); }
      &:nth-child(8) { left: calc(50% + 39px); top: calc(50% + 31px); transform: translate(-50%, -50%); }
      &:nth-child(9) { left: 50%; top: calc(50% + 54px); transform: translate(-50%, -50%); }
      &:nth-child(10) { left: 50%; top: calc(50% + 77px); transform: translate(-50%, -50%); }
    }
  }
}

// Адаптивность для мобильных
@media (max-width: 768px) {
  .spread-layout {
    min-height: 150px;
    padding: $spacing-small;

    &__card {
      width: 30px;
      height: 45px;
    }

    &__number {
      font-size: 14px;
    }

    // Уменьшаем размеры для мобильных устройств
    &--celtic-cross,
    &--year-circle,
    &--fate-cross {
      .spread-layout__card {
        width: 28px;
        height: 42px;
      }
    }
  }
}
</style>
