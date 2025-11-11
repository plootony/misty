<script setup>
import { useSpreadSelector } from '@/stores/spreadSelector.store';

const props = defineProps({
  spread: {
    type: Object,
    required: true
  },
  show: {
    type: Boolean,
    default: false
  }
});

const emit = defineEmits(['close']);

const spreadStore = useSpreadSelector();

const closeModal = () => {
  emit('close');
};

// Получаем расширенное описание расклада
const getSpreadDescription = (spreadId) => {
  const descriptions = {
    'one-card': {
      title: 'Одна карта - прямой ответ',
      description: `Классический расклад для получения быстрого совета или ответа на конкретный вопрос.
      Эта простая форма гадания идеально подходит для ситуаций, когда вам нужен четкий и однозначный ответ.
      Карта раскрывает суть вопроса, показывая основную энергию или совет Вселенной.`,
      usage: `Используйте этот расклад когда:
      • Нужен быстрый совет по простому вопросу
      • Не хватает времени на сложный анализ
      • Хотите узнать общее настроение ситуации
      • Ищете духовное руководство на день`
    },
    'three-cards': {
      title: 'Три карты - прошлое, настоящее, будущее',
      description: `Один из самых популярных и информативных раскладов в таро. Три карты образуют временную линию,
      показывая как прошлое влияет на настоящее и каким может быть будущее. Этот расклад дает полное понимание
      развития ситуации и помогает принять осознанные решения.`,
      usage: `Идеально подходит для анализа:
      • Развития отношений
      • Карьерных ситуаций
      • Личных кризисов
      • Духовного роста`
    },
    'celtic-cross': {
      title: 'Кельтский крест - глубокий анализ ситуации',
      description: `Самый подробный и мощный расклад в таро. Десять карт создают комплексную картину ситуации,
      раскрывая скрытые влияния, внутренние мотивы, внешние обстоятельства и возможные исходы.
      Этот расклад дает исчерпывающий анализ и практические рекомендации.`,
      usage: `Применяется для:
      • Сложных жизненных ситуаций
      • Важных решений
      • Духовного поиска
      • Понимания кармических уроков`
    },
    'horseshoe': {
      title: 'Подкова - семь граней ситуации',
      description: `Расклад в форме подковы символизирует удачу и защиту. Семь карт анализируют все аспекты ситуации:
      от прошлого до возможного будущего, включая скрытые влияния и практические советы.
      Форма подковы символизирует открытость и готовность принять дары Вселенной.`,
      usage: `Рекомендуется для:
      • Анализа текущих обстоятельств
      • Поиска скрытых факторов
      • Получения практических советов
      • Раскрытия потенциала ситуации`
    },
    'year-circle': {
      title: 'Годовой круг - энергии двенадцати месяцев',
      description: `Мощный расклад для планирования года вперед. Двенадцать карт соответствуют двенадцати месяцам года,
      показывая энергии, возможности и вызовы каждого периода. Этот расклад помогает понять циклы жизни
      и подготовиться к предстоящим событиям.`,
      usage: `Используйте для:
      • Годового планирования
      • Понимания жизненных циклов
      • Подготовки к важным событиям
      • Духовного развития на год`
    },
    'star-of-david': {
      title: 'Звезда Давида - анализ отношений',
      description: `Шесть карт в форме древнего символа гармонии анализируют все аспекты отношений между двумя людьми.
      Звезда Давида символизирует баланс между небесным и земным, мужским и женским началами.
      Расклад раскрывает глубинные чувства и помогает найти путь к гармонии.`,
      usage: `Идеально для:
      • Анализа романтических отношений
      • Семейных конфликтов
      • Дружеских связей
      • Профессионального партнерства`
    },
    'fate-cross': {
      title: 'Крест судьбы - кармический анализ',
      description: `Девять карт в форме креста анализируют кармические уроки и духовный путь человека.
      Этот расклад раскрывает прошлые воплощения, текущую миссию, кармические долги и духовные дары.
      Он помогает понять предназначение и найти путь к просветлению.`,
      usage: `Применяется для:
      • Духовного поиска
      • Понимания жизненной миссии
      • Анализа кармических уроков
      • Раскрытия духовного потенциала`
    },
    'decision-cross': {
      title: 'Крест решения - помощь в выборе',
      description: `Пять карт в форме креста помогают принять важные решения. Расклад анализирует все "за" и "против",
      показывает неожиданные факторы и дает четкий совет. Крест символизирует выбор пути и ответственность за решение.`,
      usage: `Используйте для:
      • Важных жизненных решений
      • Выбора между вариантами
      • Анализа рисков
      • Получения объективного совета`
    },
    'love-spread': {
      title: 'Расклад на любовь - анализ романтических отношений',
      description: `Семь карт в форме сердца анализируют все аспекты романтических отношений. Расклад показывает
      чувства обоих партнеров, основания отношений, внешние влияния и возможное будущее. Форма сердца
      символизирует любовь и эмоциональную глубину анализа.`,
      usage: `Рекомендуется для:
      • Анализа романтических отношений
      • Понимания чувств партнера
      • Решения проблем в отношениях
      • Поиска гармонии в любви`
    },
    'career-path': {
      title: 'Путь карьеры - профессиональное развитие',
      description: `Восемь карт в форме лестницы анализируют карьерный путь и профессиональные перспективы.
      Расклад показывает текущую ситуацию, препятствия, возможности роста, финансовый аспект и итоговые рекомендации.
      Форма лестницы символизирует восхождение и профессиональный рост.`,
      usage: `Применяется для:
      • Кариерного планирования
      • Поиска новых возможностей
      • Решения профессиональных проблем
      • Финансового планирования`
    },
    'wheel-of-fortune': {
      title: 'Колесо фортуны - жизненные циклы',
      description: `Восемь карт расположенных по кругу анализируют жизненные циклы и перемены.
      Колесо фортуны символизирует постоянное движение и изменение. Расклад показывает текущий цикл,
      кармические уроки, внешние влияния и будущее развитие.`,
      usage: `Используйте для:
      • Анализа жизненных циклов
      • Понимания перемен в жизни
      • Планирования будущего
      • Раскрытия кармических уроков`
    },
    'spiritual-journey': {
      title: 'Духовный путь - путь к просветлению',
      description: `Девять карт в форме спирали анализируют духовное развитие и путь к просветлению.
      Спираль символизирует эволюцию и восхождение. Расклад показывает текущий уровень духовного развития,
      дары, препятствия и следующий шаг на пути к высшему сознанию.`,
      usage: `Рекомендуется для:
      • Духовного развития
      • Поиска жизненной миссии
      • Медитации и самопознания
      • Раскрытия внутреннего потенциала`
    }
  };

  return descriptions[spreadId] || {
    title: spread.name,
    description: spread.description,
    usage: 'Подробное описание этого расклада скоро будет добавлено.'
  };
};
</script>

