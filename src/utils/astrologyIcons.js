/**
 * Маппинг астрологических символов на иконки
 * Использует коллекцию иконок из @iconify/vue
 */

export const ASTROLOGY_ICONS = {
  // Планеты (используем коллекцию bi - Bootstrap Icons)
  '☉': 'bi:sun',                   // Солнце
  '☽': 'bi:moon',                  // Луна
  '☿': 'bi:gear',                  // Меркурий (шестеренка)
  '♀': 'bi:heart',                 // Венера (сердце)
  '♂': 'bi:shield',                // Марс (щит)
  '♃': 'bi:star',                  // Юпитер (звезда)
  '♄': 'bi:circle',                // Сатурн (круг)
  '⛢': 'bi:lightning',             // Уран (молния)
  '♆': 'bi:water',                 // Нептун (вода)
  '♇': 'bi:triangle',              // Плутон (треугольник)
  '☊': 'bi:arrow-up',              // Северный узел (стрелка вверх)
  '⚷': 'bi:cross',                 // Хирон (крест)

  // Знаки зодиака (простые геометрические фигуры)
  '♈': 'bi:fire',                  // Овен (огонь)
  '♉': 'bi:square',                // Телец (квадрат)
  '♊': 'bi:people',                // Близнецы (люди)
  '♋': 'bi:house',                 // Рак (дом)
  '♌': 'bi:star',                  // Лев (звезда)
  '♍': 'bi:check-circle',          // Дева (галочка)
  '♎': 'bi:balance',               // Весы (весы)
  '♏': 'bi:bug',                   // Скорпион (жук)
  '♐': 'bi:arrow-right',           // Стрелец (стрела)
  '♑': 'bi:mountain',              // Козерог (гора)
  '♒': 'bi:cloud',                 // Водолей (облако)
  '♓': 'bi:water',                 // Рыбы (вода)

  // Аспекты (геометрические фигуры)
  '☌': 'bi:circle',                // Соединение (круг)
  '⚺': 'bi:record-circle',         // Полусекстиль (круг с точкой)
  '⚹': 'bi:hexagon',               // Секстиль (шестиугольник)
  '□': 'bi:square',                // Квадратура (квадрат)
  '△': 'bi:triangle',              // Трион (треугольник)
  '☍': 'bi:arrows-expand',         // Оппозиция (расширяющиеся стрелки)
  '∠': 'bi:chevron-right',         // Семиквадрат (шеврон)
  '∟': 'bi:pentagon',              // Квинтиль (пятиугольник)
  '∴': 'bi:three-dots',            // Тридециль (три точки)
  '⊕': 'bi:plus-circle',           // Бинонагон (плюс в круге)
  '⚻': 'bi:slash-circle',          // Квинкункс (перечеркнутый круг)
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
