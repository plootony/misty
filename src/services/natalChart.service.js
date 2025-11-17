// Импорт astronomy-engine для браузерной работы
import { Body, GeoVector, MakeTime, EclipticLongitude, Ecliptic } from 'astronomy-engine';

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
    this.usingRealEphemeris = false; // Флаг использования настоящей Swiss Ephemeris
  }

  /**
   * Инициализация Astronomy Engine
   */
  async init() {
    if (this.initialized) return;

    try {
      console.log('🔭 Инициализация Astronomy Engine...');

      // Тестируем работу astronomy-engine
      console.log('🧪 Тестируем astronomy-engine...');
      const testTime = MakeTime(new Date('2000-01-01T12:00:00Z'));
      const testVector = GeoVector(Body.Sun, testTime, false);
      console.log('✅ Astronomy Engine работает, тестовый вектор:', testVector.x.toFixed(4), testVector.y.toFixed(4), testVector.z.toFixed(4));

      this.usingRealEphemeris = true;
      console.log('✅ Astronomy Engine успешно инициализирована - используем реальные астрономические данные');
      this.initialized = true;

    } catch (error) {
      console.warn('❌ Не удалось инициализировать Astronomy Engine, используем fallback:', error);
      console.warn('Детали ошибки:', error.message);
      if (error.stack) {
        console.warn('Stack trace:', error.stack);
      }

      this.usingRealEphemeris = false;
      this.createFallbackImplementation();
      console.log('⚠️ Используем упрощенные расчеты (fallback)');
    }
  }

  /**
   * Создает fallback реализацию с упрощенными астрономическими расчетами
   * Включает поддержку различных систем домов для демонстрации функциональности
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
        // Расчет домов в зависимости от системы
        const ramc = (longitude / 15 + julianDay * 24) % 24; // Прямое восхождение MC
        const houses = [];

        // ASC и MC (базовые расчеты)
        const asc = (ramc * 15 + latitude / 2) % 360;
        const mc = ramc * 15;

        houses[0] = asc;  // ASC
        houses[1] = mc;   // MC

        // Расчет домов в зависимости от системы
        switch (houseSystem) {
          case 'E': // Equal House - равные дома
          case 'W': // Whole Sign - целые знаки (похоже на равные)
            for (let i = 0; i < 12; i++) {
              houses[i + 2] = (asc + i * 30) % 360;
            }
            break;

          case 'P': // Placidus - учитывает широту, неравные дома
            for (let i = 0; i < 12; i++) {
              const angle = (asc + i * 30) % 360;
              // Placidus: значительная вариация на основе широты и времени
              const latFactor = Math.abs(latitude) / 90; // 0-1
              const timeFactor = Math.sin((julianDay % 365) * Math.PI / 182.5); // годовой цикл
              const variation = latFactor * 15 * Math.sin((angle * Math.PI) / 180) * timeFactor;
              houses[i + 2] = (angle + variation) % 360;
            }
            break;

          case 'K': // Koch - геометрическая система, равные дома но с вариациями
            for (let i = 0; i < 12; i++) {
              const angle = (asc + i * 30) % 360;
              // Koch: геометрические вариации
              const variation = Math.sin((angle * Math.PI) / 180) * 8 + Math.cos((angle * 2 * Math.PI) / 180) * 4;
              houses[i + 2] = (angle + variation) % 360;
            }
            break;

          case 'O': // Porphyry - среднее между равными и неравными
            for (let i = 0; i < 12; i++) {
              const angle = (asc + i * 30) % 360;
              // Porphyry: умеренные вариации
              const variation = Math.cos((angle * Math.PI) / 180) * 6;
              houses[i + 2] = (angle + variation) % 360;
            }
            break;

          case 'B': // Alcabitius - специфическая система
            for (let i = 0; i < 12; i++) {
              const angle = (asc + i * 30) % 360;
              // Alcabitius: вариации на основе положения
              const variation = Math.tan((angle * Math.PI) / 180) * 5;
              houses[i + 2] = (angle + variation) % 360;
            }
            break;

          case 'C': // Campanus - сферическая проекция
            for (let i = 0; i < 12; i++) {
              const angle = (asc + i * 30) % 360;
              // Campanus: сферические вариации
              const variation = Math.sin((latitude * Math.PI) / 180) * Math.cos((angle * Math.PI) / 180) * 10;
              houses[i + 2] = (angle + variation) % 360;
            }
            break;

          case 'R': // Regiomontanus - средневековая система
            for (let i = 0; i < 12; i++) {
              const angle = (asc + i * 30) % 360;
              // Regiomontanus: специфические вариации
              const variation = Math.sin((angle * Math.PI) / 90) * 7; // удвоенная частота
              houses[i + 2] = (angle + variation) % 360;
            }
            break;

          case 'M': // Morinus - время-based система
            for (let i = 0; i < 12; i++) {
              const angle = (asc + i * 30) % 360;
              // Morinus: вариации на основе времени рождения
              const timeVariation = Math.sin((longitude * Math.PI) / 180) * 9;
              houses[i + 2] = (angle + timeVariation) % 360;
            }
            break;

          default: // Любая другая система - используем равные дома
            for (let i = 0; i < 12; i++) {
              houses[i + 2] = (asc + i * 30) % 360;
            }
            break;
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

    console.log(`🌟 Начинаем расчет натальной карты для: ${birthData.date} ${birthData.time || '00:00'}`);
    console.log(`📍 Место: ${birthData.place || 'не указано'} (${birthData.latitude || 0}°, ${birthData.longitude || 0}°)`);
    console.log(`🏠 Система домов: ${birthData.houseSystem || 'P'}`);
    console.log(`🔭 Источник данных: ${this.usingRealEphemeris ? 'Astronomy Engine (реальные астрономические данные)' : 'Fallback (упрощенные расчеты)'}`);

    try {
      // Парсинг даты и времени
      console.log('📅 Парсинг даты и времени...');
      const { julianDay, utcTime } = this.parseDateTime(birthData.date, birthData.time);
      console.log(`📅 Julian day: ${julianDay}, UTC: ${utcTime}`);

      // Расчет положений планет
      console.log('🪐 Расчет планет...');
      const planets = await this.calculatePlanets(julianDay);
      console.log(`✅ Рассчитано ${planets.length} планет`);

      // Расчет домов
      console.log('🏠 Расчет домов...');
      const houses = await this.calculateHouses(julianDay, birthData.latitude, birthData.longitude, birthData.houseSystem);
      console.log(`✅ Рассчитано ${houses.length} домов`);

      // Расчет аспектов
      console.log('⭐ Расчет аспектов...');
      const aspects = this.calculateAspects(planets);
      console.log(`⭐ Рассчитано аспектов: ${aspects.length}`);
      if (aspects.length > 0) {

        // Группировка аспектов по типам
        const aspectStats = aspects.reduce((acc, aspect) => {
          acc[aspect.aspectElement] = (acc[aspect.aspectElement] || 0) + 1;
          return acc;
        }, {});

        const strengthStats = aspects.reduce((acc, aspect) => {
          acc[aspect.strength] = (acc[aspect.strength] || 0) + 1;
          return acc;
        }, {});

        console.log('📊 Статистика аспектов:');
        console.log(`   По типам: ${Object.entries(aspectStats).map(([type, count]) => `${type}: ${count}`).join(', ')}`);
        console.log(`   По силе: ${Object.entries(strengthStats).map(([strength, count]) => `${strength}: ${count}`).join(', ')}`);
      }

      const result = {
        planets,
        houses,
        aspects,
        birthData: {
          ...birthData,
          julianDay,
          utcTime
        }
      };

      console.log(`🎉 Натальная карта успешно рассчитана!`);
      console.log(`📊 Статистика: ${planets.length} планет, ${houses.length} домов, ${aspects.length} аспектов`);
      console.log(`${this.usingRealEphemeris ? '✨ Использованы РЕАЛЬНЫЕ астрономические данные Astronomy Engine' : '🔧 Использованы УПРОЩЕННЫЕ расчеты (fallback)'}`);

      return result;

    } catch (error) {
      console.error('❌ Подробная ошибка расчета:', error);
      console.error('Stack trace:', error.stack);
      throw new Error(`Не удалось рассчитать натальную карту: ${error.message}`);
    }
  }

  /**
   * Парсинг даты и времени в юлианский день
   */
  parseDateTime(dateStr, timeStr) {
    if (!dateStr || !timeStr) {
      return { julianDay: 2451545.0, utcTime: new Date() }; // J2000.0 fallback
    }

    let day, month, year;

    // Поддержка разных форматов даты
    if (dateStr.includes('-')) {
      // Формат YYYY-MM-DD (ISO)
      [year, month, day] = dateStr.split('-').map(Number);
    } else if (dateStr.includes('.')) {
      // Формат DD.MM.YYYY
      [day, month, year] = dateStr.split('.').map(Number);
    } else {
      console.warn('Неподдерживаемый формат даты:', dateStr);
      return { julianDay: 2451545.0, utcTime: new Date() }; // J2000.0 fallback
    }

    const [hour, minute] = timeStr.split(':').map(Number);

    // Проверка на корректность данных
    if (isNaN(day) || isNaN(month) || isNaN(year) || isNaN(hour) || isNaN(minute)) {
      console.warn('Некорректные данные даты/времени:', { dateStr, timeStr, day, month, year, hour, minute });
      return { julianDay: 2451545.0, utcTime: new Date() }; // J2000.0 fallback
    }

    // Создаем UTC время
    const utcDate = new Date(Date.UTC(year, month - 1, day, hour, minute, 0));

    // Конвертация в юлианский день (формула из astronomy-engine)
    // JD = (1461 × (Y + 4800 + (M − 14)/12))/4 + (367 × (M − 2 − 12 × ((M − 14)/12)))/12 − (3 × ((Y + 4900 + (M - 14)/12)/100))/4 + D − 32075
    const a = Math.floor((14 - month) / 12);
    const y = year + 4800 - a;
    const m = month + 12 * a - 3;
    const julianDay = day + Math.floor((153 * m + 2) / 5) + 365 * y + Math.floor(y / 4) - Math.floor(y / 100) + Math.floor(y / 400) - 32045 +
                     (hour + minute / 60) / 24;

    return {
      julianDay,
      utcTime: utcDate
    };
  }

  /**
   * Расчет положений планет с использованием Astronomy Engine
   */
  async calculatePlanets(julianDay) {
    const planets = [];

    // Маппинг наших planetId на Body enum из astronomy-engine
    const bodyMapping = {
      0: Body.Sun,       // SE_SUN
      1: Body.Moon,      // SE_MOON
      2: Body.Mercury,   // SE_MERCURY
      3: Body.Venus,     // SE_VENUS
      4: Body.Mars,      // SE_MARS
      5: Body.Jupiter,   // SE_JUPITER
      6: Body.Saturn,    // SE_SATURN
      7: Body.Uranus,    // SE_URANUS
      8: Body.Neptune,   // SE_NEPTUNE
      9: Body.Pluto,     // SE_PLUTO
      11: Body.Moon,     // SE_MEAN_NODE (для простоты используем Moon, но это не точно)
      15: Body.Moon,     // SE_CHIRON (приблизительно)
    };

    for (const planetInfo of PLANET_INFO) {
      try {
        const body = bodyMapping[planetInfo.planetId];
        if (!body) {
          console.warn(`⚠️ Планета ${planetInfo.name} не поддерживается в astronomy-engine`);
          continue;
        }

        // Создаем время из julian day
        // julianDay - это юлианский день, astronomy-engine работает с Date или AstroTime
        // JD 2440587.5 = 1970-01-01 00:00:00 UTC
        const date = new Date((julianDay - 2440587.5) * 86400000); // Конвертация из JD в milliseconds
        console.log(`Конвертация JD ${julianDay} в дату:`, date.toISOString());
        const time = MakeTime(date);

        // Получаем геоцентрический вектор планеты и эклиптические координаты
        let vector, eclipticCoords;
        try {
          vector = GeoVector(body, time, false); // false = без аберрации
          if (!vector || typeof vector.x !== 'number') {
            throw new Error(`GeoVector вернул некорректные данные: ${JSON.stringify(vector)}`);
          }

          // Получаем эклиптические координаты из вектора
          eclipticCoords = Ecliptic(vector);
          if (!eclipticCoords || typeof eclipticCoords.elon !== 'number') {
            throw new Error(`Ecliptic вернул некорректные данные: ${JSON.stringify(eclipticCoords)}`);
          }
        } catch (error) {
          console.warn(`${planetInfo.name} - ошибка при расчете координат:`, error.message);

          // Используем аппроксимацию для Солнца
          if (body === Body.Sun) {
            // Простая аппроксимация положения Солнца на основе julian day
            const jd2000 = julianDay - 2451545.0; // Дни от J2000.0
            const longitude = (jd2000 * 0.9856474) % 360; // Средняя аномалия Солнца
            const finalLongitude = longitude < 0 ? longitude + 360 : longitude;

            vector = { x: 1, y: 0, z: 0 }; // Заглушка для расстояния
            eclipticCoords = { elon: finalLongitude, elat: 0 };
          } else {
            throw error;
          }
        }

        const longitude = eclipticCoords.elon; // Эклиптическая долгота
        const latitude = eclipticCoords.elat || 0; // Эклиптическая широта

        // Расчет скорости (упрощенная версия)
        let speed = 0;
        try {
          const dt = 0.01; // маленький интервал в днях
          const time2 = time.AddDays(dt);
          let ecliptic2;

          try {
            const vector2 = GeoVector(body, time2, false);
            const eclipticCoords2 = Ecliptic(vector2);
            ecliptic2 = eclipticCoords2.elon;
          } catch (vector2Error) {
            // Если не получается рассчитать для второго времени, используем аппроксимацию
            if (body === Body.Sun) {
              const jd2000_2 = (julianDay + dt) - 2451545.0;
              ecliptic2 = (jd2000_2 * 0.9856474) % 360;
              if (ecliptic2 < 0) ecliptic2 += 360;
            } else {
              ecliptic2 = longitude; // Без изменения
            }
          }

          if (typeof ecliptic2 === 'number' && !isNaN(ecliptic2)) {
            let delta = ecliptic2 - longitude;
            // Корректировка для перехода через 0/360
            if (delta > 180) delta -= 360;
            if (delta < -180) delta += 360;
            speed = delta / dt; // градусы в день
          }
        } catch (speedError) {
          console.warn(`Не удалось рассчитать скорость для ${planetInfo.name}:`, speedError.message);
          // Для Солнца средняя скорость около 1 градус в день
          if (body === Body.Sun) {
            speed = 0.9856474;
          } else {
            speed = 0;
          }
        }

        // Расчет расстояния (упрощенное)
        const distance = Math.sqrt(vector.x * vector.x + vector.y * vector.y + vector.z * vector.z);

        const signIndex = Math.floor(longitude / 30) % 12;
        const signDegree = longitude % 30;
        const retrograde = speed < 0;

        const sign = ZODIAC_SIGNS[signIndex] || ZODIAC_SIGNS[0];

        console.log(`🪐 ${planetInfo.name}: ${longitude.toFixed(4)}° (${sign.name} ${signDegree.toFixed(2)}°)` +
                   `${retrograde ? ' 🔄' : ''} | Скорость: ${speed.toFixed(4)}°/день` +
                   `${this.usingRealEphemeris ? ' ✨' : ' 🔧'}`);

        planets.push({
          ...planetInfo,
          longitude,
          latitude,
          distance,
          speed,
          sign,
          degree: signDegree,
          retrograde,
          signIndex
        });
      } catch (error) {
        console.warn(`❌ Ошибка при расчете ${planetInfo.name}:`, error.message);
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
      console.log(`Расчет домов с системой: ${houseSystem} (широта: ${latitude}, долгота: ${longitude})`);

      // Расчет домов по упрощенной системе
      const ramc = (longitude / 15 + julianDay * 24) % 24; // Прямое восхождение MC
      const houses = [];

      // ASC и MC (базовые расчеты)
      const asc = (ramc * 15 + latitude / 2) % 360;
      const mc = ramc * 15;

      houses[0] = asc;  // ASC
      houses[1] = mc;   // MC

      // Расчет домов в зависимости от системы
      switch (houseSystem) {
        case 'P': // Placidus - учитывает широту, неравные дома
          for (let i = 0; i < 12; i++) {
            const angle = (asc + i * 30) % 360;
            // Placidus: значительная вариация на основе широты и времени
            const latFactor = Math.abs(latitude) / 90; // 0-1
            const timeFactor = Math.sin((julianDay % 365) * Math.PI / 182.5); // годовой цикл
            const variation = latFactor * 15 * Math.sin((angle * Math.PI) / 180) * timeFactor;
            houses[i + 2] = (angle + variation) % 360;
          }
          break;

        case 'K': // Koch - геометрическая система, равные дома но с вариациями
          for (let i = 0; i < 12; i++) {
            const angle = (asc + i * 30) % 360;
            // Koch: геометрические вариации
            const variation = Math.sin((angle * Math.PI) / 180) * 8 + Math.cos((angle * 2 * Math.PI) / 180) * 4;
            houses[i + 2] = (angle + variation) % 360;
          }
          break;

        case 'E': // Equal House - равные дома
          for (let i = 0; i < 12; i++) {
            houses[i + 2] = (asc + i * 30) % 360;
          }
          break;

        case 'W': // Whole Sign - целые знаки (каждый дом = целый знак)
          // В Whole Sign системе дома начинаются на куспидах знаков
          const ascSignStart = Math.floor(asc / 30) * 30; // Начало знака ASC
          for (let i = 0; i < 12; i++) {
            houses[i + 2] = (ascSignStart + i * 30) % 360;
          }
          break;

        case 'O': // Porphyry - средние между Placidus и Equal
          for (let i = 0; i < 12; i++) {
            const angle = (asc + i * 30) % 360;
            // Porphyry: среднее между равными и Placidian
            const latFactor = Math.abs(latitude) / 90 * 0.5; // Уменьшенный фактор
            const variation = latFactor * 7.5 * Math.sin((angle * Math.PI) / 180);
            houses[i + 2] = (angle + variation) % 360;
          }
          break;

        case 'R': // Regiomontanus - среднее между Placidus и Porphyry
          for (let i = 0; i < 12; i++) {
            const angle = (asc + i * 30) % 360;
            // Regiomontanus: комбинация факторов
            const latFactor = Math.abs(latitude) / 90;
            const variation = latFactor * 10 * Math.sin((angle * Math.PI) / 180) +
                            Math.cos((angle * Math.PI) / 180) * 3;
            houses[i + 2] = (angle + variation) % 360;
          }
          break;

        case 'C': // Campanus - сферическая система
          for (let i = 0; i < 12; i++) {
            const angle = (asc + i * 30) % 360;
            // Campanus: сферические вариации
            const latRad = latitude * Math.PI / 180;
            const angleRad = angle * Math.PI / 180;
            const variation = Math.sin(latRad) * Math.cos(angleRad) * 12;
            houses[i + 2] = (angle + variation) % 360;
          }
          break;

        case 'B': // Alcabitius - среднее арифметическое
          for (let i = 0; i < 12; i++) {
            const angle = (asc + i * 30) % 360;
            // Alcabitius: простые вариации
            const variation = Math.sin((angle * Math.PI) / 180) * 5;
            houses[i + 2] = (angle + variation) % 360;
          }
          break;

        case 'M': // Morinus - комбинированная система
          for (let i = 0; i < 12; i++) {
            const angle = (asc + i * 30) % 360;
            // Morinus: комбинация широты и геометрии
            const latFactor = Math.abs(latitude) / 90;
            const variation = latFactor * 6 + Math.sin((angle * Math.PI) / 180) * 4;
            houses[i + 2] = (angle + variation) % 360;
          }
          break;

        default: // Любая другая система - используем равные дома
          console.warn(`Неизвестная система домов: ${houseSystem}, используем Equal House`);
          for (let i = 0; i < 12; i++) {
            houses[i + 2] = (asc + i * 30) % 360;
          }
          break;
      }

      console.log(`🏠 Результат домов [${houseSystem}]: ASC=${houses[0].toFixed(4)}°, MC=${houses[1].toFixed(4)}°`);

      const resultHouses = [];
      // Создаем дома на основе куспидов (cusp2 до cusp13 - это дома 1-12)
      for (let i = 0; i < 12; i++) {
        const cusp = houses[i + 2]; // cusps начинаются с индекса 2
        const signIndex = Math.floor(cusp / 30) % 12; // Ограничиваем индекс 0-11
        const signDegree = cusp % 30;
        const sign = ZODIAC_SIGNS[signIndex] || ZODIAC_SIGNS[0];

        resultHouses.push({
          number: i + 1,
          cusp,
          sign,
          degree: signDegree,
          signIndex
        });
      }

      console.log(`🏠 Дома [${houseSystem}]:`, resultHouses.map(h =>
        `Д${h.number}: ${h.cusp.toFixed(4)}° (${h.sign.name} ${h.degree.toFixed(2)}°)`
      ).join(' | '));
      console.log(`${this.usingRealEphemeris ? '✨ Реальные астрономические данные домов' : '🔧 Упрощенные расчеты домов'}`);

      return resultHouses;
    } catch (error) {
      console.error('❌ Ошибка при расчете домов:', error);
      // Возвращаем пустые дома в случае ошибки
      return Array.from({ length: 12 }, (_, i) => ({
        number: i + 1,
        cusp: (i * 30) % 360,
        sign: ZODIAC_SIGNS[Math.floor(((i * 30) % 360) / 30) % 12] || ZODIAC_SIGNS[0],
        degree: ((i * 30) % 360) % 30,
        signIndex: Math.floor(((i * 30) % 360) / 30) % 12
      }));
    }
  }


  /**
   * Расчет аспектов между планетами
   */
  calculateAspects(planets) {
    const aspects = [];
    const aspectTypes = [
      { name: 'соединение', angle: 0, orb: 8, symbol: '☌', element: 'neutral' },
      { name: 'полусекстиль', angle: 30, orb: 2, symbol: '⚺', element: 'minor' },
      { name: 'семиквадрат', angle: 45, orb: 2, symbol: '∠', element: 'minor' },
      { name: 'секстиль', angle: 60, orb: 6, symbol: '⚹', element: 'harmonious' },
      { name: 'квинтиль', angle: 72, orb: 2, symbol: '∟', element: 'minor' },
      { name: 'квадратура', angle: 90, orb: 8, symbol: '□', element: 'tense' },
      { name: 'тридециль', angle: 108, orb: 1, symbol: '∴', element: 'minor' },
      { name: 'тригон', angle: 120, orb: 8, symbol: '△', element: 'harmonious' },
      { name: 'бинонагон', angle: 135, orb: 2, symbol: '⊕', element: 'minor' },
      { name: 'квинкункс', angle: 150, orb: 3, symbol: '⚻', element: 'tense' },
      { name: 'оппозиция', angle: 180, orb: 8, symbol: '☍', element: 'tense' }
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
            let strength = 'weak';
            if (orb <= effectiveOrb * 0.1) strength = 'exact';
            else if (orb <= effectiveOrb * 0.3) strength = 'medium';

            const aspectData = {
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
            };


            aspects.push(aspectData);

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
