<script setup>
import { ref, onMounted, watch } from 'vue';
import { useUserStore } from '@/stores/user.store';
import natalChartService, { ZODIAC_SIGNS, PLANET_INFO } from '@/services/natalChart.service';
import { geocodePlace, validateCoordinates, formatCoordinates } from '@/services/geocoding.service';
import { interpretNatalChart } from '@/services/mistral.service';
import { useModalStore } from '@/stores/modal.store';
import ButtonSpinner from '@/components/ButtonSpinner.vue';
import NatalChartVisualization from '@/components/NatalChartVisualization.vue';
import AstrologyIcon from '@/components/AstrologyIcon.vue';

const userStore = useUserStore();
const modalStore = useModalStore();

// Данные для расчета натальной карты
const birthData = ref({
  date: userStore.userData?.birth || '',
  time: '12:00',
  place: '',
  latitude: null,
  longitude: null
});

const isCalculating = ref(false);
const natalChart = ref(null);
const error = ref('');

// Интерпретация натальной карты
const isInterpreting = ref(false);

// Система домов (по умолчанию Placidus)
const houseSystem = ref('P');

// Геокодинг
const isSearchingPlaces = ref(false);
const placeSuggestions = ref([]);
const showPlaceSuggestions = ref(false);

// Константы используются в шаблоне напрямую из сервиса

// Форматирование даты при вводе
const formatBirthDate = (event) => {
  let value = event.target.value.replace(/\D/g, '');

  if (value.length >= 2) {
    value = value.slice(0, 2) + '.' + value.slice(2);
  }
  if (value.length >= 5) {
    value = value.slice(0, 5) + '.' + value.slice(5, 9);
  }

  birthData.value.date = value;
};

// Поиск мест по названию
const searchPlaces = async (query) => {
  if (!query || query.length < 3) {
    placeSuggestions.value = [];
    showPlaceSuggestions.value = false;
    return;
  }

  isSearchingPlaces.value = true;
  try {
    const results = await geocodePlace(query);
    placeSuggestions.value = results;
    showPlaceSuggestions.value = results.length > 0;
  } catch (err) {
    console.warn('Ошибка поиска мест:', err);
    placeSuggestions.value = [];
    showPlaceSuggestions.value = false;
  } finally {
    isSearchingPlaces.value = false;
  }
};

// Выбор места из списка
const selectPlace = (place) => {
  birthData.value.place = place.display_name;
  birthData.value.latitude = place.lat;
  birthData.value.longitude = place.lng;
  showPlaceSuggestions.value = false;
  placeSuggestions.value = [];
};

// Обработка изменения места рождения
const onPlaceInput = (event) => {
  const query = event.target.value;
  const oldPlace = birthData.value.place;
  birthData.value.place = query;

  // Если пользователь изменил место (не выбрал из списка), сбрасываем координаты
  if (query !== oldPlace && !query.includes(',')) {
    birthData.value.latitude = null;
    birthData.value.longitude = null;
  }

  searchPlaces(query);
};

// Обработка изменения координат
const onCoordinatesChange = () => {
  // Если координаты введены вручную, очищаем название места
  if (birthData.value.latitude && birthData.value.longitude &&
      validateCoordinates(birthData.value.latitude, birthData.value.longitude)) {
    birthData.value.place = formatCoordinates(birthData.value.latitude, birthData.value.longitude);
  }
};

// Обработка потери фокуса поля места рождения
const handlePlaceBlur = () => {
  // Задержка нужна, чтобы пользователь успел кликнуть на вариант из списка
  setTimeout(() => {
    showPlaceSuggestions.value = false;
  }, 200);
};

// Получение названия системы домов для отображения
const getHouseSystemName = (system) => {
  const names = {
    'P': 'Placidus (Плацидус)',
    'K': 'Koch (Кох)',
    'E': 'Equal House (Равнодомная)',
    'W': 'Whole Sign (Целый знак)',
    'O': 'Porphyry (Порфирий)',
    'B': 'Alcabitius (Алькабитиус)',
    'C': 'Campanus (Кампанус)',
    'R': 'Regiomontanus (Региомонтан)',
    'M': 'Morinus (Моринус)'
  };
  return names[system] || system;
};

