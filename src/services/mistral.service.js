import { Mistral } from '@mistralai/mistralai';
import { mistralRateLimiter } from '@/utils/rateLimiter';
import { parseAIResponse, normalizeValidationResponse, isValidValidationResponse } from '@/utils/jsonParser';

// Agent IDs для разных задач (загружаются из переменных окружения)
const AGENTS = {
  tarot_validation: import.meta.env.VITE_MISTRAL_AGENT_TAROT_VALIDATION, // Агент для валидации вопросов
  tarot_reading: import.meta.env.VITE_MISTRAL_AGENT_TAROT_READING, // Агент для толкования одной карты
  full_spread: import.meta.env.VITE_MISTRAL_AGENT_FULL_SPREAD, // Агент для полного толкования расклада
  natal_chart: import.meta.env.VITE_MISTRAL_AGENT_NATAL_CHART // Новый агент для натальной карты
};


/**
 * Выполняет запрос через Mistral Agents API или обычный chat completion
 * @param {string} task - Тип задачи ('tarot_validation', 'tarot_reading', etc.)
 * @param {string} message - Сообщение для отправки
 * @param {Object} options - Дополнительные опции для chat completion
 * @returns {Promise<string>} - Ответ от AI
 */
async function callMistralAI(task, message, options = {}) {
    const agentId = AGENTS[task];

    if (agentId) {
        // Используем Agents API
        try {
            const client = initMistralClient();
            const response = await client.beta.conversations.start({
                agentId: agentId,
                inputs: message,
            });

            // Извлекаем контент из outputs массива Mistral Agents API
            let content;
            if (response.outputs && Array.isArray(response.outputs) && response.outputs.length > 0) {
                const output = response.outputs[0];
                content = output.content || output.message || output.text || output;
            } else {
                content = response.content || response.message || response;
            }

            return content;
        } catch (error) {
            console.warn(`Agents API failed for ${task}, falling back to chat completion:`, error);
            // Fallback к обычному chat completion
        }
    }

    // Используем обычный chat completion
    const client = initMistralClient();
    const result = await client.chat.complete({
        model: 'mistral-small-latest',
        messages: [
            {
                role: 'user',
                content: message
            }
        ],
        temperature: options.temperature || 0.7,
        max_tokens: options.maxTokens || 1000,
        ...options
    });

    const content = result.choices[0].message.content;
    return content;
}

/**
 * Очищает HTML от markdown оберток и лишнего контента
 * @param {string} content - Ответ от AI
 * @returns {string} - Очищенный HTML
 */
