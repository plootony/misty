/**
 * Сервис для работы с Hawk Error Tracking
 * Предоставляет удобные методы для отправки ошибок и логов
 */

// Глобальная переменная hawk будет доступна после инициализации в main.js
let hawkInstance = null

// Функция для установки hawk instance (вызывается из main.js)
export function setHawkInstance(hawk) {
  hawkInstance = hawk
}

/**
 * Проверяет, инициализирован ли Hawk
 * @returns {boolean}
 */
export function isHawkAvailable() {
  return !!hawkInstance
}

/**
 * Отправляет ошибку в Hawk
 * @param {Error|string} error - Ошибка или сообщение об ошибке
 * @param {Object} context - Дополнительный контекст
 */
export function sendError(error, context = {}) {
  if (!hawkInstance) {
    console.warn('Hawk не инициализирован, ошибка не отправлена:', error)
    return
  }

  try {
    hawkInstance.send(error, {
      timestamp: new Date().toISOString(),
      url: window.location.href,
      userAgent: navigator.userAgent,
      ...context
    })
  } catch (e) {
    console.error('Ошибка при отправке в Hawk:', e)
  }
}

/**
 * Отправляет информационное сообщение в Hawk
 * @param {string} message - Сообщение
 * @param {Object} context - Дополнительный контекст
 */
export function sendLog(message, context = {}) {
  if (!hawkInstance) {
    console.log('Hawk лог:', message, context)
    return
  }

  try {
    hawkInstance.send(message, {
      level: 'info',
      type: 'log',
      timestamp: new Date().toISOString(),
      url: window.location.href,
      ...context
    })
  } catch (e) {
    console.error('Ошибка при отправке лога в Hawk:', e)
  }
}

/**
 * Отправляет предупреждение в Hawk
 * @param {string} message - Сообщение предупреждения
 * @param {Object} context - Дополнительный контекст
 */
export function sendWarning(message, context = {}) {
  if (!hawkInstance) {
    console.warn('Hawk предупреждение:', message, context)
    return
  }

  try {
    hawkInstance.send(`Warning: ${message}`, {
      level: 'warning',
      type: 'warning',
      timestamp: new Date().toISOString(),
      url: window.location.href,
      ...context
    })
  } catch (e) {
    console.error('Ошибка при отправке предупреждения в Hawk:', e)
  }
}

/**
 * Устанавливает информацию о текущем пользователе
 * @param {Object} user - Информация о пользователе
 */
export function setUser(user) {
  if (!hawkInstance) {
    console.warn('Hawk не инициализирован, пользователь не установлен')
    return
  }

  try {
    // Фильтруем чувствительные данные
    const safeUser = {
      id: user.id,
      name: user.name
    }

    // Опционально добавляем url и image, если они безопасны
    if (user.url && !user.url.includes('token') && !user.url.includes('key')) {
      safeUser.url = user.url
    }
    if (user.image && user.image.startsWith('http')) {
      safeUser.image = user.image
    }

    hawkInstance.setUser(safeUser)
  } catch (e) {
    console.error('Ошибка при установке пользователя в Hawk:', e)
  }
}

/**
 * Очищает информацию о пользователе
 */
export function clearUser() {
  if (!hawkInstance) {
    return
  }

  try {
    hawkInstance.clearUser()
  } catch (e) {
    console.error('Ошибка при очистке пользователя в Hawk:', e)
  }
}

/**
 * Устанавливает глобальный контекст для всех отправок
 * @param {Object} context - Контекст
 */
export function setContext(context) {
  if (!hawkInstance) {
    console.warn('Hawk не инициализирован, контекст не установлен')
    return
  }

  try {
    // Фильтруем чувствительные данные из контекста
    const safeContext = { ...context }
    const sensitiveKeys = ['apiKey', 'token', 'password', 'secret', 'key', 'auth']

    sensitiveKeys.forEach(key => {
      if (safeContext[key]) {
        delete safeContext[key]
      }
    })

    hawkInstance.setContext(safeContext)
  } catch (e) {
    console.error('Ошибка при установке контекста в Hawk:', e)
  }
}

/**
 * Тестирует работу Hawk (отправляет тестовую ошибку)
 */
export function testHawk() {
  if (!hawkInstance) {
    console.warn('Hawk не инициализирован')
    return
  }

  try {
    hawkInstance.test()
    console.log('✅ Тестовая ошибка отправлена в Hawk')
  } catch (e) {
    console.error('❌ Ошибка при тестировании Hawk:', e)
  }
}

// Экспортируем методы для использования в приложении
export default {
  setHawkInstance,
  isHawkAvailable,
  sendError,
  sendLog,
  sendWarning,
  setUser,
  clearUser,
  setContext,
  testHawk
}
