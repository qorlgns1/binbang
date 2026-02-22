'use client';

import type { UIMessage } from 'ai';
import { Bot } from 'lucide-react';
import type { RefObject } from 'react';

import { ChatMessage } from '@/components/chat/ChatMessage';
import { ChatPanelEmptyState } from '@/components/chat/ChatPanelSections';

interface ChatMessageListProps {
  messages: UIMessage[];
  status: string;
  exampleQueries: string[];
  scrollAreaRef: RefObject<HTMLDivElement | null>;
  messagesEndRef: RefObject<HTMLDivElement | null>;
  onExampleClick: (query: string) => void;
}

export function ChatMessageList({
  messages,
  status,
  exampleQueries,
  scrollAreaRef,
  messagesEndRef,
  onExampleClick,
}: ChatMessageListProps) {
  return (
    <div
      ref={scrollAreaRef}
      className='flex-1 overflow-y-auto scrollbar-hide px-4 md:px-5 py-5'
      data-testid='chat-message-list'
    >
      {messages.length === 0 ? (
        <ChatPanelEmptyState queries={exampleQueries} onExampleClick={onExampleClick} />
      ) : (
        <div className='flex flex-col gap-0'>
          {messages.map((message, idx) => {
            const isLast = idx === messages.length - 1;
            const isStreamingAssistant = status === 'streaming' && isLast && message.role === 'assistant';

            return (
              <div
                key={message.id}
                className='message-block first:pt-0 first:mt-0 last:pb-4 last:mb-0 last:border-b-0'
                data-testid={`chat-message-${message.role}`}
              >
                <ChatMessage message={message} isStreaming={isStreamingAssistant} />
              </div>
            );
          })}
          {status === 'streaming' && (messages.length === 0 || messages[messages.length - 1]?.role === 'user') && (
            <div className='message-block flex gap-3 first:pt-0 first:mt-0' aria-live='polite' aria-busy='true'>
              <div className='flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-muted/80 text-muted-foreground ring-1 ring-border/40'>
                <Bot className='h-4 w-4' aria-hidden />
              </div>
              <div className='flex flex-1 items-center gap-1.5 rounded-2xl bg-muted/30 px-4 py-3 w-fit'>
                <span className='h-2 w-2 rounded-full bg-muted-foreground/50 animate-bounce [animation-delay:0ms]' />
                <span className='h-2 w-2 rounded-full bg-muted-foreground/50 animate-bounce [animation-delay:150ms]' />
                <span className='h-2 w-2 rounded-full bg-muted-foreground/50 animate-bounce [animation-delay:300ms]' />
              </div>
            </div>
          )}
        </div>
      )}
      <div ref={messagesEndRef} />
    </div>
  );
}
