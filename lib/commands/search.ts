import { defaultFilter } from 'cmdk';

const fold = (text: string) => text.normalize('NFD').replace(/\p{Diacritic}/gu, '');

export const matchCommand = (value: string, search: string, keywords?: string[]) =>
  defaultFilter(fold(value), fold(search), keywords?.map(fold));
