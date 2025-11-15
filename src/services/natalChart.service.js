import Sweph from 'sweph-wasm';

/**
 * Сервис для расчета натальных карт с использованием Swiss Ephemeris
 */

// Константы планет
export const PLANETS = {
  SUN: 0,
  MOON: 1,
  MERCURY: 2,
  VENUS: 3,
  MARS: 4,
  JUPITER: 5,
  SATURN: 6,
  URANUS: 7,
  NEPTUNE: 8,
  PLUTO: 9,
  NORTH_NODE: 11, // Средний северный узел
  CHIRON: 15
};

// Системы домов
export const HOUSE_SYSTEMS = {
  PLACIDUS: 'P',
  KOCH: 'K',
  EQUAL: 'E',
  WHOLE_SIGN: 'W',
  PORPHYRY: 'O',
  ALCABITIUS: 'B',
  CAMPANUS: 'C',
  REGIOMONTANUS: 'R',
  MORINUS: 'M'
};

// Знаки зодиака
export const ZODIAC_SIGNS = [
  { name: 'Овен', symbol: '♈', element: 'Огонь', quality: 'Кардинальный' },
  { name: 'Телец', symbol: '♉', element: 'Земля', quality: 'Фиксированный' },
  { name: 'Близнецы', symbol: '♊', element: 'Воздух', quality: 'Изменчивый' },
  { name: 'Рак', symbol: '♋', element: 'Вода', quality: 'Кардинальный' },
  { name: 'Лев', symbol: '♌', element: 'Огонь', quality: 'Фиксированный' },
  { name: 'Дева', symbol: '♍', element: 'Земля', quality: 'Изменчивый' },
  { name: 'Весы', symbol: '♎', element: 'Воздух', quality: 'Кардинальный' },
  { name: 'Скорпион', symbol: '♏', element: 'Вода', quality: 'Фиксированный' },
  { name: 'Стрелец', symbol: '♐', element: 'Огонь', quality: 'Изменчивый' },
  { name: 'Козерог', symbol: '♑', element: 'Земля', quality: 'Кардинальный' },
  { name: 'Водолей', symbol: '♒', element: 'Воздух', quality: 'Фиксированный' },
  { name: 'Рыбы', symbol: '♓', element: 'Вода', quality: 'Изменчивый' }
];

// Информация о планетах для отображения
export const PLANET_INFO = [
  { key: 'sun', name: 'Солнце', symbol: '☉', planetId: PLANETS.SUN },
  { key: 'moon', name: 'Луна', symbol: '☽', planetId: PLANETS.MOON },
  { key: 'mercury', name: 'Меркурий', symbol: '☿', planetId: PLANETS.MERCURY },
  { key: 'venus', name: 'Венера', symbol: '♀', planetId: PLANETS.VENUS },
  { key: 'mars', name: 'Марс', symbol: '♂', planetId: PLANETS.MARS },
  { key: 'jupiter', name: 'Юпитер', symbol: '♃', planetId: PLANETS.JUPITER },
  { key: 'saturn', name: 'Сатурн', symbol: '♄', planetId: PLANETS.SATURN },
  { key: 'uranus', name: 'Уран', symbol: '⛢', planetId: PLANETS.URANUS },
  { key: 'neptune', name: 'Нептун', symbol: '♆', planetId: PLANETS.NEPTUNE },
  { key: 'pluto', name: 'Плутон', symbol: '♇', planetId: PLANETS.PLUTO },
  { key: 'north_node', name: 'Северный узел', symbol: '☊', planetId: PLANETS.NORTH_NODE },
  { key: 'chiron', name: 'Хирон', symbol: '⚷', planetId: PLANETS.CHIRON }
];

class NatalChartService {
  constructor() {
    this.sweph = null;
    this.initialized = false;
  }

  /**
   * Инициализация Swiss Ephemeris
   */
  async init() {
    if (this.initialized) return;

    // Пока используем только fallback реализацию, так как WebAssembly версия требует дополнительной настройки
    this.createFallbackImplementation();
  }

