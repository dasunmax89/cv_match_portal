import { Injectable, signal } from '@angular/core';
import { EN } from './en';
import { NL } from './nl';

export type LanguageCode = 'en' | 'nl';

@Injectable({
  providedIn: 'root'
})
export class TranslationService {
  private readonly STORAGE_KEY = 'portal_lang';
  private dictionaries: Record<LanguageCode, Record<string, string>> = {
    en: EN,
    nl: NL
  };

  currentLang = signal<LanguageCode>(this.getInitialLanguage());

  private getInitialLanguage(): LanguageCode {
    const saved = localStorage.getItem(this.STORAGE_KEY) as LanguageCode;
    if (saved && (saved === 'en' || saved === 'nl')) {
      return saved;
    }
    return 'en';
  }

  setLanguage(lang: LanguageCode): void {
    this.currentLang.set(lang);
    localStorage.setItem(this.STORAGE_KEY, lang);
  }

  translate(key: string): string {
    const lang = this.currentLang();
    const dict = this.dictionaries[lang];
    if (dict && dict[key]) {
      return dict[key];
    }
    // Fallback to English dictionary
    if (this.dictionaries.en[key]) {
      return this.dictionaries.en[key];
    }
    // Default key fallback
    return key;
  }
}
