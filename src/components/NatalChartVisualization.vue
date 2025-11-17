<template>
  <div class="natal-chart-visualization">
    <svg
      :width="size"
      :height="size"
      :viewBox="`0 0 ${CHART_SIZE} ${CHART_SIZE}`"
      class="natal-chart-svg"
    >
      <!-- Внешний круг -->
      <circle
        cx="200"
        cy="200"
        :r="outerRadius"
        fill="none"
        stroke="#D4AF37"
        stroke-width="2"
      />

      <!-- Внутренний круг -->
      <circle
        cx="200"
        cy="200"
        :r="innerRadius"
        fill="none"
        stroke="#D4AF37"
        stroke-width="1"
        opacity="0.5"
      />

      <!-- Линии градусов (каждые 5°) -->
      <g v-for="i in 72" :key="'degree-' + i">
        <line
          :x1="200 + Math.cos((i * 5 - 90) * Math.PI / 180) * outerRadius"
          :y1="200 + Math.sin((i * 5 - 90) * Math.PI / 180) * outerRadius"
          :x2="200 + Math.cos((i * 5 - 90) * Math.PI / 180) * innerRadius"
          :y2="200 + Math.sin((i * 5 - 90) * Math.PI / 180) * innerRadius"
          stroke="#D4AF37"
          stroke-width="0.5"
          opacity="0.3"
        />
      </g>

      <!-- Знаки зодиака -->
      <g v-for="i in 12" :key="'sign-' + i">
        <text
          :x="200 + Math.cos((i * 30 + 15 - 90) * Math.PI / 180) * (outerRadius - 15)"
          :y="200 + Math.sin((i * 30 + 15 - 90) * Math.PI / 180) * (outerRadius - 15)"
          :font-size="14"
          fill="#D4AF37"
          text-anchor="middle"
          dominant-baseline="middle"
        >
          {{ zodiacSigns[i]?.symbol || '♈' }}
        </text>
      </g>

      <!-- Планеты -->
      <g v-for="i in (planetsData?.length || 0)" :key="'planet-' + i">
        <template v-if="planetsData[i] && planetsData[i].longitude !== undefined && planetsData[i].longitude !== null && isValidLongitude(planetsData[i].longitude)">
          <circle
            :cx="200 + Math.cos((planetsData[i].longitude - 90) * Math.PI / 180) * planetRadius"
            :cy="200 + Math.sin((planetsData[i].longitude - 90) * Math.PI / 180) * planetRadius"
            r="6"
            :fill="planetsData[i].retrograde ? '#FF6B6B' : '#4ECDC4'"
            stroke="#D4AF37"
            stroke-width="1"
          />
          <text
            :x="200 + Math.cos((planetsData[i].longitude - 90) * Math.PI / 180) * planetRadius"
            :y="200 + Math.sin((planetsData[i].longitude - 90) * Math.PI / 180) * planetRadius"
            font-size="10"
            fill="#fff"
            text-anchor="middle"
            dominant-baseline="middle"
            font-weight="bold"
          >
            {{ planetsData[i].symbol }}
          </text>
        </template>
      </g>

      <!-- Дома -->
      <g v-for="i in (housesData?.length || 0)" :key="'house-' + i">
        <template v-if="housesData[i] && housesData[i].cusp !== undefined && housesData[i].cusp !== null && isValidLongitude(housesData[i].cusp)">
          <line
            :x1="200 + Math.cos((housesData[i].cusp - 90) * Math.PI / 180) * innerRadius"
            :y1="200 + Math.sin((housesData[i].cusp - 90) * Math.PI / 180) * innerRadius"
            :x2="200 + Math.cos((housesData[i].cusp - 90) * Math.PI / 180) * outerRadius"
            :y2="200 + Math.sin((housesData[i].cusp - 90) * Math.PI / 180) * outerRadius"
            stroke="#FFD700"
            stroke-width="2"
            opacity="1"
          />
          <text
            :x="200 + Math.cos((housesData[i].cusp - 90) * Math.PI / 180) * (innerRadius - 10)"
            :y="200 + Math.sin((housesData[i].cusp - 90) * Math.PI / 180) * (innerRadius - 10)"
            font-size="10"
            fill="#FFD700"
            text-anchor="middle"
            dominant-baseline="middle"
            font-weight="bold"
          >
            {{ housesData[i].number }}
          </text>
        </template>
      </g>

      <!-- Аспекты (линии между планетами) -->
      <g v-for="i in Math.min(aspectsData?.length || 0, 5)" :key="'aspect-' + i">
        <template v-if="aspectsData[i] && aspectsData[i].planet1 && aspectsData[i].planet2 && isValidLongitude(getPlanetLongitude(aspectsData[i].planet1)) && isValidLongitude(getPlanetLongitude(aspectsData[i].planet2))">
          <line
            :x1="200 + Math.cos((getPlanetLongitude(aspectsData[i].planet1) - 90) * Math.PI / 180) * planetRadius"
            :y1="200 + Math.sin((getPlanetLongitude(aspectsData[i].planet1) - 90) * Math.PI / 180) * planetRadius"
            :x2="200 + Math.cos((getPlanetLongitude(aspectsData[i].planet2) - 90) * Math.PI / 180) * planetRadius"
            :y2="200 + Math.sin((getPlanetLongitude(aspectsData[i].planet2) - 90) * Math.PI / 180) * planetRadius"
            :stroke="getAspectColor(aspectsData[i].aspectElement)"
            stroke-width="3"
            opacity="0.8"
            stroke-dasharray="5,5"
          />
        </template>
      </g>

      <!-- Центр круга -->
      <circle cx="200" cy="200" r="3" fill="#D4AF37" />
    </svg>
  </div>
