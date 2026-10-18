import { createApp } from 'vue'
import { createPinia } from 'pinia'
import App from './App.vue'
import '@/style.css'
import ElementPlus from 'element-plus'
import 'element-plus/dist/index.css'
import 'ol/ol.css'
const app = createApp(App)

app.use(createPinia())
app.use(ElementPlus)
app.mount('#app')