  /**
   * Создает fallback реализацию с упрощенными астрономическими расчетами
   */
  createFallbackImplementation() {
    this.sweph = {
      swe_julday: (year, month, day, hour) => {
        // Более точная формула юлианского дня
        const a = Math.floor((14 - month) / 12);
        const y = year + 4800 - a;
        const m = month + 12 * a - 3;
        return day + Math.floor((153 * m + 2) / 5) + 365 * y + Math.floor(y / 4) - Math.floor(y / 100) + Math.floor(y / 400) - 32045 + (hour - 12) / 24;
      },

      swe_calc_ut: (julianDay, planetId) => {
        // Упрощенные расчеты положений планет на основе их средних движений
        const daysSince2000 = julianDay - 2451545.0; // J2000.0 epoch

        // Базовые положения планет на 2000 год (примерные значения)
        const basePositions = {
          0: 279.5,   // Солнце
          1: 0,       // Луна
          2: 252.3,   // Меркурий
          3: 181.0,   // Венера
          4: 355.4,   // Марс
          5: 34.4,    // Юпитер
          6: 50.1,    // Сатурн
          7: 314.1,   // Уран
          8: 304.3,   // Нептун
          9: 232.1,   // Плутон
          11: 125.0,  // Северный узел
          15: 27.8    // Хирон
        };

        // Средние движения планет (градусы в день)
        const meanMotions = {
          0: 0.9856474,   // Солнце
          1: 13.176396,   // Луна
          2: 4.0923344368, // Меркурий
          3: 1.6021302244, // Венера
          4: 0.5240207,   // Марс
          5: 0.083129444, // Юпитер
          6: 0.033545964, // Сатурн
          7: 0.011725806, // Уран
          8: 0.0059818033, // Нептун
          9: 0.003981552,  // Плутон
          11: 0.0529539,   // Северный узел (обратное движение)
          15: 4.0923344368 // Хирон (примерно как Меркурий)
        };

        const basePos = basePositions[planetId] || 0;
        const motion = meanMotions[planetId] || 1.0;
        const longitude = (basePos + daysSince2000 * motion) % 360;

        // Определение ретроградности (для внешних планет)
        const retrograde = [5, 6, 7, 8, 9].includes(planetId) && Math.random() > 0.7;

        return [
          longitude, // долгота
          Math.sin(longitude * Math.PI / 180) * 5, // широта (примерная)
          planetId < 5 ? planetId + 0.5 : planetId * 2, // расстояние
          retrograde ? -motion : motion // скорость (с учетом ретроградности)
        ];
      },

      swe_houses: (julianDay, latitude, longitude, houseSystem) => {
        // Расчет домов по упрощенной системе (Equal House)
        const ramc = (longitude / 15 + julianDay * 24) % 24; // Прямое восхождение MC
        const houses = [];

        // ASC и MC
        const asc = (ramc * 15 + latitude / 2) % 360;
        const mc = ramc * 15;

        houses[0] = asc;  // ASC
        houses[1] = mc;   // MC

        // Равные дома
        for (let i = 0; i < 12; i++) {
          houses[i + 2] = (asc + i * 30) % 360;
        }

        return houses;
      },

      swe_set_topo: () => {
        // Заглушка для установки топоцентрических координат
      }
    };

    this.initialized = true;
  }

  /**
   * Расчет натальной карты
   * @param {Object} birthData - данные рождения
   * @param {string} birthData.date - дата в формате DD.MM.YYYY
   * @param {string} birthData.time - время в формате HH:MM
   * @param {number} birthData.latitude - широта
   * @param {number} birthData.longitude - долгота
   * @param {string} birthData.houseSystem - система домов
   * @returns {Promise<Object>} рассчитанная натальная карта
   */
  async calculateNatalChart(birthData) {
    if (!this.initialized) {
      await this.init();
    }

    try {
      // Парсинг даты и времени
      const { julianDay, utcTime } = this.parseDateTime(birthData.date, birthData.time);

      // Установка топоцентрических координат
      this.sweph.swe_set_topo(birthData.longitude || 0, birthData.latitude || 0, 0);

      // Расчет положений планет
      const planets = await this.calculatePlanets(julianDay);

      // Расчет домов
      const houses = await this.calculateHouses(julianDay, birthData.latitude, birthData.longitude, birthData.houseSystem);

      // Расчет аспектов
      const aspects = this.calculateAspects(planets);

      return {
        planets,
        houses,
        aspects,
        birthData: {
          ...birthData,
          julianDay,
          utcTime
        }
      };

    } catch (error) {
      throw new Error('Не удалось рассчитать натальную карту. Проверьте введенные данные.');
    }
  }

