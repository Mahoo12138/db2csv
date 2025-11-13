import { createApp } from 'vue'
import { createVuetify } from 'vuetify'
import * as components from 'vuetify/components'
import * as directives from 'vuetify/directives'
// @ts-ignore
import 'vuetify/styles'
import '@mdi/font/css/materialdesignicons.css'

import './style.css'
import App from './App.vue'
import router from './router'

// 创建 Vuetify 实例
const vuetify = createVuetify({
  components,
  directives,
  theme: {
    defaultTheme: 'light',
    themes: {
      light: {
        colors: {
          primary: '#3b82f6',
          secondary: '#64748b',
          background: '#f8fafc',
          surface: '#ffffff',
          error: '#ef4444',
          info: '#3b82f6',
          success: '#10b981',
          warning: '#f59e0b',
        },
      },
      dark: {
        colors: {
          primary: '#60a5fa',
          secondary: '#94a3b8',
          background: '#0f172a',
          surface: '#1e293b',
          error: '#f87171',
          info: '#60a5fa',
          success: '#34d399',
          warning: '#fbbf24',
        },
      },
    },
  },
})

// 创建应用实例并使用 Vuetify 和 Router
const app = createApp(App)
app.use(vuetify)
app.use(router)
app.mount('#app')
