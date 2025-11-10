/**
 * Rate Limiter для ограничения частоты запросов к API
 * Ограничение: 1 запрос каждые 3 секунды с адаптивной задержкой при серверных лимитах
 */
class RateLimiter {
    constructor(requestsPerSecond = 1) {
        this.requestsPerSecond = requestsPerSecond;
        this.minInterval = 1000 / requestsPerSecond; // Минимальный интервал между запросами в мс
        this.lastRequestTime = 0;
        this.queue = [];
        this.processing = false;
        this.serverRateLimitHits = 0; // Счетчик попаданий в серверные rate limits
        this.lastServerRateLimitTime = 0; // Время последнего серверного rate limit
        this.adaptiveDelay = this.minInterval; // Адаптивная задержка
    }

    /**
     * Выполняет функцию с учетом rate limiting
     * @param {Function} fn - Функция для выполнения
     * @returns {Promise} - Результат выполнения функции
     */
    async execute(fn) {
        return new Promise((resolve, reject) => {
            this.queue.push({ fn, resolve, reject });
            this.processQueue();
        });
    }

    async processQueue() {
        if (this.processing || this.queue.length === 0) {
            return;
        }

        this.processing = true;

        while (this.queue.length > 0) {
            const now = Date.now();
            const timeSinceLastRequest = now - this.lastRequestTime;
            const currentDelay = this.getCurrentDelay();
            const waitTime = Math.max(0, currentDelay - timeSinceLastRequest);

            if (waitTime > 0) {
                await this.sleep(waitTime);
            }

            const { fn, resolve, reject } = this.queue.shift();
            this.lastRequestTime = Date.now();

            try {
                const result = await fn();
                this.onSuccess(); // Сбрасываем адаптивную задержку при успехе
                resolve(result);
            } catch (error) {
                this.onError(error); // Адаптируем задержку при ошибке
                reject(error);
            }
        }

        this.processing = false;
    }

    /**
     * Определяет тип ошибки API
     * @param {Error} error - Ошибка
     * @returns {string} - Тип ошибки
     */
    getErrorType(error) {
        const errorMessage = error.message?.toLowerCase() || '';
        const errorCode = error.code || error.status;

        if (errorMessage.includes('rate limit') || errorMessage.includes('too many requests') || errorCode === 429) {
            return 'RATE_LIMIT';
        }

        if (errorMessage.includes('service tier capacity exceeded') || errorMessage.includes('capacity exceeded')) {
            return 'CAPACITY_EXCEEDED';
        }

        return 'OTHER';
    }

    /**
     * Получает текущую задержку с учетом адаптивности
     * @returns {number} - Задержка в миллисекундах
     */
    getCurrentDelay() {
        return this.adaptiveDelay;
    }

    /**
     * Обрабатывает успешный запрос - постепенно снижает задержку
     */
    onSuccess() {
        // Если прошло достаточно времени с последнего серверного rate limit,
        // постепенно снижаем адаптивную задержку
        const now = Date.now();
        if (now - this.lastServerRateLimitTime > 60000) { // 1 минута
            this.serverRateLimitHits = Math.max(0, this.serverRateLimitHits - 1);
            if (this.serverRateLimitHits === 0) {
                this.adaptiveDelay = Math.max(this.minInterval, this.adaptiveDelay * 0.9);
            }
        }
    }

    /**
     * Обрабатывает ошибку - адаптирует задержку при rate limits
     * @param {Error} error - Ошибка
     */
    onError(error) {
        const errorType = this.getErrorType(error);

        if (errorType === 'RATE_LIMIT' || errorType === 'CAPACITY_EXCEEDED') {
            this.serverRateLimitHits++;
            this.lastServerRateLimitTime = Date.now();

            // Увеличиваем задержку при серверных rate limits
            this.adaptiveDelay = Math.min(30000, this.adaptiveDelay * 2); // Максимум 30 секунд
            console.warn(`Server rate limit detected. Increasing delay to ${this.adaptiveDelay}ms`);
        }
    }

    sleep(ms) {
        return new Promise(resolve => setTimeout(resolve, ms));
    }

    /**
     * Получает оставшееся время до следующего доступного запроса
     * @returns {number} - Время в миллисекундах
     */
    getWaitTime() {
        const now = Date.now();
        const timeSinceLastRequest = now - this.lastRequestTime;
        return Math.max(0, this.getCurrentDelay() - timeSinceLastRequest);
    }

    /**
     * Очищает очередь запросов
     */
    clear() {
        this.queue = [];
    }
}

// Создаем глобальный экземпляр rate limiter для Mistral API
// Увеличиваем интервал до 3 секунд для большей надежности при capacity limits
export const mistralRateLimiter = new RateLimiter(1/3);

export default RateLimiter;
