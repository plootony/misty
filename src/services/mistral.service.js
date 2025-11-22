import { Mistral } from '@mistralai/mistralai';
import { mistralRateLimiter } from '@/utils/rateLimiter';
import { parseAIResponse, normalizeValidationResponse, isValidValidationResponse } from '@/utils/jsonParser';
import { sendError } from '@/services/hawk.service';

// Agent IDs для разных задач (загружаются из переменных окружения)
const AGENTS = {
  tarot_validation: import.meta.env.VITE_MISTRAL_AGENT_TAROT_VALIDATION, // Агент для валидации вопросов
  tarot_reading: import.meta.env.VITE_MISTRAL_AGENT_TAROT_READING, // Агент для толкования одной карты
  full_spread: import.meta.env.VITE_MISTRAL_AGENT_FULL_SPREAD, // Агент для полного толкования расклада
  natal_chart: import.meta.env.VITE_MISTRAL_AGENT_NATAL_CHART // Новый агент для натальной карты
};


/**
 * Выполняет запрос через Mistral Agents API или обычный chat completion
 * Всего 3 попытки: сначала агент (если доступен), потом обычный API
 * @param {string} task - Тип задачи ('tarot_validation', 'tarot_reading', etc.)
 * @param {string} message - Сообщение для отправки
 * @param {Object} options - Дополнительные опции для chat completion
 * @returns {Promise<string>} - Ответ от AI
 */
// Вспомогательные функции для оптимизации
const calculateRetryDelay = (attemptNumber) => 3000 * Math.pow(2, attemptNumber - 1);

const extractAgentContent = (response) => {
    if (response.outputs && Array.isArray(response.outputs) && response.outputs.length > 0) {
        const output = response.outputs[0];
        return output.content || output.message || output.text || output;
    }
    return response.content || response.message || response;
};

const createChatCompletionOptions = (message, options) => ({
    model: 'mistral-small-latest',
    messages: [{ role: 'user', content: message }],
    temperature: options.temperature || 0.7,
    max_tokens: options.maxTokens || 1000,
    ...options
});

const isNetworkError = (error) => {
    const errorMessage = error.message?.toLowerCase() || '';
    const errorCode = error.code || error.status || error.statusCode;

    return errorMessage.includes('network') ||
           errorMessage.includes('fetch') ||
           errorMessage.includes('connection') ||
           errorMessage.includes('internet') ||
           errorCode === 'NETWORK_ERROR' ||
           errorCode === 'ENOTFOUND' ||
           errorCode === 'ECONNREFUSED' ||
           errorCode === 'ETIMEDOUT' ||
           (typeof navigator !== 'undefined' && navigator.onLine === false);
};

async function callMistralAI(task, message, options = {}) {
    const agentId = AGENTS[task];
    let attemptsMade = 0;
    const maxAttempts = 3;

    // Сначала пытаемся через агента (максимум 2 попытки)
    if (agentId) {
        const agentAttempts = Math.min(2, maxAttempts);
        for (let i = 0; i < agentAttempts; i++) {
            try {
                const client = initMistralClient();
                const response = await client.beta.conversations.start({
                    agentId: agentId,
                    inputs: message,
                });

                return extractAgentContent(response);
            } catch (error) {
                attemptsMade++;
                console.warn(`Agents API failed for ${task} (attempt ${attemptsMade}/${maxAttempts}):`, error.message);

                // Отправляем ошибку в Hawk сразу при возникновении
                sendError(error, {
                    service: 'mistral',
                    method: 'callMistralAI',
                    task: task,
                    attempt: attemptsMade,
                    maxAttempts: maxAttempts,
                    apiType: 'agents',
                    errorType: 'agent_api_error'
                });

                if (attemptsMade < maxAttempts) {
                    const delay = calculateRetryDelay(attemptsMade);
                    console.warn(`Retrying in ${delay}ms...`);
                    await new Promise(resolve => setTimeout(resolve, delay));
                }
            }
        }
    }

    // Остальные попытки через обычный API
    while (attemptsMade < maxAttempts) {
        try {
            const client = initMistralClient();
            const result = await client.chat.complete(createChatCompletionOptions(message, options));
            return result.choices[0].message.content;
        } catch (error) {
            attemptsMade++;
            console.warn(`Chat completion failed for ${task} (attempt ${attemptsMade}/${maxAttempts}):`, error.message);

            // Отправляем ошибку в Hawk сразу при возникновении
            sendError(error, {
                service: 'mistral',
                method: 'callMistralAI',
                task: task,
                attempt: attemptsMade,
                maxAttempts: maxAttempts,
                apiType: 'chat_completion',
                errorType: 'chat_completion_error'
            });

            if (attemptsMade < maxAttempts) {
                const delay = calculateRetryDelay(attemptsMade);
                console.warn(`Retrying in ${delay}ms...`);
                await new Promise(resolve => setTimeout(resolve, delay));
            }
        }
    }

    // Отправляем финальную ошибку в Hawk
    const finalError = new Error(`All ${maxAttempts} attempts failed for ${task}`);
    sendError(finalError, {
        service: 'mistral',
        method: 'callMistralAI',
        task: task,
        attemptsMade: attemptsMade,
        maxAttempts: maxAttempts,
        errorType: 'api_failure',
        messageLength: message?.length
    });

    throw finalError;
}

