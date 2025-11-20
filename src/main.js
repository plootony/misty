import '@/assets/scss/app.scss'

import { createApp } from 'vue'
import { createPinia } from 'pinia'

import App from './App.vue'
import router from './router'

const app = createApp(App)

app.use(createPinia())
app.use(router)

// Глобальный обработчик ошибок Vue
app.config.errorHandler = (error, instance, info) => {
  console.error('Глобальная ошибка Vue:', {
    error: error.message,
    stack: error.stack,
    component: instance?.$?.type?.name || 'Unknown',
    info,
    timestamp: new Date().toISOString()
  })

  // В production можно отправлять ошибки на сервер мониторинга
  if (import.meta.env.PROD) {
    // TODO: Отправка ошибки в систему мониторинга (Sentry, LogRocket и т.д.)
    // reportError(error, { component: instance, info })
  }
}

// Глобальный обработчик необработанных promise rejection
window.addEventListener('unhandledrejection', (event) => {
  console.error('Необработанное promise rejection:', {
    reason: event.reason,
    promise: event.promise,
    timestamp: new Date().toISOString()
  })

  // Предотвращаем вывод в консоль браузера
  event.preventDefault()

  if (import.meta.env.PROD) {
    // TODO: Отправка ошибки в систему мониторинга
    // reportError(event.reason, { type: 'unhandledrejection' })
  }
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

  if (import.meta.env.PROD) {
    // TODO: Отправка ошибки в систему мониторинга
    // reportError(event.error, { type: 'global' })
  }
})

app.mount('#app')