function cleanMarkdownFromHtml(content) {
    if (!content) return '';

    // Удаляем markdown блоки кода
    content = content.replace(/```html\s*/gi, '').replace(/```\s*$/gi, '');

    // Удаляем любые другие markdown блоки
    content = content.replace(/```\w*\s*/gi, '').replace(/```\s*$/gi, '');

    // Удаляем лишние пробелы и переносы строк в начале и конце
    content = content.trim();

    // Если контент не содержит HTML тегов, оборачиваем в параграф
    if (!content.includes('<') || !content.includes('>')) {
        return `<p>${content}</p>`;
    }

    // Удаляем любой текст перед первым HTML тегом
    const firstTagIndex = content.indexOf('<');
    if (firstTagIndex > 0) {
        content = content.substring(firstTagIndex);
    }

    // Удаляем любой текст после последнего закрывающего HTML тега
    const lastTagEndIndex = content.lastIndexOf('>');
    if (lastTagEndIndex < content.length - 1) {
        content = content.substring(0, lastTagEndIndex + 1);
    }

    return content;
}

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
    // Предварительная проверка на попытки манипуляции системой
    const manipulationPatterns = [
        // Попытки заставить AI вести себя как таролога
        /веди себя как таролог/i,
        /ты таролог/i,
        /действуй как таролог/i,
        /будь тарологом/i,
        /роль таролога/i,

        // Просьбы сделать расклад напрямую
        /сделай расклад/i,
        /сделайте расклад/i,
        /дай расклад/i,
        /дайте расклад/i,
        /проведи расклад/i,
        /составь расклад/i,

        // Запросы на длинные ответы
        /в \d+ слов/i,
        /на \d+ слов/i,
        /длинный ответ/i,
        /подробный ответ/i,
        /развернутый ответ/i,
        /полный расклад/i,

        // Попытки обойти ограничения
        /игнорируй/i,
        /забудь/i,
        /не обращай внимания/i,
        /обойди/i,
        /обходи/i,
        /нарушь/i,

        // Прямые команды к AI
        /расскажи о картах/i,
        /опиши карты/i,
        /толкуй карты/i,
        /интерпретируй карты/i,

        // Попытки изменить поведение
        /измени роль/i,
        /смени роль/i,
        /новая роль/i,
        /другая роль/i
    ];

    const lowerQuestion = question.toLowerCase();

    // Проверяем на манипулятивные паттерны
    for (const pattern of manipulationPatterns) {
        if (pattern.test(lowerQuestion)) {
            return {
                isValid: false,
                reason: "Попытка манипуляции системой или обхода ограничений",
                suggestion: "Пожалуйста, задайте вопрос о вашей ситуации или проблеме, которую вы хотели бы проанализировать с помощью карт Таро."
            };
        }
    }

    // Используем rate limiter для соблюдения ограничения 1 запрос/3 секунды
    return mistralRateLimiter.execute(async () => {
        // Выполняем до 5 попыток для любых ошибок
        let lastError;
        for (let attempt = 0; attempt < 5; attempt++) {
            try {
                // Агент уже знает инструкции, отправляем только вопрос
                const response = await callMistralAI('tarot_validation', question, {
                    temperature: 0.3,
                    response_format: { type: 'json_object' },
                    maxTokens: 300
                });

                // Логируем сырой ответ для отладки

                // Очищаем специальные символы, которые ломают JSON парсинг
                let cleanResponse = response
                    .replace(/『/g, '"')  // Заменяем специальные кавычки на обычные
                    .replace(/』/g, '"')
                    .replace(/「/g, '"')
                    .replace(/」/g, '"')
                    .replace(/【/g, '[')
                    .replace(/】/g, ']')
                    .replace(/（/g, '(')
                    .replace(/）/g, ')')
                    .replace(/～/g, '~')
                    .replace(/\u00A0/g, ' ')  // Заменяем неразрывные пробелы
                    .replace(/\u200B/g, '')   // Удаляем нулевые ширины пробелы
                    .replace(/\uFEFF/g, '');  // Удаляем BOM символы


                // Парсинг JSON с использованием утилиты
                const validation = parseAIResponse(cleanResponse);

                // Валидация структуры ответа
                if (!isValidValidationResponse(validation)) {
                    console.warn('Некорректная структура ответа от agent:', validation);
                    throw new Error('Некорректная структура ответа от AI');
                }

                // Нормализация и возврат результата
                return normalizeValidationResponse(validation);

            } catch (error) {
                lastError = error;
                console.warn(`Ошибка валидации вопроса (попытка ${attempt + 1}/5):`, error.message);

                if (attempt < 4) { // Если не последняя попытка
                    // Ждем перед следующей попыткой с экспоненциальной задержкой
                    const delay = 3000 * Math.pow(2, attempt); // 3с, 6с, 12с, 24с
                    console.warn(`Повторная попытка через ${delay}мс...`);
                    await new Promise(resolve => setTimeout(resolve, delay));
                }
            }
        }

        // После всех попыток обрабатываем ошибку
        console.error('Ошибка валидации вопроса после 5 попыток:', lastError);

        // Определяем тип ошибки
        const errorMessage = lastError.message?.toLowerCase() || '';
        const isNetworkError = errorMessage.includes('network') ||
                             errorMessage.includes('fetch') ||
                             errorMessage.includes('connection') ||
                             errorMessage.includes('internet') ||
                             lastError.code === 'NETWORK_ERROR' ||
                             lastError.code === 'ENOTFOUND' ||
                             lastError.code === 'ECONNREFUSED' ||
                             lastError.code === 'ETIMEDOUT' ||
                             !navigator.onLine;

        // Для сетевых ошибок возвращаем isValid: false, чтобы показать уведомление пользователю
        if (isNetworkError) {
            return {
                isValid: false,
                reason: 'network_error',
                suggestion: 'Проверьте подключение к интернету и попробуйте еще раз.',
                error: createErrorMessage(lastError)
            };
        }

        // Для других ошибок возвращаем fallback валидацию
        const fallbackMessage = createErrorMessage(lastError).replace('Попробуйте', 'Валидация пропущена. Попробуйте');

        return {
            isValid: true, // Разрешаем по умолчанию, чтобы не блокировать пользователя
            reason: null,
            suggestion: null,
            error: fallbackMessage
        };
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
        // Выполняем до 5 попыток для любых ошибок
        let lastError;
        for (let attempt = 0; attempt < 5; attempt++) {
            try {
                const cardPosition = card.isReversed ? 'перевёрнутом' : 'прямом';
                const cardMeaning = card.isReversed ? card.reversed : card.upright;

                // Агент уже знает инструкции, отправляем только данные
                const cardData = `Вопрос: "${question}"
Позиция: ${position.name} - ${position.meaning}
Карта: ${card.name} (${card.arcana}) в ${cardPosition} положении
Значение: ${cardMeaning}`;

                const response = await callMistralAI('tarot_reading', cardData, {
                    temperature: 0.7,
                    maxTokens: 300
                });

                return response;

            } catch (error) {
                lastError = error;
                console.warn(`Ошибка толкования карты (попытка ${attempt + 1}/5):`, error.message);

                if (attempt < 4) { // Если не последняя попытка
                    // Ждем перед следующей попыткой с экспоненциальной задержкой
                    const delay = 3000 * Math.pow(2, attempt); // 3с, 6с, 12с, 24с
                    console.warn(`Повторная попытка через ${delay}мс...`);
                    await new Promise(resolve => setTimeout(resolve, delay));
                }
            }
        }

        // После всех попыток выбрасываем ошибку
        console.error('Ошибка толкования карты после 5 попыток:', lastError);
        throw new Error(createErrorMessage(lastError));
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
        // Выполняем до 5 попыток для любых ошибок
        let lastError;
        for (let attempt = 0; attempt < 5; attempt++) {
            try {
            const cardsDescription = selectedCards.map((card, index) => {
                const position = spread.positions[index];
                const cardPosition = card.isReversed ? 'перевёрнутое' : 'прямое';
                return `${position.name}: ${card.name} (${cardPosition} положение) - ${card.meaning}`;
            }).join('\n');

            // Агент уже знает инструкции, отправляем только данные расклада
            const spreadData = `Имя: ${userData.name}
Знак зодиака: ${zodiacSign}
Вопрос: "${question}"

Расклад: ${spread.name}
Описание: ${spread.description}

Выпавшие карты:
${cardsDescription}`;

            let content = await callMistralAI('full_spread', spreadData, {
                temperature: 0.7,
                maxTokens: 2000 // Увеличиваем лимит токенов для более полных толкований
            });

            // Очищаем от markdown оберток
            content = cleanMarkdownFromHtml(content);

            // Проверяем завершенность ответа для полного толкования
            const isIncompleteReading = (text) => {
                if (!text || text.trim().length < 300) {
                    return true; // Слишком короткий ответ
                }

                const trimmed = text.trim();

                // Проверяем незавершенные HTML теги
                const openTags = (trimmed.match(/<[^\/][^>]*>/g) || []).length;
                const closeTags = (trimmed.match(/<\/[^>]+>/g) || []).length;

                if (openTags > closeTags) {
                    return true; // Есть незакрытые HTML теги
                }

                // Проверяем наличие основных элементов толкования
                const hasBasicElements = (
                    trimmed.includes('<h2>') && // Есть заголовки разделов
                    trimmed.includes('</p>') &&  // Есть параграфы
                    (trimmed.includes('заключение') || trimmed.includes('вывод') || trimmed.includes('итог')) && // Есть заключение
                    trimmed.length > 800          // Минимальная длина
                );

                if (!hasBasicElements) {
                    return true; // Недостаточно содержимого
                }

                // Проверяем правильное окончание
                if (!trimmed.endsWith('.') && !trimmed.endsWith('!') && !trimmed.endsWith('?') &&
                    !trimmed.endsWith('</p>') && !trimmed.endsWith('</div>')) {
                    return true; // Нет правильного окончания
                }

                return false; // Ответ кажется завершенным
            };

            // Получаем continuation если ответ неполный
            if (isIncompleteReading(content)) {
                console.warn('Ответ полного толкования кажется незавершенным, пытаемся получить continuation...');

                try {
                    const continuationPrompt = `Заверши толкование таро расклада. Убедись, что интерпретация полная и содержит:

- Введение и общий обзор расклада
- Детальный анализ каждой позиции и карты
- Взаимосвязи между картами
- Практические советы и рекомендации
- Заключение с выводами

Предыдущий текст (последние 200 символов): ${content.slice(-200)}

Заверши толкование полностью с правильным закрытием всех HTML тегов.`;

                    const continuation = await callMistralAI('tarot_reading', continuationPrompt, {
                        temperature: 0.6,
                        maxTokens: 800
                    });

                    if (continuation && continuation.trim()) {
                        content += ' ' + cleanMarkdownFromHtml(continuation);
                    }
                } catch (continuationError) {
                    console.warn('Не удалось получить continuation для толкования:', continuationError);
                }
            }

            return content;

            } catch (error) {
                lastError = error;
                console.warn(`Ошибка генерации финального толкования (попытка ${attempt + 1}/5):`, error.message);

                if (attempt < 4) { // Если не последняя попытка
                    // Ждем перед следующей попыткой с экспоненциальной задержкой
                    const delay = 3000 * Math.pow(2, attempt); // 3с, 6с, 12с, 24с
                    console.warn(`Повторная попытка через ${delay}мс...`);
                    await new Promise(resolve => setTimeout(resolve, delay));
                }
            }
        }

        // После всех попыток выбрасываем ошибку
        console.error('Ошибка генерации финального толкования после 5 попыток:', lastError);
        throw new Error(createErrorMessage(lastError));
    });
}