/**
 * Очищает HTML от markdown оберток и лишнего контента
 * @param {string} content - Ответ от AI
 * @returns {string} - Очищенный HTML
 */
function cleanMarkdownFromHtml(content) {
    if (!content) return '';

    // Удаляем markdown блоки кода и специальные символы за один проход
    content = content
        .replace(/```\w*\s*/gi, '')  // Удаляем открывающие блоки кода
        .replace(/```\s*$/gi, '')    // Удаляем закрывающие блоки кода
        .replace(/『/g, '"')         // Заменяем специальные кавычки
        .replace(/』/g, '"')
        .replace(/「/g, '"')
        .replace(/」/g, '"')
        .replace(/【/g, '[')
        .replace(/】/g, ']')
        .replace(/（/g, '(')
        .replace(/）/g, ')')
        .replace(/～/g, '~')
        .replace(/\u00A0/g, ' ')    // Заменяем неразрывные пробелы
        .replace(/\u200B/g, '')     // Удаляем нулевые ширины пробелы
        .replace(/\uFEFF/g, '')     // Удаляем BOM символы
        .trim();

    // Если контент не содержит HTML тегов, оборачиваем в параграф
    if (!content.includes('<') || !content.includes('>')) {
        return `<p>${content}</p>`;
    }

    // Находим границы HTML контента
    const firstTagIndex = content.indexOf('<');
    const lastTagEndIndex = content.lastIndexOf('>');

    if (firstTagIndex > 0 || lastTagEndIndex < content.length - 1) {
        content = content.substring(firstTagIndex, lastTagEndIndex + 1);
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
        // Попытки изменить роль AI
        /(веди себя|ты|действуй|будь).*(таролог|таролога|роль)/i,
        /(измени|смени|новая|другая).*(роль)/i,

        // Просьбы сделать расклад
        /(сделай|дай|проведи|составь).*(расклад)/i,

        // Запросы на длинные ответы
        /(в|на)\s+\d+\s+слов/i,
        /(длинный|подробный|развернутый|полный).*ответ/i,

        // Попытки обойти ограничения
        /(игнорируй|забудь|не\s+обращай\s+внимания|обойди|нарушь)/i,

        // Прямые команды к картам
        /(расскажи|опиши|толкуй|интерпретируй).*карт/i
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
        try {
            // callMistralAI делает всего 3 попытки (агент + API)
            const response = await callMistralAI('tarot_validation', question, {
                temperature: 0.3,
                response_format: { type: 'json_object' },
                maxTokens: 300
            });

            // Очищаем специальные символы, которые ломают JSON парсинг
            let cleanResponse = response;

            // Парсинг JSON с использованием утилиты
            const validation = parseAIResponse(cleanResponse);

            // Валидация структуры ответа
            if (!isValidValidationResponse(validation)) {
                console.warn('Некорректная структура ответа от AI:', validation);
                throw new Error('Некорректная структура ответа от AI');
            }

            // Нормализация и возврат результата
            return normalizeValidationResponse(validation);

        } catch (error) {
            console.error('Ошибка валидации вопроса:', error);

            // Отправляем ошибку в Hawk для мониторинга
            sendError(error, {
                service: 'mistral',
                method: 'validateTarotQuestion',
                task: 'tarot_validation',
                question: question?.substring(0, 100), // Ограничиваем длину для безопасности
                errorType: 'api_error'
            });

            // Определяем тип ошибки
            const isNetwork = isNetworkError(error);

            // Для сетевых ошибок возвращаем объект с ошибкой
            if (isNetwork) {
                return {
                    isValid: false,
                    reason: 'network_error',
                    suggestion: 'Проверьте подключение к интернету и попробуйте еще раз.',
                    error: createErrorMessage(error)
                };
            }

            // Для других ошибок возвращаем объект с ошибкой
            return {
                isValid: false,
                reason: 'validation_error',
                suggestion: 'Произошла ошибка при проверке вопроса. Попробуйте еще раз.',
                error: createErrorMessage(error)
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
 * Толкование отдельной карты в контексте вопроса и позиции
 * @param {string} question - Вопрос пользователя
 * @param {Object} card - Выбранная карта с позицией
 * @param {Object} position - Информация о позиции карты в раскладе
 * @returns {Promise<string>}
 */
export async function interpretSingleCard(question, card, position) {
    return mistralRateLimiter.execute(async () => {
        try {
            const cardPosition = card.isReversed ? 'перевёрнутом' : 'прямом';
            const cardMeaning = card.isReversed ? card.reversed : card.upright;

            // Агент уже знает инструкции, отправляем только данные
            const cardData = `Вопрос: "${question}"
Позиция: ${position.name} - ${position.meaning}
Карта: ${card.name} (${card.arcana}) в ${cardPosition} положении
Значение: ${cardMeaning}`;

            // callMistralAI делает всего 3 попытки (агент + API)
            const response = await callMistralAI('tarot_reading', cardData, {
                temperature: 0.7,
                maxTokens: 300
            });

            return response;

        } catch (error) {
            console.error('Ошибка толкования карты:', error);

            // Отправляем ошибку в Hawk
            sendError(error, {
                service: 'mistral',
                method: 'interpretSingleCard',
                question: question?.substring(0, 100),
                cardName: card?.name,
                cardPosition: card?.isReversed ? 'reversed' : 'upright',
                position: position?.name,
                errorType: 'interpretation_error'
            });

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

            // callMistralAI делает всего 3 попытки (агент + API)
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
            console.error('Ошибка генерации финального толкования:', error);

            // Отправляем ошибку в Hawk
            sendError(error, {
                service: 'mistral',
                method: 'generateFullReading',
                userName: userData?.name,
                zodiacSign: zodiacSign,
                question: question?.substring(0, 100),
                spreadName: spread?.name,
                cardsCount: selectedCards?.length,
                errorType: 'full_reading_error'
            });

            throw new Error(createErrorMessage(error));
        }
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

            // callMistralAI делает всего 3 попытки (агент + API)
            let response = await callMistralAI('natal_chart', natalData, {
                temperature: 0.6,
                maxTokens: 5000 // Увеличиваем лимит для более полных ответов
            });

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
            }

            return response;

        } catch (error) {
            console.error('Ошибка интерпретации натальной карты:', error);

            // Отправляем ошибку в Hawk
            sendError(error, {
                service: 'mistral',
                method: 'interpretNatalChart',
                userName: userData?.name,
                hasBirthData: !!natalChartData?.birthData,
                hasPlanets: !!natalChartData?.planets,
                planetsCount: natalChartData?.planets?.length,
                hasHouses: !!natalChartData?.houses,
                housesCount: natalChartData?.houses?.length,
                hasAspects: !!natalChartData?.aspects,
                aspectsCount: natalChartData?.aspects?.length,
                errorType: 'natal_chart_error'
            });

            throw new Error('Не удалось получить интерпретацию натальной карты. Попробуйте позже.');
        }
    });
}
