import { ERROR_BUTTON, ERROR_DESCRIPTION, ERROR_TITLE } from '@/app/(app)/dashboard/_lib/constants';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';

interface SectionErrorProps {
  onRetry: () => void;
}

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