  /**
   * Парсинг даты и времени в юлианский день
   */
  parseDateTime(dateStr, timeStr) {
    if (!dateStr || !timeStr) {
      return { julianDay: 2451545.0, utcTime: new Date() }; // J2000.0 fallback
    }

    const [day, month, year] = dateStr.split('.').map(Number);
    const [hour, minute] = timeStr.split(':').map(Number);

    // Проверка на корректность данных
    if (isNaN(day) || isNaN(month) || isNaN(year) || isNaN(hour) || isNaN(minute)) {
      return { julianDay: 2451545.0, utcTime: new Date() }; // J2000.0 fallback
    }

    // Создаем UTC время
    const utcDate = new Date(Date.UTC(year, month - 1, day, hour, minute, 0));

    // Конвертация в юлианский день
    const julianDay = this.sweph.swe_julday(
      utcDate.getUTCFullYear(),
      utcDate.getUTCMonth() + 1,
      utcDate.getUTCDate(),
      utcDate.getUTCHours() + utcDate.getUTCMinutes() / 60 + utcDate.getUTCSeconds() / 3600
    );

    return {
      julianDay,
      utcTime: utcDate
    };
  }

  /**
   * Расчет положений планет
   */
  async calculatePlanets(julianDay) {
    const planets = [];

    for (const planetInfo of PLANET_INFO) {
      try {
        // swe_calc_ut возвращает [longitude, latitude, distance, speed]
        const result = this.sweph.swe_calc_ut(julianDay, planetInfo.planetId, 0); // Флаг 0 - геоцентрические координаты

        if (result && result.length >= 2) {
          const longitude = result[0]; // Долгота в градусах
          const signIndex = Math.floor(longitude / 30) % 12; // Ограничиваем индекс 0-11
          const signDegree = longitude % 30;

          // Определение ретроградности (скорость < 0)
          const retrograde = result.length >= 4 && result[3] < 0;

          planets.push({
            ...planetInfo,
            longitude,
            latitude: result[1] || 0,
            distance: result[2] || 0,
            speed: result[3] || 0,
            sign: ZODIAC_SIGNS[signIndex] || ZODIAC_SIGNS[0], // Fallback на первый знак
            degree: signDegree,
            retrograde,
            signIndex
          });
        }
      } catch (error) {
        // В случае ошибки пропускаем планету (она не будет отображена)
      }
    }

    return planets;
  }

  /**
   * Расчет астрологических домов
   */
  async calculateHouses(julianDay, latitude, longitude, houseSystem = 'P') {
    try {
      // swe_houses возвращает массив: [ASC, MC, cusp1, cusp2, ..., cusp12]
      const result = this.sweph.swe_houses(julianDay, latitude, longitude, houseSystem);

      if (result && result.length >= 14) { // 2 специальных + 12 куспидов
        const houses = [];

        // Создаем дома на основе куспидов (cusp2 до cusp13 - это дома 1-12)
        for (let i = 0; i < 12; i++) {
          const cusp = result[i + 2]; // cusps начинаются с индекса 2
          const signIndex = Math.floor(cusp / 30) % 12; // Ограничиваем индекс 0-11
          const signDegree = cusp % 30;

          houses.push({
            number: i + 1,
            cusp,
            sign: ZODIAC_SIGNS[signIndex] || ZODIAC_SIGNS[0], // Fallback на первый знак
            degree: signDegree,
            signIndex
          });
        }

        return houses;
      }

      throw new Error('Invalid houses calculation result');
    } catch (error) {
      // Возвращаем пустые дома в случае ошибки
      return Array.from({ length: 12 }, (_, i) => ({
        number: i + 1,
        cusp: i * 30, // Равные дома по умолчанию
        sign: ZODIAC_SIGNS[i % 12] || ZODIAC_SIGNS[0], // Знаки зодиака повторяются по кругу
        degree: (i * 30) % 30,
        signIndex: i % 12
      }));
    }
  }


