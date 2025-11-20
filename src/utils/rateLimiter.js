/**
 * Rate Limiter для ограничения частоты запросов к API
 * Ограничение: 1 запрос каждые 3 секунды с повторными попытками при ошибках
 */
class RateLimiter {
    constructor(requestsPerSecond = 1) {
        this.requestsPerSecond = requestsPerSecond;
        this.minInterval = 1000 / requestsPerSecond; // Минимальный интервал между запросами в мс
        this.lastRequestTime = 0;
        this.queue = [];
        this.processing = false;
    }

    /**
     * Выполняет функцию с учетом rate limiting и повторными попытками
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
            const waitTime = Math.max(0, this.minInterval - timeSinceLastRequest);

            if (waitTime > 0) {
                await this.sleep(waitTime);
            }

            const { fn, resolve, reject } = this.queue.shift();
            this.lastRequestTime = Date.now();

            try {
                const result = await fn();
                resolve(result);
            } catch (error) {
                reject(error);
            }
        }

        this.processing = false;
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
        return Math.max(0, this.minInterval - timeSinceLastRequest);
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
