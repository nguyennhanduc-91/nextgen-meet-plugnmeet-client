import i18n from 'i18next';
import { initReactI18next } from 'react-i18next';
import HttpApi from 'i18next-http-backend';
import { getConfigValue } from './utils';

declare const IS_PRODUCTION: boolean;
const assetPath = getConfigValue(
  'staticAssetsPath',
  '/assets',
  'STATIC_ASSETS_PATH',
);

i18n
  .use(initReactI18next)
  .use(HttpApi)
  .init({
    debug: !IS_PRODUCTION,
    lng: getConfigValue('defaultLanguage', 'vi-VN', 'DEFAULT_LANGUAGE'),
    fallbackLng: 'en',
    supportedLngs: [
      'vi-VN', 'en', 'ar-SA', 'bn-BD', 'cs-CZ', 'da-DK', 'de-DE',
      'el-GR', 'es-ES', 'et-EE', 'fa-IR', 'fi-FI', 'fr-FR', 'he-IL',
      'hr-HR', 'hu-HU', 'id-ID', 'it-IT', 'ja-JP', 'ko-KR', 'lv-LV',
      'nl-NL', 'no-NO', 'pl-PL', 'pt-PT', 'ro-RO', 'ru-RU', 'sv-SE',
      'tr-TR', 'uk-UA', 'zh-CN', 'zh-TW',
    ],
    load: 'currentOnly',
    interpolation: {
      escapeValue: false,
    },
    backend: {
      loadPath: assetPath + '/locales/{{lng}}/{{ns}}.json',
    },
  });

export default i18n;