</template>

<script setup>
import { computed, ref, watch } from 'vue';
import { ZODIAC_SIGNS } from '@/services/natalChart.service';

// Props
const props = defineProps({
  planets: {
    type: Array,
    default: () => []
  },
  houses: {
    type: Array,
    default: () => []
  },
  aspects: {
    type: Array,
    default: () => []
  },
  size: {
    type: Number,
    default: 400
  }
});

// Реактивные данные с начальными значениями
const zodiacSigns = ref(ZODIAC_SIGNS || []);
const planetsData = ref(props.planets || []);
const housesData = ref(props.houses || []);
const aspectsData = ref(props.aspects || []);

// Следим за изменениями props и обновляем реактивные данные
watch(() => props.planets, (newPlanets) => {
  planetsData.value = newPlanets || [];
}, { immediate: true });

watch(() => props.houses, (newHouses) => {
  housesData.value = newHouses || [];
}, { immediate: true });

watch(() => props.aspects, (newAspects) => {
  aspectsData.value = newAspects || [];
}, { immediate: true });

// Константы для размеров круга
const CHART_SIZE = 400;
const CENTER_X = CHART_SIZE / 2; // 200
const CENTER_Y = CHART_SIZE / 2; // 200
const OUTER_RADIUS = 180;
const INNER_RADIUS = 120;
const PLANET_RADIUS = 140;

const outerRadius = computed(() => OUTER_RADIUS);
const innerRadius = computed(() => INNER_RADIUS);
const planetRadius = computed(() => PLANET_RADIUS);

// Функция для получения долготы планеты по имени
const getPlanetLongitude = (planetName) => {
  if (!planetsData.value || !Array.isArray(planetsData.value)) {
    return 0;
  }
  const planet = planetsData.value.find(p => p.name === planetName);
  return planet && isValidLongitude(planet.longitude) ? planet.longitude : 0;
};

// Функция для проверки валидности долготы
const isValidLongitude = (longitude) => {
  return longitude !== null && longitude !== undefined && !isNaN(longitude) && longitude >= 0 && longitude <= 360;
};

// Функция для определения цвета аспекта
const getAspectColor = (aspectElement) => {
  const colors = {
    'harmonious': '#4CAF50',
    'tense': '#F44336',
    'minor': '#FF9800',
    'neutral': '#D4AF37'
  };
  return colors[aspectElement] || '#D4AF37';
};
</script>

<style scoped lang="scss">
.natal-chart-visualization {
  display: flex;
  justify-content: center;
  align-items: center;
  padding: 20px;
  background: radial-gradient(circle, rgba(26, 26, 30, 0.8) 0%, rgba(10, 10, 12, 0.9) 100%);
  border-radius: 12px;
  box-shadow: 0 8px 32px rgba(0, 0, 0, 0.3);
}

.natal-chart-svg {
  filter: drop-shadow(0 4px 8px rgba(212, 175, 55, 0.2));
}
</style>