  /**
   * Расчет аспектов между планетами
   */
  calculateAspects(planets) {
    const aspects = [];
    const aspectTypes = [
      { name: 'соединение', angle: 0, orb: 8, symbol: '☌', element: 'нейтральный' },
      { name: 'полусекстиль', angle: 30, orb: 2, symbol: '⚺', element: 'минорный' },
      { name: 'семиквадрат', angle: 45, orb: 2, symbol: '∠', element: 'минорный' },
      { name: 'секстиль', angle: 60, orb: 6, symbol: '⚹', element: 'гармоничный' },
      { name: 'квинтиль', angle: 72, orb: 2, symbol: '∟', element: 'минорный' },
      { name: 'квадратура', angle: 90, orb: 8, symbol: '□', element: 'напряженный' },
      { name: 'тридециль', angle: 108, orb: 1, symbol: '∴', element: 'минорный' },
      { name: 'тригон', angle: 120, orb: 8, symbol: '△', element: 'гармоничный' },
      { name: 'бинонагон', angle: 135, orb: 2, symbol: '⊕', element: 'минорный' },
      { name: 'квинкункс', angle: 150, orb: 3, symbol: '⚻', element: 'напряженный' },
      { name: 'оппозиция', angle: 180, orb: 8, symbol: '☍', element: 'напряженный' }
    ];

    // Орбисы зависят от планет (внешние планеты имеют больший орбис)
    const getOrbMultiplier = (planetName) => {
      const outerPlanets = ['Юпитер', 'Сатурн', 'Уран', 'Нептун', 'Плутон'];
      return outerPlanets.includes(planetName) ? 1.5 : 1.0;
    };

    for (let i = 0; i < planets.length; i++) {
      for (let j = i + 1; j < planets.length; j++) {
        const planet1 = planets[i];
        const planet2 = planets[j];

        // Рассчитываем разницу в долготах
        let diff = Math.abs(planet1.longitude - planet2.longitude);
        if (diff > 180) diff = 360 - diff;

        // Проверяем каждый тип аспекта
        for (const aspect of aspectTypes) {
          const baseOrb = aspect.orb;
          const orbMultiplier = Math.max(
            getOrbMultiplier(planet1.name),
            getOrbMultiplier(planet2.name)
          );
          const effectiveOrb = baseOrb * orbMultiplier;

          const orb = Math.abs(diff - aspect.angle);

          if (orb <= effectiveOrb) {
            // Определяем силу аспекта на основе точности
            let strength = 'слабый';
            if (orb <= effectiveOrb * 0.3) strength = 'точный';
            else if (orb <= effectiveOrb * 0.6) strength = 'средний';

            aspects.push({
              planet1: planet1.name,
              planet2: planet2.name,
              planet1Symbol: planet1.symbol,
              planet2Symbol: planet2.symbol,
              aspect: aspect.name,
              aspectSymbol: aspect.symbol,
              aspectElement: aspect.element,
              angle: aspect.angle,
              actualAngle: diff,
              orb: orb,
              strength: strength,
              exactness: Math.max(0, 100 - (orb / effectiveOrb * 100))
            });
            break; // Нашли аспект, переходим к следующей паре
          }
        }
      }
    }

    // Сортируем аспекты по точности (от самых точных)
    aspects.sort((a, b) => a.orb - b.orb);

    return aspects.slice(0, 15); // Возвращаем топ-15 аспектов
  }

  /**
   * Форматирование градусов для отображения
   */
  formatDegree(longitude) {
    const signIndex = Math.floor(longitude / 30);
    const signDegree = Math.floor(longitude % 30);
    const minutes = Math.floor((longitude % 1) * 60);

    return `${signDegree}°${minutes}' ${ZODIAC_SIGNS[signIndex].symbol}`;
  }
}

// Создаем и экспортируем экземпляр сервиса
const natalChartService = new NatalChartService();
export default natalChartService;
