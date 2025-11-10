import { Mistral } from '@mistralai/mistralai';
import { mistralRateLimiter } from '@/utils/rateLimiter';
import { parseAIResponse, normalizeValidationResponse, isValidValidationResponse } from '@/utils/jsonParser';

// Инициализация клиента Mistral AI
let mistralClient = null;

const initMistralClient = () => {
    if (!mistralClient) {
        const apiKey = import.meta.env.VITE_MISTRAL_API_KEY;
        if (!apiKey) {
            throw new Error('VITE_MISTRAL_API_KEY не установлен в переменных окружения');
        }
        mistralClient = new Mistral({ apiKey });
    }
    return mistralClient;
};

/**
 * Валидация вопроса пользователя на соответствие теме Таро и эзотерики
 * @param {string} question - Вопрос пользователя
 * @returns {Promise<{isValid: boolean, reason?: string, suggestion?: string}>}
 */
export async function validateTarotQuestion(question) {
    // Используем rate limiter для соблюдения ограничения 1 запрос/3 секунды
    return mistralRateLimiter.execute(async () => {
        try {
            const client = initMistralClient();

            const systemPrompt = `Ты эксперт по Таро, эзотерике и мистике. Твоя задача - определить, подходит ли вопрос для гадания на картах Таро.

ПОДХОДЯЩИЕ вопросы:
- О личной жизни, отношениях, любви
- О карьере, работе, финансах
- О личностном росте, духовном развитии
- О будущем, прошлом, настоящем
- О принятии решений
- О внутреннем состоянии, эмоциях
- О жизненном пути и предназначении
- О здоровье (в общем смысле, не медицинские диагнозы)

НЕ ПОДХОДЯЩИЕ вопросы:
- Технические вопросы (программирование, математика, физика)
- Фактологические вопросы (столицы, даты, исторические факты)
- Медицинские диагнозы
- Юридические консультации
- Вопросы не по теме (рецепты, спорт, погода и т.д.)
- Оскорбительные или неуважительные вопросы
- Вопросы о причинении вреда

ВАЖНО: Ответь ТОЛЬКО чистым JSON без markdown форматирования, без обёрток типа \`\`\`json.
Формат ответа:
{
  "isValid": true,
  "reason": "краткая причина (если не валиден)",
  "suggestion": "предложение как переформулировать (если не валиден)"
}`;

            const apiCall = async () => {
                const result = await client.chat.complete({
                    model: 'mistral-small-latest',
                    messages: [
                        {
                            role: 'system',
                            content: systemPrompt
                        },
                        {
                            role: 'user',
                            content: `Проанализируй вопрос: "${question}"`
                        }
                    ],
                    temperature: 0.3, // Низкая температура для более предсказуемых результатов
                    response_format: { type: 'json_object' },
                    max_tokens: 300
                });

                const response = result.choices[0].message.content;

                // Парсинг JSON с использованием утилиты
                const validation = parseAIResponse(response);

                // Валидация структуры ответа
                if (!isValidValidationResponse(validation)) {
                    console.warn('Некорректная структура ответа:', validation);
                    throw new Error('Некорректная структура ответа от AI');
                }

                // Нормализация и возврат результата
                return normalizeValidationResponse(validation);
            };

            return await executeWithRetry(apiCall, 2, 10000);

        } catch (error) {
            console.error('Ошибка валидации вопроса:', error);

            // В случае ошибки API возвращаем fallback валидацию с соответствующим сообщением
            const errorMessage = createErrorMessage(error).replace('Попробуйте', 'Валидация пропущена. Попробуйте');

            return {
                isValid: true, // Разрешаем по умолчанию, чтобы не блокировать пользователя
                reason: null,
                suggestion: null,
                error: errorMessage
            };
        }
    });
}


/**
 * Создает пользовательское сообщение об ошибке на основе типа ошибки
 * @param {Error} error - Ошибка от API
 * @returns {string} - Пользовательское сообщение об ошибке
 */
function createErrorMessage(error) {
    const errorMessage = error.message?.toLowerCase() || '';
    const errorCode = error.code || error.status;

    if (errorMessage.includes('rate limit') || errorMessage.includes('too many requests') || errorCode === 429) {
        return 'Превышен лимит запросов к сервису предсказаний. Попробуйте через несколько минут.';
    }

    if (errorMessage.includes('service tier capacity exceeded') || errorMessage.includes('capacity exceeded')) {
        return 'Сервис временно перегружен или достигнут лимит использования. Попробуйте через несколько минут. Если проблема persists, проверьте баланс Mistral AI.';
    }

    if (errorMessage.includes('insufficient balance') || errorMessage.includes('billing')) {
        return 'Недостаточно средств на счете Mistral AI. Проверьте баланс и пополните счет.';
    }

    if (errorMessage.includes('model not found') || errorMessage.includes('invalid model')) {
        return 'Ошибка модели ИИ. Попробуйте еще раз или обратитесь в поддержку.';
    }

    return 'Не удалось выполнить запрос. Проверьте подключение к интернету и попробуйте еще раз.';
}

/**
 * Выполняет запрос с retry логикой для rate limit ошибок
 * @param {Function} apiCall - Функция выполняющая API вызов
 * @param {number} maxRetries - Максимальное количество попыток
 * @param {number} baseDelay - Базовая задержка в мс
 * @returns {Promise}
 */