<template>
  <div v-if="show" class="modal" @click="closeModal">
    <div class="modal__overlay"></div>
    <div class="modal__container">
      <div class="modal__content">
        <div class="modal__header">
          <h2 class="modal__title">{{ spread.name }}</h2>
          <button type="button" class="modal__close" @click="closeModal">×</button>
        </div>

        <div class="modal__body">
          <!-- Визуальная схема расклада -->
          <div class="spread-details">
            <div class="spread-details__visual">
              <h3>Схема расклада</h3>
              <SpreadLayout :spread-id="spread.id" :cards-count="spread.cardsCount" />
            </div>

            <!-- Описание расклада -->
            <div class="spread-details__description">
              <div class="spread-description">
                <h3>{{ getSpreadDescription(spread.id).title }}</h3>
                <p class="spread-description__text">{{ getSpreadDescription(spread.id).description }}</p>

                <h4>Когда использовать:</h4>
                <p class="spread-description__usage">{{ getSpreadDescription(spread.id).usage }}</p>
              </div>
            </div>

            <!-- Позиции карт -->
            <div class="spread-details__positions">
              <h3>Позиции карт</h3>
              <div class="positions-list">
                <div
                  v-for="position in spread.positions"
                  :key="position.index"
                  class="position-item"
                >
                  <div class="position-number">{{ position.index + 1 }}</div>
                  <div class="position-content">
                    <h4 class="position-name">{{ position.name }}</h4>
                    <p class="position-meaning">{{ position.meaning }}</p>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<style scoped lang="scss">
