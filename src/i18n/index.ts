import i18n from 'i18next'
import { initReactI18next } from 'react-i18next'
import { browserStorage, readLanguage } from '@/store/persist'
import en from './locales/en.json'
import pt from './locales/pt.json'

// Textos da interface. Conteúdo do portfolio (projetos, experiência...) fica em src/content.
// O idioma escolhido no HUD é lembrado entre visitas (localStorage, `quartoPixel.lang`, gravado
// pelo botão do HUD; sem escolha, segue o navegador).
const storage = browserStorage()

void i18n.use(initReactI18next).init({
  resources: { pt: { translation: pt }, en: { translation: en } },
  lng: readLanguage(storage, typeof navigator === 'undefined' ? undefined : navigator.language),
  fallbackLng: 'pt',
  interpolation: { escapeValue: false },
})

export default i18n
