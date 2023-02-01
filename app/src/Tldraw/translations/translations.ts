import en from "./en.json"
import main from "./main.json"

export const TRANSLATIONS: TDTranslations = [{locale: "en", label: "English", messages: en}]

/* ----------------- (do not change) ---------------- */

TRANSLATIONS.sort((a, b) => (a.locale < b.locale ? -1 : 1))

export type TDTranslation = {
  readonly locale: string
  readonly label: string
  readonly messages: Partial<typeof main>
}

export type TDTranslations = TDTranslation[]

export type TDLanguage = TDTranslations[number]["locale"]

export function getTranslation(locale: TDLanguage): TDTranslation {
  const translation = TRANSLATIONS.find((t) => t.locale === locale)

  return {
    locale,
    label: translation?.label ?? locale,
    messages: {
      ...main,
      ...translation?.messages
    }
  }
}