@use "../assets/scss/vars.scss" as *;

.modal {
  &__content {
    max-width: 900px;
    width: 100%;
    background-color: $color-bg-dark;
    border-radius: 8px;
    max-height: 90vh;
    overflow: hidden;
    display: flex;
    flex-direction: column;
  }

  &__header {
    display: flex;
    justify-content: space-between;
    align-items: center;
    padding: $spacing-middle;
    border-bottom: 1px solid $color-bg-light;
  }

  &__title {
    font-family: "Playfair Display", Sans-serif;
    font-size: 24px;
    font-weight: 600;
    color: $color-white;
    margin: 0;
  }

  &__close {
    background: none;
    border: none;
    font-size: 28px;
    color: $color-grey;
    cursor: pointer;
    padding: 0;
    width: 32px;
    height: 32px;
    display: flex;
    align-items: center;
    justify-content: center;
    transition: color 0.3s;

    &:hover {
      color: $color-white;
    }
  }

  &__body {
    padding: $spacing-middle;
    overflow-y: auto;
    flex: 1;
  }
}

.spread-details {
  display: grid;
  gap: $spacing-large;

  &__visual,
  &__description,
  &__positions {
    h3 {
      font-family: "Playfair Display", Sans-serif;
      font-size: 18px;
      font-weight: 600;
      color: $color-white;
      margin-bottom: $spacing-middle;
      border-bottom: 2px solid $color-pastel-gold;
      padding-bottom: $spacing-x-smal;
    }
  }

  &__visual {
    text-align: center;
  }

  &__description {
    .spread-description {
      &__text {
        font-family: "Inter", Sans-serif;
        color: $color-grey;
        line-height: 1.6;
        margin-bottom: $spacing-middle;
      }

      h4 {
        font-family: "Playfair Display", Sans-serif;
        font-size: 16px;
        font-weight: 600;
        color: $color-pastel-gold;
        margin-bottom: $spacing-small;
        margin-top: $spacing-middle;
      }

      &__usage {
        font-family: "Inter", Sans-serif;
        color: $color-grey;
        line-height: 1.6;
        font-style: italic;
      }
    }
  }

  &__positions {
    .positions-list {
      display: grid;
      gap: $spacing-middle;
    }

    .position-item {
      display: flex;
      gap: $spacing-middle;
      align-items: flex-start;
      padding: $spacing-middle;
      background-color: $color-bg-light;
      border-radius: 6px;
      border-left: 3px solid $color-pastel-gold;
    }

    .position-number {
      width: 32px;
      height: 32px;
      background-color: $color-pastel-gold;
      color: $color-bg-dark;
      border-radius: 50%;
      display: flex;
      align-items: center;
      justify-content: center;
      font-weight: 600;
      font-size: 14px;
      flex-shrink: 0;
    }

    .position-content {
      flex: 1;

      .position-name {
        font-family: "Playfair Display", Sans-serif;
        font-size: 16px;
        font-weight: 600;
        color: $color-white;
        margin-bottom: $spacing-x-smal;
      }

      .position-meaning {
        font-family: "Inter", Sans-serif;
        font-size: 14px;
        color: $color-grey;
        line-height: 1.5;
        margin: 0;
      }
    }
  }
}

// Адаптивность
@media (max-width: 768px) {
  .modal {
    &__content {
      max-width: 95vw;
      max-height: 95vh;
    }
  }

  .spread-details {
    gap: $spacing-middle;

    &__positions {
      .position-item {
        flex-direction: column;
        gap: $spacing-small;
        align-items: flex-start;
      }

      .position-number {
        align-self: flex-start;
      }
    }
  }
}
</style>
