'use client';

import { ArrowUp, Loader2 } from 'lucide-react';
import { useRef } from 'react';

interface ChatInputProps {
  input: string;
  isLoading: boolean;
  onInputChange: (value: string) => void;
  onSubmit: (e: React.FormEvent) => void;
  onStop: () => void;
}

export function ChatInput({ input, isLoading, onInputChange, onSubmit, onStop }: ChatInputProps) {
  const textareaRef = useRef<HTMLTextAreaElement>(null);

  const handleKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      if (!isLoading && input.trim()) {
        e.currentTarget.form?.requestSubmit();
      }
    }
  };

  const handleInput = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
    onInputChange(e.target.value);
    const textarea = textareaRef.current;
    if (textarea) {
      textarea.style.height = 'auto';
      textarea.style.height = `${Math.min(textarea.scrollHeight, 200)}px`;
    }
  };

  return (
    <form onSubmit={onSubmit} className='relative' data-testid='chat-input-form'>
      <div className='relative flex items-center rounded-2xl border border-border/80 bg-card/90 shadow-sm focus-within:ring-2 focus-within:ring-primary/15 focus-within:border-primary/30 transition-shadow'>
        <textarea
          ref={textareaRef}
          value={input}
          onChange={handleInput}
          onKeyDown={handleKeyDown}
          placeholder='어디로 여행 가고 싶으세요? 무엇이든 물어보세요...'
          rows={1}
          className='flex-1 min-h-11 resize-none bg-transparent px-4 py-3 text-sm leading-normal placeholder:text-muted-foreground focus:outline-none max-h-[200px]'
          disabled={isLoading}
          data-testid='chat-input'
        />
        <div className='p-2'>
          {isLoading ? (
            <button
              type='button'
              onClick={onStop}
              className='touch-target flex h-9 w-9 items-center justify-center rounded-full bg-destructive text-destructive-foreground hover:bg-destructive/90 active:scale-[0.98] transition-all duration-150'
              aria-label='응답 생성 중지'
              data-testid='chat-stop'
            >
              <Loader2 className='h-4 w-4 animate-spin' aria-hidden />
            </button>
          ) : (
            <button
              type='submit'
              disabled={!input.trim()}
              className='touch-target flex h-9 w-9 items-center justify-center rounded-full bg-primary text-primary-foreground hover:bg-primary/90 active:scale-[0.98] disabled:opacity-50 disabled:cursor-not-allowed transition-all duration-150'
              aria-label='메시지 전송'
              data-testid='chat-submit'
            >
              <ArrowUp className='h-4 w-4' aria-hidden />
            </button>
          )}
        </div>
      </div>
    </form>
  );
}
