/**
 * Условное логирование для разных сред
 * В production отключает console.log и console.warn
 */

const isProduction = import.meta.env.PROD

// Создаем безопасные версии console методов
const safeConsole = {
  log: isProduction ? () => {} : console.log,
  warn: isProduction ? () => {} : console.warn,
  error: console.error, // Ошибки всегда логируем
  info: isProduction ? () => {} : console.info,
  debug: isProduction ? () => {} : console.debug
}

// Условное логирование с уровнями
export const logger = {
  // Отладочные сообщения (только в development)
  debug: (...args) => safeConsole.debug('[DEBUG]', ...args),

  // Информационные сообщения (только в development)
  info: (...args) => safeConsole.info('[INFO]', ...args),

  // Предупреждения (только в development)
  warn: (...args) => safeConsole.warn('[WARN]', ...args),

  // Ошибки (всегда логируем)
  error: (...args) => safeConsole.error('[ERROR]', ...args),

  // Критические ошибки с дополнительной информацией
  critical: (error, context = {}) => {
    safeConsole.error('[CRITICAL]', {
      error: error.message,
      stack: error.stack,
      context,
      timestamp: new Date().toISOString(),
      url: window.location.href,
      userAgent: navigator.userAgent
    })

    // В production можно отправлять в систему мониторинга
    if (isProduction) {
      // TODO: Отправка в Sentry/LogRocket
      // reportCriticalError(error, context)
    }
  }
}

export default logger
