<template>
  <VIcon
    :icon="iconName"
    :class="iconClass"
    :width="iconSize"
    :height="iconSize"
    v-bind="$attrs"
  />
</template>

<script setup>
import { computed } from 'vue'
import { getAstrologyIcon } from '@/utils/astrologyIcons'

const props = defineProps({
  symbol: {
    type: String,
    required: true
  },
  class: {
    type: String,
    default: ''
  },
  scale: {
    type: [Number, String],
    default: 1
  },
  size: {
    type: [Number, String],
    default: 24
  }
})

const iconName = computed(() => {
  return getAstrologyIcon(props.symbol)
})

const iconClass = computed(() => {
  return `astrology-icon astrology-icon--${props.symbol.replace(/[^\w]/g, '')} ${props.class}`.trim()
})

const iconSize = computed(() => {
  const baseSize = typeof props.size === 'string' ? parseInt(props.size) : props.size
  const scaleFactor = typeof props.scale === 'string' ? parseFloat(props.scale) : props.scale
  return Math.round(baseSize * scaleFactor)
})
</script>

<style scoped>
.astrology-icon {
  display: inline-block;
  vertical-align: middle;
  transition: all 0.2s ease;
}

/* Специфические стили для разных типов символов */
.astrology-icon--sun {
  color: #ffd700; /* золотой */
}

.astrology-icon--moon {
  color: #c0c0c0; /* серебристый */
}

.astrology-icon--mars {
  color: #dc143c; /* красный */
}

.astrology-icon--venus {
  color: #ff69b4; /* розовый */
}

.astrology-icon--jupiter {
  color: #daa520; /* золотистый */
}

.astrology-icon--saturn {
  color: #708090; /* серый */
}

.astrology-icon--uranus {
  color: #00ced1; /* бирюзовый */
}

.astrology-icon--neptune {
  color: #4169e1; /* королевский синий */
}

.astrology-icon--pluto {
  color: #8b4513; /* коричневый */
}

/* Знаки зодиака */
.astrology-icon--aries,
.astrology-icon--leo,
.astrology-icon--sagittarius {
  color: #ff4500; /* огненные знаки */
}

.astrology-icon--taurus,
.astrology-icon--virgo,
.astrology-icon--capricorn {
  color: #228b22; /* земные знаки */
}

.astrology-icon--gemini,
.astrology-icon--libra,
.astrology-icon--aquarius {
  color: #4169e1; /* воздушные знаки */
}

.astrology-icon--cancer,
.astrology-icon--scorpio,
.astrology-icon--pisces {
  color: #0000cd; /* водные знаки */
}
</style>
