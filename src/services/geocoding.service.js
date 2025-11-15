/**
 * Сервис геокодинга для определения координат по названию места
 */

const NOMINATIM_BASE_URL = 'https://nominatim.openstreetmap.org';

/**
 * Поиск координат по названию места
 * @param {string} placeName - Название места (город, страна)
 * @returns {Promise<{lat: number, lng: number, display_name: string}[]>}
 */
export async function geocodePlace(placeName) {
  if (!placeName || !placeName.trim()) {
    throw new Error('Название места не может быть пустым');
  }

  try {
    const query = encodeURIComponent(placeName.trim());
    const url = `${NOMINATIM_BASE_URL}/search?format=json&q=${query}&limit=5&addressdetails=1`;

    const response = await fetch(url);

    if (!response.ok) {
      throw new Error(`Ошибка HTTP: ${response.status}`);
    }

    const data = await response.json();

    if (!Array.isArray(data) || data.length === 0) {
      throw new Error('Место не найдено. Попробуйте уточнить название.');
    }

    // Возвращаем результаты с координатами
    return data.map(result => ({
      lat: parseFloat(result.lat),
      lng: parseFloat(result.lon),
      display_name: result.display_name,
      place_id: result.place_id,
      type: result.type,
      importance: result.importance
    }));

  } catch (error) {
    console.error('Ошибка геокодинга:', error);

    if (error.message.includes('HTTP')) {
      throw new Error('Ошибка подключения к сервису геокодинга');
    }

    throw error;
  }
}

/**
 * Обратный геокодинг - определение названия места по координатам
 * @param {number} lat - Широта
 * @param {number} lng - Долгота
 * @returns {Promise<{display_name: string, address: Object}>}
 */
export async function reverseGeocode(lat, lng) {
  try {
    const url = `${NOMINATIM_BASE_URL}/reverse?format=json&lat=${lat}&lon=${lng}&addressdetails=1`;

    const response = await fetch(url);

    if (!response.ok) {
      throw new Error(`Ошибка HTTP: ${response.status}`);
    }

    const data = await response.json();

    if (data.error) {
      throw new Error('Не удалось определить место по координатам');
    }

    return {
      display_name: data.display_name,
      address: data.address,
      lat: parseFloat(data.lat),
      lng: parseFloat(data.lon)
    };

  } catch (error) {
    console.error('Ошибка обратного геокодинга:', error);
    throw error;
  }
}

/**
 * Валидация координат
 * @param {number} lat - Широта (-90 до 90)
 * @param {number} lng - Долгота (-180 до 180)
 * @returns {boolean}
 */
export function validateCoordinates(lat, lng) {
  const numLat = parseFloat(lat);
  const numLng = parseFloat(lng);

  return (
    !isNaN(numLat) && !isNaN(numLng) &&
    numLat >= -90 && numLat <= 90 &&
    numLng >= -180 && numLng <= 180
  );
}

/**
 * Форматирование координат для отображения
 * @param {number} lat - Широта
 * @param {number} lng - Долгота
 * @returns {string}
 */
export function formatCoordinates(lat, lng) {
  const formatCoord = (coord, positive, negative) => {
    const abs = Math.abs(coord);
    const degrees = Math.floor(abs);
    const minutes = Math.floor((abs - degrees) * 60);
    const seconds = Math.round(((abs - degrees) * 60 - minutes) * 60);

    return `${degrees}°${minutes}'${seconds}" ${coord >= 0 ? positive : negative}`;
  };

  return `${formatCoord(lat, 'N', 'S')}, ${formatCoord(lng, 'E', 'W')}`;
}

/**
 * Расчет расстояния между двумя точками (формула гаверсинуса)
 * @param {number} lat1 - Широта первой точки
 * @param {number} lng1 - Долгота первой точки
 * @param {number} lat2 - Широта второй точки
 * @param {number} lng2 - Долгота второй точки
 * @returns {number} Расстояние в километрах
 */
export function calculateDistance(lat1, lng1, lat2, lng2) {
  const R = 6371; // Радиус Земли в километрах
  const dLat = (lat2 - lat1) * Math.PI / 180;
  const dLng = (lng2 - lng1) * Math.PI / 180;

  const a = Math.sin(dLat / 2) * Math.sin(dLat / 2) +
            Math.cos(lat1 * Math.PI / 180) * Math.cos(lat2 * Math.PI / 180) *
            Math.sin(dLng / 2) * Math.sin(dLng / 2);

  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  return R * c;
}