// Получение интерпретации натальной карты от ИИ
const getInterpretation = async () => {
  if (!natalChart.value) return;

  isInterpreting.value = true;

  try {
    const result = await interpretNatalChart(natalChart.value, userStore.userData);
    modalStore.setNatalChartInterpretationText(result);
    modalStore.openNatalChartInterpretationModal();
  } catch (error) {
    console.error('Ошибка получения интерпретации:', error);
    // Можно добавить показ toast или другого уведомления об ошибке
  } finally {
    isInterpreting.value = false;
  }
};

// Расчет натальной карты
const calculateNatalChart = async () => {
  if (!validateBirthData()) {
    return;
  }

  isCalculating.value = true;
  error.value = '';

  try {
    // Используем Swiss Ephemeris для расчета натальной карты
    const result = await natalChartService.calculateNatalChart({
      date: birthData.value.date,
      time: birthData.value.time,
      place: birthData.value.place,
      latitude: parseFloat(birthData.value.latitude) || 0,
      longitude: parseFloat(birthData.value.longitude) || 0,
      houseSystem: houseSystem.value
    });

    natalChart.value = result;

  } catch (err) {
    console.error('Ошибка расчета натальной карты:', err);
    error.value = err.message || 'Не удалось рассчитать натальную карту. Проверьте введенные данные.';
  } finally {
    isCalculating.value = false;
  }
};

// Валидация данных рождения
const validateBirthData = () => {
  if (!birthData.value.date) {
    error.value = 'Укажите дату рождения';
    return false;
  }

  if (!birthData.value.time) {
    error.value = 'Укажите время рождения';
    return false;
  }

         if (!birthData.value.place) {
           error.value = 'Укажите место рождения';
           return false;
         }

         if (!birthData.value.latitude || !birthData.value.longitude ||
             !validateCoordinates(birthData.value.latitude, birthData.value.longitude)) {
           error.value = 'Укажите корректные координаты места рождения';
           return false;
         }

  return true;
};

// Форматирование градусов
const formatDegree = (degree) => {
  return natalChartService.formatDegree(degree);
};

// Перевод силы аспекта на русский
const translateAspectStrength = (strength) => {
  const translations = {
    'exact': 'точный',
    'medium': 'средний',
    'weak': 'слабый'
  };
  return translations[strength] || strength;
};

// Сброс результатов
const resetChart = () => {
  natalChart.value = null;
  error.value = '';
};

// Показать подробную информацию о системе расчетов
const showCalculationDetails = () => {
  modalStore.openCalculationDetailsModal();
};

// Показать справку по астрологии
const showAstrologyHelp = () => {
  modalStore.openAstrologyHelpModal();
};

</script>