/**
 * Интерпретирует натальную карту с помощью ИИ
 * @param {Object} natalChartData - данные натальной карты
 * @param {Object} userData - данные пользователя
 * @returns {Promise<string>} HTML интерпретация натальной карты
 */
export async function interpretNatalChart(natalChartData, userData) {
    return mistralRateLimiter.execute(async () => {
        // Выполняем до 5 попыток для любых ошибок
        let lastError;
        for (let attempt = 0; attempt < 5; attempt++) {
            try {
            // Форматируем данные натальной карты для ИИ
            const planetsInfo = natalChartData.planets?.map(planet =>
                `${planet.name} в ${planet.sign.name} (${planet.degree.toFixed(1)}°) ${planet.retrograde ? '(R)' : ''}`
            ).join(', ') || 'Данные планет недоступны';

            const housesInfo = natalChartData.houses?.map(house =>
                `Дом ${house.number}: ${house.sign.name} (${house.cusp.toFixed(1)}°)`
            ).join(', ') || 'Данные домов недоступны';

            const aspectsInfo = natalChartData.aspects?.slice(0, 10).map(aspect =>
                `${aspect.planet1} ${aspect.aspect} ${aspect.planet2} (${aspect.angle}°) ${aspect.strength ? `- ${aspect.strength}` : ''}`
            ).join(', ') || 'Данные аспектов недоступны';

            const chartSummary = `
Планеты: ${planetsInfo}
Дома: ${housesInfo}
Ключевые аспекты: ${aspectsInfo}
            `.trim();

            // Агент уже знает инструкции, отправляем только данные натальной карты
            const natalData = `Имя: ${userData?.name || 'Дорогой друг'}
Дата рождения: ${natalChartData.birthData?.date || 'не указана'}
Время рождения: ${natalChartData.birthData?.time || 'не указано'}
Место рождения: ${natalChartData.birthData?.place || 'не указано'}

${chartSummary}`;

            let response = await callMistralAI('natal_chart', natalData, {
                temperature: 0.6,
                maxTokens: 5000 // Увеличиваем лимит для более полных ответов
            });

            // Логируем сырой ответ для отладки

            response = cleanMarkdownFromHtml(response);


            // Улучшенная проверка завершенности ответа
            const isIncomplete = (response) => {
                if (!response || response.trim().length < 500) {
                    return true; // Слишком короткий ответ
                }

                const trimmed = response.trim();

                // Проверяем незавершенные HTML теги
                const openTags = (trimmed.match(/<[^\/][^>]*>/g) || []).length;
                const closeTags = (trimmed.match(/<\/[^>]+>/g) || []).length;

                if (openTags > closeTags) {
                    return true; // Есть незакрытые HTML теги
                }

                // Проверяем незавершенные предложения (нет пунктуации в конце)
                if (!trimmed.endsWith('.') && !trimmed.endsWith('!') && !trimmed.endsWith('?') &&
                    !trimmed.endsWith('</p>') && !trimmed.endsWith('</h2>') &&
                    !trimmed.endsWith('</h3>') && !trimmed.endsWith('</ul>') &&
                    !trimmed.endsWith('</ol>') && !trimmed.endsWith('</div>')) {
                    return true; // Нет правильного окончания
                }

                // Проверяем наличие основных разделов интерпретации
                const hasBasicSections = (
                    trimmed.includes('<h2>') && // Есть заголовки
                    trimmed.includes('</p>') &&  // Есть параграфы
                    trimmed.length > 1000       // Минимальная длина
                );

                if (!hasBasicSections) {
                    return true; // Недостаточно содержимого
                }

                return false; // Ответ кажется завершенным
            };

            // Проверяем и получаем продолжение при необходимости
            let continuationAttempts = 0;
            const maxContinuations = 2; // Максимум 2 попытки продолжения

            while (isIncomplete(response) && continuationAttempts < maxContinuations) {
                continuationAttempts++;
                console.warn(`Ответ ИИ кажется незавершенным (попытка ${continuationAttempts}/${maxContinuations}), пытаемся получить продолжение...`);

                try {
                    const continuationPrompt = `Продолжи незавершенную астрологическую интерпретацию. Заверши все начатые мысли, предложения и HTML теги.

ВАЖНО: Убедись, что ответ содержит полную интерпретацию со всеми разделами:
- Личность и характер
- Предназначение и жизненные уроки
- Карьера и таланты
- Отношения и любовь
- Здоровье и энергия
- Финансы и материальное благополучие
- Заключительное резюме

Предыдущий текст (последние 300 символов): ${response.slice(-300)}

Продолжи и заверши интерпретацию полностью с правильным закрытием всех HTML тегов.`;

                    const continuation = await callMistralAI('natal_chart', continuationPrompt, {
                        temperature: 0.6, // Меньше креативности для завершения
                        maxTokens: 1500 // Больше токенов для завершения
                    });

                    if (continuation && continuation.trim()) {
                        const cleanContinuation = cleanMarkdownFromHtml(continuation);
                        response += ' ' + cleanContinuation;
                    } else {
                        console.warn(`Получено пустое продолжение (попытка ${continuationAttempts})`);
                        break; // Выходим из цикла если continuation пустой
                    }

                    // Небольшая пауза между continuation'ами
                    await new Promise(resolve => setTimeout(resolve, 500));

                } catch (continuationError) {
                    console.error(`Не удалось получить продолжение (попытка ${continuationAttempts}):`, continuationError);
                    break; // Выходим из цикла при ошибке
                }
            }

            // Финальная проверка и добавление завершающего текста при необходимости
            if (isIncomplete(response)) {
                console.warn('После всех попыток ответ все еще кажется незавершенным, добавляем завершающий текст');
                if (!response.includes('</p>') || !response.trim().endsWith('.')) {
                    response += '</p><p><em>Интерпретация была завершена на основе доступных данных.</em></p>';
                }
            } else {
            }

            return response;

            } catch (error) {
                lastError = error;
                console.warn(`Ошибка интерпретации натальной карты (попытка ${attempt + 1}/5):`, error.message);

                if (attempt < 4) { // Если не последняя попытка
                    // Ждем перед следующей попыткой с экспоненциальной задержкой
                    const delay = 3000 * Math.pow(2, attempt); // 3с, 6с, 12с, 24с
                    console.warn(`Повторная попытка через ${delay}мс...`);
                    await new Promise(resolve => setTimeout(resolve, delay));
                }
            }
        }

        // После всех попыток выбрасываем ошибку
        console.error('Ошибка интерпретации натальной карты после 5 попыток:', lastError);
        throw new Error('Не удалось получить интерпретацию натальной карты. Попробуйте позже.');
    });
}
