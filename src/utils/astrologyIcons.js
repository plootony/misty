/**
 * Маппинг астрологических символов на иконки
 * Использует коллекцию иконок из @iconify/vue
 */

export const ASTROLOGY_ICONS = {
  // Планеты
  '☉': 'solar:sun-bold',           // Солнце
  '☽': 'solar:moon-bold',          // Луна
  '☿': 'solar:planet-bold',        // Меркурий
  '♀': 'solar:heart-bold',         // Венера
  '♂': 'solar:shield-bold',        // Марс
  '♃': 'solar:star-bold',          // Юпитер
  '♄': 'solar:ring-bold',          // Сатурн
  '⛢': 'solar:bolt-bold',          // Уран
  '♆': 'solar:water-wave-bold',    // Нептун
  '♇': 'solar:triangle-bold',      // Плутон
  '☊': 'solar:arrow-up-bold',      // Северный узел
  '⚷': 'solar:cross-bold',         // Хирон

  // Знаки зодиака (используем коллекцию zodiac)
  '♈': 'zodiac:aries',             // Овен
  '♉': 'zodiac:taurus',            // Телец
  '♊': 'zodiac:gemini',            // Близнецы
  '♋': 'zodiac:cancer',            // Рак
  '♌': 'zodiac:leo',               // Лев
  '♍': 'zodiac:virgo',             // Дева
  '♎': 'zodiac:libra',             // Весы
  '♏': 'zodiac:scorpio',           // Скорпион
  '♐': 'zodiac:sagittarius',       // Стрелец
  '♑': 'zodiac:capricorn',         // Козерог
  '♒': 'zodiac:aquarius',          // Водолей
  '♓': 'zodiac:pisces',            // Рыбы

  // Аспекты (используем простые геометрические фигуры)
  '☌': 'solar:record-circle-bold', // Соединение
  '⚺': 'solar:record-circle-bold', // Полусекстиль
  '⚹': 'solar:hexagon-bold',       // Секстиль
  '□': 'solar:square-bold',        // Квадратура
  '△': 'solar:triangle-bold',      // Трион
  '☍': 'solar:arrows-expand-bold', // Оппозиция
  '∠': 'solar:chevron-right-bold', // Семиквадрат
  '∟': 'solar:pentagon-bold',      // Квинтиль
  '∴': 'solar:dots-bold',          // Тридециль
  '⊕': 'solar:plus-circle-bold',   // Бинонагон
  '⚻': 'solar:slash-circle-bold',  // Квинкункс
};

/**
 * Получить иконку для астрологического символа
 * @param {string} symbol - Астрологический символ
 * @returns {string} - Название иконки из @iconify/vue (формат "collection:name")
 */
export function getAstrologyIcon(symbol) {
  return ASTROLOGY_ICONS[symbol] || 'bi:circle'; // fallback
}

/**
 * Получить имя иконки для Vue компонента
 * @param {string} symbol - Астрологический символ
 * @returns {string} - Имя иконки для VIcon компонента
 */
export function getIconName(symbol) {
  const iconName = getAstrologyIcon(symbol);
  return iconName.replace(':', '-'); // bi:sun -> bi-sun
}

/**
 * Проверить, есть ли иконка для символа
 * @param {string} symbol - Астрологический символ
 * @returns {boolean}
 */
export function hasAstrologyIcon(symbol) {
  return symbol in ASTROLOGY_ICONS;
}
