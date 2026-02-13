import { useTranslations } from 'next-intl';

import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';

interface SectionErrorProps {
  onRetry: () => void;
}

/**
 * Renders an error card with a title, description, and a retry button.
 *
 * @param onRetry - Callback invoked when the retry button is clicked.
 * @returns A React element containing a Card with centered error text and a retry Button.
 */
export function SectionError({ onRetry }: SectionErrorProps): React.ReactElement {
  const t = useTranslations('common');
  return (
    <Card>
      <CardContent className='py-8 text-center'>
        <p className='font-medium text-foreground'>{t('sectionError.title')}</p>
        <p className='mt-1 text-sm text-muted-foreground'>{t('sectionError.description')}</p>
        <Button variant='outline' onClick={onRetry} className='mt-4'>
          {t('retry')}
        </Button>
      </CardContent>
    </Card>
  );
}