<template>
  <div class="natal-chart">
    <div class="page-header">
      <h1 class="page-header__title">Натальная карта</h1>
      <p class="page-header__subtitle">Раскрытие космического blueprint вашей души</p>
    </div>

    <div class="natal-chart__container">

      <!-- Форма ввода данных -->
      <div v-if="!natalChart" class="natal-chart__form-section">
        <div class="natal-chart__form">
          <h2 class="natal-chart__section-title">Данные рождения</h2>

          <div v-if="error" class="natal-chart__error">
            {{ error }}
          </div>

          <div class="natal-chart__form-grid">
            <div class="natal-chart__field">
              <label class="natal-chart__label" for="birth-date">
                Дата рождения *
              </label>
              <input
                id="birth-date"
                v-model="birthData.date"
                type="text"
                class="natal-chart__input"
                placeholder="ДД.ММ.ГГГГ"
                maxlength="10"
                @input="formatBirthDate"
              >
            </div>

            <div class="natal-chart__field">
              <label class="natal-chart__label" for="birth-time">
                Время рождения *
              </label>
              <input
                id="birth-time"
                v-model="birthData.time"
                type="time"
                class="natal-chart__input"
              >
            </div>

            <div class="natal-chart__field natal-chart__field--full natal-chart__field--relative">
              <label class="natal-chart__label" for="birth-place">
                Место рождения *
              </label>
              <input
                id="birth-place"
                v-model="birthData.place"
                type="text"
                class="natal-chart__input"
                placeholder="Город, страна"
                @input="onPlaceInput"
                @focus="showPlaceSuggestions = placeSuggestions.length > 0"
                @blur="handlePlaceBlur"
                autocomplete="off"
              >
              <!-- Автодополнение мест -->
              <div v-if="showPlaceSuggestions && placeSuggestions.length > 0" class="natal-chart__suggestions">
                <div
                  v-for="place in placeSuggestions"
                  :key="place.place_id"
                  class="natal-chart__suggestion-item"
                  @mousedown="selectPlace(place)"
                >
                  <div class="natal-chart__suggestion-name">{{ place.display_name }}</div>
                  <div class="natal-chart__suggestion-coords">
                    {{ formatCoordinates(place.lat, place.lng) }}
                  </div>
                </div>
              </div>
              <!-- Индикатор загрузки -->
              <div v-if="isSearchingPlaces" class="natal-chart__searching">
                <ButtonSpinner />
                <span>Поиск...</span>
              </div>
            </div>

            <div class="natal-chart__field">
              <label class="natal-chart__label" for="latitude">
                Широта
              </label>
              <input
                id="latitude"
                v-model="birthData.latitude"
                type="number"
                step="0.0001"
                class="natal-chart__input"
                placeholder="55.7558"
                @input="onCoordinatesChange"
                min="-90"
                max="90"
              >
            </div>

            <div class="natal-chart__field">
              <label class="natal-chart__label" for="longitude">
                Долгота
              </label>
              <input
                id="longitude"
                v-model="birthData.longitude"
                type="number"
                step="0.0001"
                class="natal-chart__input"
                placeholder="37.6176"
                @input="onCoordinatesChange"
                min="-180"
                max="180"
              >
            </div>

            <div class="natal-chart__field">
              <label class="natal-chart__label" for="house-system">
                Система домов
              </label>
              <select v-model="houseSystem" class="natal-chart__select">
                <option value="P">Placidus (Плацидус) - Рекомендуется</option>
                <option value="K">Koch (Кох) - Современная</option>
                <option value="E">Equal House (Равнодомная) - Простая</option>
                <option value="W">Whole Sign (Целый знак) - Традиционная</option>
                <option value="O">Porphyry (Порфирий)</option>
                <option value="B">Alcabitius (Алькабитиус)</option>
                <option value="C">Campanus (Кампанус)</option>
                <option value="R">Regiomontanus (Региомонтан)</option>
                <option value="M">Morinus (Моринус)</option>
              </select>
            </div>
          </div>

          <!-- Информация о системе расчетов -->
          <p class="natal-chart__info-text">
            Расчеты выполняются с использованием
            <a href="https://github.com/cosinekitty/astronomy-engine" target="_blank" rel="noopener noreferrer" class="natal-chart__engine-link">
              Astronomy Engine
            </a>
            — современной астрономической библиотеки для точных вычислений положений небесных тел.
          </p>


          <div class="natal-chart__actions">
            <button
              class="btn btn--primary btn--medium btn--full-width"
              @click="calculateNatalChart"
              :disabled="isCalculating"
            >
              <ButtonSpinner v-if="isCalculating" class="btn__icon" />
              <span>{{ isCalculating ? 'Рассчитываем...' : 'Рассчитать натальную карту' }}</span>
            </button>

            <button
              v-if="natalChart"
              class="btn btn--secondary btn--medium"
              @click="resetChart"
            >
              Сбросить
            </button>
          </div>
        </div>
      </div>

      <!-- Результаты расчета -->
      <div v-if="natalChart" class="natal-chart__results-section">
        <div class="natal-chart__results">
          <h2 class="natal-chart__section-title">Ваша натальная карта</h2>

          <!-- Ссылки на справку -->
          <div class="natal-chart__help-links">
            <button
              class="natal-chart__details-link"
              @click="showCalculationDetails"
            >
              Подробнее о системе расчетов
            </button>
            <button
              class="natal-chart__help-link"
              @click="showAstrologyHelp"
            >
              Помощь по астрологии
            </button>
          </div>

          <p class="natal-chart__system-info">
            <strong>Система домов:</strong> {{ getHouseSystemName(houseSystem) }}
            <em>(влияет на интерпретацию сфер жизни)</em>
          </p>
          

          <!-- Визуализация натальной карты -->
          <div class="natal-chart__visualization">
            <h3 class="natal-chart__subsection-title">Натальный круг</h3>
            <NatalChartVisualization
              :planets="natalChart.planets"
              :houses="natalChart.houses"
              :aspects="natalChart.aspects"
              :size="500"
            />
          </div>

          <!-- Положения планет -->
          <div class="natal-chart__planets">
            <h3 class="natal-chart__subsection-title">Планеты и светила</h3>
            <div class="natal-chart__planets-grid">
              <div
                v-for="planet in natalChart.planets"
                :key="planet.key"
                class="natal-chart__planet-card"
              >
                <div class="natal-chart__planet-header">
                  <span class="natal-chart__planet-symbol">{{ planet.symbol }}</span>
                  <span class="natal-chart__planet-name">{{ planet.name }}</span>
                  <span v-if="planet.retrograde" class="natal-chart__retrograde">R</span>
                </div>
                <div class="natal-chart__planet-position">
                  <span class="natal-chart__sign">{{ planet.sign?.symbol || '♈' }}</span>
                  <span class="natal-chart__degree">{{ formatDegree(planet.longitude || 0) }}</span>
                </div>
              </div>
            </div>
          </div>

          <!-- Дома -->
          <div class="natal-chart__houses">
            <h3 class="natal-chart__subsection-title">Астрологические дома</h3>
            <div class="natal-chart__houses-grid">
              <div
                v-for="house in natalChart.houses"
                :key="house.number"
                class="natal-chart__house-card"
              >
                <div class="natal-chart__house-number">{{ house.number }}</div>
                <div class="natal-chart__house-position">
                  <span class="natal-chart__sign">{{ house.sign?.symbol || '♈' }}</span>
                  <span class="natal-chart__degree">{{ formatDegree(house.cusp || 0) }}</span>
                </div>
              </div>
            </div>
          </div>

          <!-- Аспекты -->
          <div class="natal-chart__aspects">
            <h3 class="natal-chart__subsection-title">Ключевые аспекты</h3>
            <div class="natal-chart__aspects-list">
              <div
                v-for="aspect in natalChart.aspects"
                :key="`${aspect.planet1}-${aspect.planet2}`"
                class="natal-chart__aspect-item"
                :class="[
                  `natal-chart__aspect-item--${aspect.aspectElement || 'neutral'}`,
                  `natal-chart__aspect-item--${aspect.strength || 'weak'}`
                ]"
              >
                <div class="natal-chart__aspect-main">
                  <span class="natal-chart__aspect-symbols">
                    <AstrologyIcon :symbol="aspect.planet1Symbol || '☉'" :size="16" />
                    <AstrologyIcon :symbol="aspect.aspectSymbol || '☌'" :size="14" class="natal-chart__aspect-symbol" />
                    <AstrologyIcon :symbol="aspect.planet2Symbol || '☽'" :size="16" />
                  </span>
                  <span class="natal-chart__aspect-planets">
                    {{ aspect.planet1 }} ↔ {{ aspect.planet2 }}
                  </span>
                </div>
                <div class="natal-chart__aspect-details">
                  <span class="natal-chart__aspect-type">{{ aspect.aspect }}</span>
                  <span class="natal-chart__aspect-angle">({{ aspect.angle }}°)</span>
                  <span v-if="aspect.strength" class="natal-chart__aspect-strength" :class="`natal-chart__aspect-strength--${aspect.strength}`">
                    {{ translateAspectStrength(aspect.strength) }}
                  </span>
                  <span class="natal-chart__aspect-orb">{{ aspect.orb ? aspect.orb.toFixed(1) : '0.0' }}'</span>
                </div>
              </div>
            </div>
          </div>

          <!-- Кнопка получения интерпретации -->
          <div class="natal-chart__interpretation-button">
            <button
              class="btn btn--primary btn--medium btn--full-width"
              @click="getInterpretation"
              :disabled="isInterpreting"
            >
              <ButtonSpinner v-if="isInterpreting" class="btn__icon" />
              <span>{{ isInterpreting ? 'Получаю интерпретацию...' : 'Получить значение' }}</span>
            </button>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<style scoped lang="scss">
