import '@/assets/scss/app.scss'

import { createApp } from 'vue'
import { createPinia } from 'pinia'
import HawkCatcher from '@hawk.so/javascript'

import App from './App.vue'
import router from './router'
import { setHawkInstance } from '@/services/hawk.service'

const app = createApp(App)

app.use(createPinia())
app.use(router)

// Инициализация Hawk Error Tracking (если токен предоставлен)
let hawk = null
if (import.meta.env.VITE_HAWK_INTEGRATION_TOKEN) {
  try {
    hawk = new HawkCatcher({
      token: import.meta.env.VITE_HAWK_INTEGRATION_TOKEN,
      vue: app, // Vue интеграция
      release: import.meta.env.VITE_APP_VERSION || '1.0.0',
      context: {
        environment: import.meta.env.MODE,
        app: 'misty-astrology-platform'
      },
      beforeSend: (event) => {
        // Фильтрация чувствительных данных
        if (event.context) {
          // Удаляем API ключи и токены
          const sensitiveKeys = ['apiKey', 'token', 'password', 'secret', 'key']
          sensitiveKeys.forEach(key => {
            if (event.context[key]) {
              delete event.context[key]
            }
          })

          // Удаляем персональные данные, если они есть
          if (event.context.user) {
            const userContext = { ...event.context.user }
            delete userContext.email // Email может быть чувствительным
            delete userContext.phone // Телефон может быть чувствительным
            event.context.user = userContext
          }
        }

        // Фильтруем сетевые ошибки, которые могут быть шумом
        if (event.message?.includes('Failed to fetch') ||
            event.message?.includes('NetworkError') ||
            event.message?.includes('Load failed')) {
          // Слишком много сетевых ошибок может быть шумом, но оставляем для анализа
          return event
        }

        return event
      }
    })

    // Передаем instance в сервис для использования в компонентах
    setHawkInstance(hawk)

    console.log('✅ Hawk Error Tracking инициализирован')
  } catch (error) {
    console.warn('❌ Не удалось инициализировать Hawk Error Tracking:', error)
  }
} else {
  console.log('ℹ️ Hawk Error Tracking не настроен (отсутствует VITE_HAWK_INTEGRATION_TOKEN)')
}

// Глобальный обработчик ошибок Vue
app.config.errorHandler = (error, instance, info) => {
  console.error('Глобальная ошибка Vue:', {
    error: error.message,
    stack: error.stack,
    component: instance?.$?.type?.name || 'Unknown',
    info,
    timestamp: new Date().toISOString()
  })

  // Отправка ошибки в Hawk (если инициализирован)
  if (hawk && import.meta.env.PROD) {
    hawk.send(error, {
      component: instance?.$?.type?.name || 'Unknown',
      vueInfo: info,
      timestamp: new Date().toISOString(),
      url: window.location.href,
      userAgent: navigator.userAgent
    })
  }
}

// Глобальный обработчик необработанных promise rejection
window.addEventListener('unhandledrejection', (event) => {
  console.error('Необработанное promise rejection:', {
    reason: event.reason,
    promise: event.promise,
    timestamp: new Date().toISOString()
  })

  // Отправка ошибки в Hawk (если инициализирован)
  if (hawk && import.meta.env.PROD) {
    const error = event.reason instanceof Error ? event.reason : new Error(String(event.reason))
    hawk.send(error, {
      type: 'unhandledrejection',
      timestamp: new Date().toISOString(),
      url: window.location.href,
      userAgent: navigator.userAgent,
      originalReason: event.reason
    })
  }

  // Предотвращаем вывод в консоль браузера
  event.preventDefault()
})

// Глобальный обработчик необработанных ошибок
window.addEventListener('error', (event) => {
  console.error('Необработанная ошибка:', {
    message: event.message,
    filename: event.filename,
    lineno: event.lineno,
    colno: event.colno,
    error: event.error,
    timestamp: new Date().toISOString()
  })

  // Отправка ошибки в Hawk (если инициализирован)
  if (hawk && import.meta.env.PROD) {
    const error = event.error instanceof Error ? event.error : new Error(event.message)
    hawk.send(error, {
      type: 'global-error',
      filename: event.filename,
      lineno: event.lineno,
      colno: event.colno,
      timestamp: new Date().toISOString(),
      url: window.location.href,
      userAgent: navigator.userAgent
    })
  }
})

app.mount('#app')

// Экспортируем hawk для использования в других модулях (опционально)
if (hawk) {
  window.hawk = hawk
}
