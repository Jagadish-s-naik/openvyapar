import { useAppStore } from '../store/useAppStore';
import { getTranslations } from './translations';

export const useTranslation = () => {
  const language = useAppStore((state) => state.language);
  const setLanguage = useAppStore((state) => state.setLanguage);
  const t = getTranslations(language);

  return { t, language, setLanguage };
};
