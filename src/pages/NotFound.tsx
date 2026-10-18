import { Link } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { useDocumentTitle } from '@/lib/hooks';

export function NotFound() {
  const { t } = useTranslation();
  useDocumentTitle(t('notFound.title'));
  return (
    <div className="py-12 text-center">
      <h1 className="font-serif text-2xl font-semibold">{t('notFound.title')}</h1>
      <Link to="/" className="mt-4 inline-block text-accent underline underline-offset-2">
        {t('notFound.back')}
      </Link>
    </div>
  );
}
