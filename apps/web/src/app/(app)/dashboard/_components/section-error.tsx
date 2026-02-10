import { ERROR_BUTTON, ERROR_DESCRIPTION, ERROR_TITLE } from '@/app/(app)/dashboard/_lib/constants';
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
  return (
    <Card>
      <CardContent className='py-8 text-center'>
        <p className='font-medium text-foreground'>{ERROR_TITLE}</p>
        <p className='mt-1 text-sm text-muted-foreground'>{ERROR_DESCRIPTION}</p>
        <Button
          variant='outline'
          onClick={onRetry}
          className='mt-4'
        >
          {ERROR_BUTTON}
        </Button>
      </CardContent>
    </Card>
  );
}