@use "../assets/scss/vars.scss" as *;

.natal-chart {
  padding: $spacing-large $spacing-middle;
  background-image: url('/images/bg-1.png');
  background-size: contain;
  background-position: top center;
  background-attachment: fixed;
  min-height: 100vh;

  &__container {
    max-width: 1200px;
    margin: 0 auto;
    display: flex;
    flex-direction: column;
    gap: $spacing-small;
  }

  &__form-section,
  &__results-section {
    background-color: $color-bg-light;
    border-radius: 12px;
    padding: $spacing-middle;
    box-shadow: 0px 15px 35px 0px rgba(10, 10, 12, 0.3215686274509804);
  }

  &__form {
    display: flex;
    flex-direction: column;
    gap: $spacing-middle;
  }

  &__section-title {
    font-family: "Playfair Display", Sans-serif;
    font-size: 28px;
    font-weight: 600;
    color: $color-white;
    text-align: center;
  }

  &__system-info {
    font-family: "Inter", Sans-serif;
    font-size: 16px;
    color: $color-grey;
    margin: 0 0 $spacing-small 0;
    padding: $spacing-small $spacing-middle;
    background-color: rgba($color-gold, 0.1);
    border-left: 3px solid $color-gold;
    border-radius: 4px;
    text-align: center;

    strong {
      color: $color-gold;
    }

    em {
      font-style: italic;
      color: $color-grey;
    }
  }


  &__error {
    padding: $spacing-middle;
    background-color: rgba(255, 84, 84, 0.1);
    border-left: 3px solid $color-gold;
    color: $color-gold;
    font-family: "Inter", Sans-serif;
    font-size: 14px;
    border-radius: 4px;
    animation: shake 0.3s ease-in-out;
  }

  &__form-grid {
    display: flex;
    flex-wrap: wrap;
    gap: $spacing-middle;
  }

  &__field {
    width: calc(33.33% - $spacing-middle);
    display: flex;
    flex-direction: column;
    gap: $spacing-x-smal;

  }

  &__label {
    font-family: "Inter", Sans-serif;
    font-size: 14px;
    font-weight: 600;
    color: $color-white;
    text-transform: uppercase;
    letter-spacing: 0.5px;
  }

         &__input,
         &__select {
           font-family: "Playfair Display", Sans-serif;
           font-size: 16px;
           padding: $spacing-middle;
           background-color: $color-bg-dark;
           color: $color-white;
           border: 2px solid transparent;
           border-radius: 4px;
           outline: none;
           transition: border-color 0.3s;

           &::placeholder {
             color: $color-grey;
           }

           &:focus {
             border-color: $color-pastel-gold;
           }

           &:disabled {
             opacity: 0.6;
             cursor: not-allowed;
           }
         }

         &__field--relative {
           position: relative;
         }

         &__suggestions {
           position: absolute;
           top: 100%;
           left: 0;
           right: 0;
           background-color: $color-bg-dark;
           border: 1px solid rgba($color-pastel-gold, 0.3);
           border-radius: 4px;
           max-height: 200px;
           overflow-y: auto;
           z-index: 1000;
           box-shadow: 0 4px 12px rgba(0, 0, 0, 0.3);
         }

         &__suggestion-item {
           padding: $spacing-middle;
           cursor: pointer;
           border-bottom: 1px solid rgba($color-grey, 0.2);
           transition: background-color 0.2s;

           &:hover {
             background-color: rgba($color-pastel-gold, 0.1);
           }

           &:last-child {
             border-bottom: none;
           }
         }

         &__suggestion-name {
           font-family: "Inter", Sans-serif;
           font-size: 14px;
           color: $color-white;
           margin-bottom: 2px;
         }

         &__suggestion-coords {
           font-family: "Inter", Sans-serif;
           font-size: 12px;
           color: $color-grey;
         }

         &__searching {
           position: absolute;
           top: 100%;
           left: 0;
           right: 0;
           background-color: $color-bg-dark;
           border: 1px solid rgba($color-pastel-gold, 0.3);
           border-radius: 4px;
           padding: $spacing-middle;
           display: flex;
           align-items: center;
           gap: $spacing-small;
           font-family: "Inter", Sans-serif;
           font-size: 14px;
           color: $color-grey;
           z-index: 1000;
         }

  &__actions {
    display: flex;
    gap: $spacing-middle;
    justify-content: center;
    flex-wrap: wrap;
  }

  // Результаты
  &__results {
    display: flex;
    flex-direction: column;
    gap: $spacing-middle;
  }

  &__subsection-title {
    font-family: "Playfair Display", Sans-serif;
    font-size: 22px;
    font-weight: 600;
    color: $color-white;
    margin: 0 0 $spacing-middle 0;
  }

  // Планеты
  &__planets-grid {
    display: flex;
    flex-wrap: wrap;
    gap: $spacing-middle;

    .natal-chart__planet-card {
      flex: 1;
      min-width: 200px;
    }
  }

  &__planet-card {
    background-color: $color-bg-dark;
    border-radius: 8px;
    padding: $spacing-middle;
    border: 2px solid transparent;
    transition: border-color 0.3s;

    &:hover {
      border-color: $color-pastel-gold;
    }
  }

  &__planet-header {
    display: flex;
    align-items: center;
    gap: $spacing-small;
    margin-bottom: $spacing-small;
  }

  &__planet-symbol {
    font-size: 24px;
  }

  &__planet-name {
    font-family: "Playfair Display", Sans-serif;
    font-size: 16px;
    font-weight: 600;
    color: $color-white;
  }

  &__retrograde {
    font-family: "Inter", Sans-serif;
    font-size: 12px;
    font-weight: 700;
    color: $color-gold;
    background-color: rgba($color-gold, 0.1);
    padding: 2px 4px;
    border-radius: 2px;
  }

  &__planet-position {
    display: flex;
    align-items: center;
    gap: $spacing-x-smal;
  }

  &__sign {
    font-size: 20px;
  }

  &__degree {
    font-family: "Inter", Sans-serif;
    font-size: 14px;
    color: $color-grey;
  }

  // Дома
  &__houses-grid {
    display: flex;
    flex-wrap: wrap;
    gap: $spacing-small;

    .natal-chart__house-card {
      flex: 1;
      min-width: 120px;
    }
  }

  &__house-card {
    background-color: $color-bg-dark;
    border-radius: 6px;
    padding: $spacing-small;
    text-align: center;
    border: 1px solid rgba($color-grey, 0.3);
  }

  &__house-number {
    font-family: "Playfair Display", Sans-serif;
    font-size: 18px;
    font-weight: 600;
    color: $color-pastel-gold;
    margin-bottom: $spacing-x-smal;
  }

  // Аспекты
  &__aspects-list {
    display: flex;
    flex-wrap: wrap;
    gap: $spacing-small;
  }

  &__aspect-item {
    display: flex;
    flex-grow: 1;
    flex-shrink: 0;
    flex-direction: column;
    gap: $spacing-x-smal;
    padding: $spacing-middle;
    background-color: $color-bg-dark;
    border-radius: 6px;
    border: 1px solid rgba($color-grey, 0.3);
    transition: border-color 0.3s;

    &--harmonious {
      border-color: rgba(#4CAF50, 0.5);
    }

    &--tense {
      border-color: rgba(#F44336, 0.5);
    }

    &--minor {
      border-color: rgba(#FF9800, 0.5);
    }

    &--neutral {
      border-color: rgba($color-pastel-gold, 0.5);
    }

    // Комбинированные стили для согласованности
    &--harmonious {
      &.--exact {
        border-color: #4CAF50;
        box-shadow: 0 0 0 1px rgba(#4CAF50, 0.3);
      }

      &.--medium {
        border-color: rgba(#4CAF50, 0.7);
      }
    }

    &--tense {
      &.--exact {
        border-color: #F44336;
        box-shadow: 0 0 0 1px rgba(#F44336, 0.3);
      }

      &.--medium {
        border-color: rgba(#F44336, 0.7);
      }
    }

    &--minor {
      &.--medium {
        border-color: #FF9800;
        box-shadow: 0 0 0 1px rgba(#FF9800, 0.3);
      }
    }
  }

  &__aspect-main {
    display: flex;
    align-items: center;
    gap: $spacing-middle;
  }

  &__aspect-symbols {
    display: flex;
    align-items: center;
    gap: 4px;
    font-size: 18px;
    font-weight: bold;
  }

  &__aspect-symbol {
    margin: 0 2px;
  }

  &__aspect-planets {
    flex: 1;
    font-family: "Inter", Sans-serif;
    font-size: 14px;
    color: $color-white;
  }

  &__aspect-details {
    display: flex;
    align-items: center;
    gap: $spacing-middle;
    flex-wrap: wrap;
  }

  &__aspect-type {
    font-weight: 600;
    color: $color-pastel-gold;
  }

  &__aspect-angle {
    font-family: "Inter", Sans-serif;
    font-size: 12px;
    color: $color-grey;
  }

  &__aspect-strength {
    font-family: "Inter", Sans-serif;
    font-size: 12px;
    padding: 2px 6px;
    border-radius: 3px;
    text-transform: uppercase;
    font-weight: 500;

    &--exact {
      background-color: rgba(#4CAF50, 0.2);
      color: #4CAF50;
    }

    &--medium {
      background-color: rgba(#FF9800, 0.2);
      color: #FF9800;
    }

    &--weak {
      background-color: rgba(#F44336, 0.2);
      color: #F44336;
    }
  }

  &__aspect-orb {
    font-family: "Inter", Sans-serif;
    font-size: 12px;
    color: $color-grey;
  }

  &__visualization {
    text-align: center;
  }

  &__interpretation-button {
    text-align: center;
  }


  &__info-text {
    font-size: 14px;
    line-height: 1.5;
    color: $color-white;
  }

  &__engine-link {
    color: $color-primary;
    text-decoration: none;
    font-weight: 500;
    border-bottom: 1px solid transparent;
    transition: border-color 0.2s ease;

    &:hover {
      border-bottom-color: $color-primary;
    }
  }

  &__help-links {
    display: flex;
    justify-content: center;
    gap: $spacing-middle;

    @media (max-width: 768px) {
      flex-direction: column;
      align-items: center;
      gap: $spacing-small;
    }
  }

  &__details-link,
  &__help-link {
    background: none;
    border: none;
    color: $color-primary;
    font-size: 14px;
    font-weight: 500;
    cursor: pointer;
    text-decoration: underline;
    padding: $spacing-x-smal $spacing-small;
    transition: opacity 0.2s ease;
    border-radius: 4px;

    &:hover {
      opacity: 0.8;
      background-color: rgba($color-primary, 0.05);
    }
  }
}

@keyframes shake {
  0%, 100% {
    transform: translateX(0);
  }
  25% {
    transform: translateX(-10px);
  }
  75% {
    transform: translateX(10px);
  }
}
</style>
