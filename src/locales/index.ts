import { ko } from './ko';
import { th } from './th';
import { en } from './en';

export const translations = {
  ko,
  th,
  en,
} as const;

export type Language = keyof typeof translations;
export type TranslationKey = keyof typeof ko;