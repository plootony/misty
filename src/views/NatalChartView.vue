<script setup>
import { ref, onMounted } from 'vue';
import { useUserStore } from '@/stores/user.store';
import natalChartService, { ZODIAC_SIGNS, PLANET_INFO } from '@/services/natalChart.service';
import { geocodePlace, validateCoordinates, formatCoordinates } from '@/services/geocoding.service';
import ButtonSpinner from '@/components/ButtonSpinner.vue';
import NatalChartVisualization from '@/components/NatalChartVisualization.vue';

const userStore = useUserStore();

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

// Сброс результатов
const resetChart = () => {
  natalChart.value = null;
  error.value = '';
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
      <div class="natal-chart__form-section">
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
                <option value="P">Placidus (Плацидус)</option>
                <option value="K">Koch (Кох)</option>
                <option value="E">Equal House (Равнодомная)</option>
                <option value="W">Whole Sign (Целый знак)</option>
              </select>
            </div>
          </div>

          <div class="natal-chart__actions">
            <button
              class="btn btn--primary natal-chart__calculate-btn"
              @click="calculateNatalChart"
              :disabled="isCalculating"
            >
              <ButtonSpinner v-if="isCalculating" />
              <span>{{ isCalculating ? 'Рассчитываем...' : 'Рассчитать натальную карту' }}</span>
            </button>

            <button
              v-if="natalChart"
              class="btn btn--secondary"
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
                :class="`natal-chart__aspect-item--${aspect.aspectElement || 'нейтральный'}`"
              >
                <div class="natal-chart__aspect-main">
                  <span class="natal-chart__aspect-symbols">
                    {{ aspect.planet1Symbol || '☉' }} {{ aspect.aspectSymbol || '☌' }} {{ aspect.planet2Symbol || '☽' }}
                  </span>
                  <span class="natal-chart__aspect-planets">
                    {{ aspect.planet1 }} ↔ {{ aspect.planet2 }}
                  </span>
                </div>
                <div class="natal-chart__aspect-details">
                  <span class="natal-chart__aspect-type">{{ aspect.aspect }}</span>
                  <span class="natal-chart__aspect-angle">({{ aspect.angle }}°)</span>
                  <span v-if="aspect.strength" class="natal-chart__aspect-strength" :class="`natal-chart__aspect-strength--${aspect.strength}`">
                    {{ aspect.strength }}
                  </span>
                  <span class="natal-chart__aspect-orb">{{ aspect.orb ? aspect.orb.toFixed(1) : '0.0' }}'</span>
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
    gap: $spacing-large;
  }

  &__form-section,
  &__results-section {
    background-color: $color-bg-light;
    border-radius: 12px;
    padding: $spacing-large;
    box-shadow: 0px 15px 35px 0px rgba(10, 10, 12, 0.3215686274509804);
  }

  &__form {
    display: flex;
    flex-direction: column;
    gap: $spacing-large;
  }

  &__section-title {
    font-family: "Playfair Display", Sans-serif;
    font-size: 28px;
    font-weight: 600;
    color: $color-white;
    margin: 0 0 $spacing-middle 0;
    text-align: center;
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
    display: grid;
    grid-template-columns: repeat(auto-fit, minmax(250px, 1fr));
    gap: $spacing-middle;
  }

  &__field {
    display: flex;
    flex-direction: column;
    gap: $spacing-x-smal;

    &--full {
      grid-column: 1 / -1;
    }
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

  &__calculate-btn {
    min-width: 200px;
  }

  // Результаты
  &__results {
    display: flex;
    flex-direction: column;
    gap: $spacing-large;
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
    display: grid;
    grid-template-columns: repeat(auto-fit, minmax(200px, 1fr));
    gap: $spacing-middle;
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
    display: grid;
    grid-template-columns: repeat(auto-fit, minmax(120px, 1fr));
    gap: $spacing-small;
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
    flex-direction: column;
    gap: $spacing-small;
  }

  &__aspect-item {
    display: flex;
    flex-direction: column;
    gap: $spacing-x-smal;
    padding: $spacing-middle;
    background-color: $color-bg-dark;
    border-radius: 6px;
    border: 1px solid rgba($color-grey, 0.3);
    transition: border-color 0.3s;

    &--гармоничный {
      border-color: rgba(#4CAF50, 0.5);
    }

    &--напряженный {
      border-color: rgba(#F44336, 0.5);
    }

    &--минорный {
      border-color: rgba(#FF9800, 0.5);
    }

    &--нейтральный {
      border-color: rgba($color-pastel-gold, 0.5);
    }
  }

  &__aspect-main {
    display: flex;
    align-items: center;
    gap: $spacing-middle;
  }

  &__aspect-symbols {
    font-size: 18px;
    font-weight: bold;
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

    &--точный {
      background-color: rgba(#4CAF50, 0.2);
      color: #4CAF50;
    }

    &--средний {
      background-color: rgba(#FF9800, 0.2);
      color: #FF9800;
    }

    &--слабый {
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
    margin-top: $spacing-large;
    text-align: center;
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