async function executeWithRetry(apiCall, maxRetries = 2, baseDelay = 10000) {
    let lastError;

    for (let attempt = 0; attempt <= maxRetries; attempt++) {
        try {
            return await apiCall();
        } catch (error) {
            lastError = error;
            const errorMessage = error.message?.toLowerCase() || '';
            const errorCode = error.code || error.status;
            const isRetryableError = errorMessage.includes('rate limit') ||
                                   errorMessage.includes('too many requests') ||
                                   errorCode === 429 ||
                                   errorMessage.includes('service tier capacity exceeded') ||
                                   errorMessage.includes('capacity exceeded');

            // Для rate limit и capacity ошибок делаем retry с более консервативной задержкой
            if (isRetryableError && attempt < maxRetries) {
                // Более консервативная задержка: базовая + экспоненциальная компонента + jitter
                const exponentialDelay = baseDelay * Math.pow(1.5, attempt); // Более плавное увеличение
                const jitter = Math.random() * 2000; // Уменьшенный jitter
                const delay = exponentialDelay + jitter;

                console.warn(`API error (${errorCode || 'unknown'}), retrying in ${Math.round(delay)}ms (attempt ${attempt + 1}/${maxRetries + 1})`);
                await new Promise(resolve => setTimeout(resolve, delay));
                continue;
            }

            // Для других ошибок или если превышено количество попыток - выбрасываем ошибку
            throw error;
        }
    }

    throw lastError;
}

/**
 * Толкование отдельной карты в контексте вопроса и позиции
 * @param {string} question - Вопрос пользователя
 * @param {Object} card - Выбранная карта с позицией
 * @param {Object} position - Информация о позиции карты в раскладе
 * @returns {Promise<string>}
 */
export async function interpretSingleCard(question, card, position) {
    return mistralRateLimiter.execute(async () => {
        try {
            const client = initMistralClient();

            const systemPrompt = `Ты опытный таролог. Дай краткое, но глубокое толкование карты Таро в контексте вопроса и позиции в раскладе.
Используй мистический, но понятный язык. Будь конкретным и практичным.
Ответ должен быть 2-3 абзаца, не более 200 слов.`;

            const cardPosition = card.isReversed ? 'перевёрнутом' : 'прямом';
            const cardMeaning = card.isReversed ? card.reversed : card.upright;

            const apiCall = async () => {
                const result = await client.chat.complete({
                    model: 'mistral-small-latest',
                    messages: [
                        {
                            role: 'system',
                            content: systemPrompt
                        },
                        {
                            role: 'user',
                            content: `Вопрос: "${question}"

Позиция: ${position.name} - ${position.meaning}

Карта: ${card.name} (${card.arcana}) в ${cardPosition} положении
Значение: ${cardMeaning}

Дай толкование этой карты в контексте вопроса и позиции.`
                        }
                    ],
                    temperature: 0.7,
                    max_tokens: 300
                });

                return result.choices[0].message.content;
            };

            return await executeWithRetry(apiCall, 2, 10000);

        } catch (error) {
            console.error('Ошибка толкования карты:', error);
            throw new Error(createErrorMessage(error));
        }
    });
}

/**
 * Финальное толкование всего расклада
 * @param {Object} userData - Данные пользователя (имя, дата рождения)
 * @param {string} zodiacSign - Знак зодиака
 * @param {string} question - Вопрос пользователя
 * @param {Object} spread - Информация о раскладе
 * @param {Array} selectedCards - Массив выбранных карт с позициями
 * @returns {Promise<string>}
 */
export async function generateFullReading(userData, zodiacSign, question, spread, selectedCards) {
    return mistralRateLimiter.execute(async () => {
        try {
            const client = initMistralClient();

            const systemPrompt = `Ты мудрый таролог с глубокими знаниями эзотерики и астрологии.
Дай полное, развёрнутое толкование расклада Таро, учитывая:
- Личность человека и его знак зодиака
- Тип расклада и значение позиций
- Взаимосвязь между картами
- Практические советы и рекомендации

Используй мистический, образный язык. Обращайся к человеку по имени.
Структурируй ответ: вступление, анализ карт, общий вывод и совет.
Объём: 400-600 слов.`;

            const cardsDescription = selectedCards.map((card, index) => {
                const position = spread.positions[index];
                const cardPosition = card.isReversed ? 'перевёрнутое' : 'прямое';
                return `${position.name}: ${card.name} (${cardPosition} положение) - ${card.meaning}`;
            }).join('\n');

            const apiCall = async () => {
                const result = await client.chat.complete({
                    model: 'mistral-small-latest',
                    messages: [
                        {
                            role: 'system',
                            content: systemPrompt
                        },
                        {
                            role: 'user',
                            content: `Имя: ${userData.name}
Знак зодиака: ${zodiacSign}
Вопрос: "${question}"

Расклад: ${spread.name}
Описание: ${spread.description}

Выпавшие карты:
${cardsDescription}

Дай полное толкование расклада, учитывая личность ${userData.name} как представителя знака ${zodiacSign}.`
                        }
                    ],
                    temperature: 0.7,
                    max_tokens: 1000
                });

                return result.choices[0].message.content;
            };

            return await executeWithRetry(apiCall, 2, 10000);

        } catch (error) {
            console.error('Ошибка генерации финального толкования:', error);
            throw new Error(createErrorMessage(error));
        }
    });
}
