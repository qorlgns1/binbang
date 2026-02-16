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

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      if (!isLoading && input.trim()) {
        onSubmit(e);
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
    <form onSubmit={onSubmit} className='relative'>
      <div className='relative flex items-end rounded-2xl border border-border bg-card shadow-sm focus-within:ring-2 focus-within:ring-primary/20 focus-within:border-primary/40'>
        <textarea
          ref={textareaRef}
          value={input}
          onChange={handleInput}
          onKeyDown={handleKeyDown}
          placeholder='Where would you like to travel? Ask me anything...'
          rows={1}
          className='flex-1 resize-none bg-transparent px-4 py-3 text-sm placeholder:text-muted-foreground focus:outline-none max-h-[200px]'
          disabled={isLoading}
        />
        <div className='p-2'>
          {isLoading ? (
            <button
              type='button'
              onClick={onStop}
              className='touch-target flex h-8 w-8 items-center justify-center rounded-full bg-destructive text-destructive-foreground hover:bg-destructive/90 transition-colors md:h-8 md:w-8'
            >
              <Loader2 className='h-4 w-4 animate-spin' />
            </button>
          ) : (
            <button
              type='submit'
              disabled={!input.trim()}
              className='touch-target flex h-8 w-8 items-center justify-center rounded-full bg-primary text-primary-foreground hover:bg-primary/90 disabled:opacity-50 disabled:cursor-not-allowed transition-colors md:h-8 md:w-8'
            >
              <ArrowUp className='h-4 w-4' />
            </button>
          )}
        </div>
      </div>
    </form>
  );
}
