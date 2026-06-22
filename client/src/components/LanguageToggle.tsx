import { useTranslation } from 'react-i18next';
import { setLanguage } from '../i18n';

export function LanguageToggle() {
  const { i18n } = useTranslation();
  const isAr = i18n.language === 'ar';

  return (
    <button
      type="button"
      onClick={() => setLanguage(isAr ? 'en' : 'ar')}
      className="rounded-lg border border-brown-border bg-cream px-3 py-1.5 text-sm font-medium text-brown transition hover:border-brown hover:bg-cream-dark"
    >
      {isAr ? 'English' : 'العربية'}
    </button>
  );
}
