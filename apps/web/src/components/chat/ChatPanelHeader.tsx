import { History, Save } from 'lucide-react';

interface ChatPanelHeaderProps {
  onHistoryClick: () => void;
  onNewConversation: () => void;
  onSaveClick: () => void;
}

export function ChatPanelHeader({ onHistoryClick, onNewConversation, onSaveClick }: ChatPanelHeaderProps) {
  return (
    <div className='flex items-center justify-between border-b border-border/60 bg-transparent px-4 py-3'>
      <button
        type='button'
        onClick={onNewConversation}
        className='text-sm font-medium text-muted-foreground transition-colors hover:bg-foreground/5 hover:text-foreground rounded-full px-3 py-2 -ml-2'
        aria-label='새 대화 시작'
      >
        새 대화
      </button>
      <div className='flex items-center gap-0.5'>
        <button
          type='button'
          onClick={onSaveClick}
          className='p-2 rounded-full text-muted-foreground transition-colors hover:bg-foreground/5 hover:text-foreground'
          aria-label='대화 저장'
          title='대화 저장'
        >
          <Save className='h-4 w-4' />
        </button>
        <button
          type='button'
          onClick={onHistoryClick}
          className='p-2 rounded-full text-muted-foreground transition-colors hover:bg-foreground/5 hover:text-foreground'
          aria-label='대화 히스토리'
          title='대화 히스토리'
        >
          <History className='h-4 w-4' />
        </button>
      </div>
    </div>
  );
}
