/**
 * Утилита для надёжного парсинга JSON из ответов AI
 * Обрабатывает случаи, когда JSON обёрнут в markdown code blocks
 */

// Регулярные выражения для оптимизации
const MARKDOWN_CODE_BLOCK_START = /^```(?:json|JSON)?\s*\n?/i;
const MARKDOWN_CODE_BLOCK_END = /\n?```\s*$/i;
const JSON_OBJECT_PATTERN = /\{[\s\S]*\}/;

/**
 * Очищает текст от markdown code blocks и парсит JSON
 * Также может конвертировать обычный текст в JSON структуру для валидации
 * @param {string} text - Текст, который может содержать JSON
 * @returns {Object} - Распарсенный JSON объект
 * @throws {Error} - Если не удалось распарсить JSON
 */
export function parseAIResponse(text) {
    if (!text || typeof text !== 'string') {
        throw new Error('Некорректный входной текст');
    }

    let cleanText = text.trim();

    // Удаляем markdown code blocks за один проход
    if (cleanText.startsWith('```')) {
        cleanText = cleanText
            .replace(MARKDOWN_CODE_BLOCK_START, '')
            .replace(MARKDOWN_CODE_BLOCK_END, '')
            .trim();
    }

    // Пытаемся распарсить очищенный текст
    try {
        return JSON.parse(cleanText);
    } catch (firstError) {
        // Если не получилось, пытаемся найти JSON в тексте
        const jsonMatch = cleanText.match(JSON_OBJECT_PATTERN);

        if (jsonMatch) {
            try {
                return JSON.parse(jsonMatch[0]);
            } catch (secondError) {
                throw new Error(`Не удалось распарсить JSON: ${secondError.message}`);
            }
        }

        // Fallback: конвертируем обычный текст в JSON
        const parsedFromText = parseValidationTextToJSON(cleanText);
        if (parsedFromText) {
            return parsedFromText;
        }

        throw new Error(`JSON не найден в тексте: ${firstError.message}`);
    }
}

// Константы для анализа текста валидации
const VALID_QUESTION_INDICATORS = [
    'вопрос подходит', 'подходит для', 'валиден', 'хорошо', 'да', 'yes', 'valid',
    'можно', 'приемлемо', 'подходящий', 'корректный'
];

const INVALID_QUESTION_INDICATORS = [
    'не подходит', 'неподходящий', 'запрещено', 'нельзя', 'нет', 'no', 'invalid',
    'невалиден', 'отсутствие', 'проблема', 'ошибка', 'неправильно'
];

/**
 * Конвертирует обычный текст в JSON структуру для валидации вопросов
 * @param {string} text - Обычный текст ответа AI
 * @returns {Object} - JSON объект с результатом валидации
 */
function parseValidationTextToJSON(text) {
    const lowerText = text.toLowerCase().trim();

    const hasValid = VALID_QUESTION_INDICATORS.some(indicator => lowerText.includes(indicator));
    const hasInvalid = INVALID_QUESTION_INDICATORS.some(indicator => lowerText.includes(indicator));

    // Возвращаем результат валидации на основе анализа текста
    return hasInvalid || !hasValid ? {
        isValid: false,
        reason: "Вопрос не подходит для гадания на Таро",
        suggestion: "Пожалуйста, задайте вопрос о вашей ситуации или проблеме, которую вы хотели бы проанализировать с помощью карт Таро."
    } : {
        isValid: true,
        reason: null,
        suggestion: null
    };
}

/**
 * Валидирует структуру ответа валидации
 * @param {Object} data - Объект для валидации
 * @returns {boolean} - true если структура корректна
 */
export function isValidValidationResponse(data) {
    if (!data || typeof data !== 'object') {
        return false;
    }

    // Проверяем наличие обязательного поля isValid
    if (typeof data.isValid !== 'boolean') {
        return false;
    }

    // Если isValid === false, должны быть reason или suggestion
    if (data.isValid === false) {
        if (!data.reason && !data.suggestion) {
            return false;
        }
    }

    return true;
}

/**
 * Нормализует ответ валидации, добавляя отсутствующие поля
 * @param {Object} data - Объект для нормализации
 * @returns {Object} - Нормализованный объект
 */
export function normalizeValidationResponse(data) {
    return {
        isValid: data.isValid === true,
        reason: data.reason || null,
        suggestion: data.suggestion || null
    };
}
