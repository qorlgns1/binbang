'use client';

import type { UIMessage } from 'ai';
import { Bot, User } from 'lucide-react';
import Markdown from 'react-markdown';

import { ChatToolPart } from '@/components/chat/ChatToolPart';
import type { PlaceEntity } from '@/lib/types';

interface ChatMessageProps {
  message: UIMessage;
  onPlaceSelect?: (place: PlaceEntity) => void;
  onPlaceHover?: (placeId: string | undefined) => void;
  onAlertClick?: (place: PlaceEntity) => void;
  selectedPlaceId?: string;
  mapHoveredEntityId?: string;
  isStreaming?: boolean;
  conversationId?: string;
  sessionId?: string;
}

export function ChatMessage({
  message,
  onPlaceSelect,
  onPlaceHover,
  onAlertClick,
  selectedPlaceId,
  mapHoveredEntityId,
  isStreaming,
  conversationId,
  sessionId,
}: ChatMessageProps) {
  const isUser = message.role === 'user';

  return (
    <div className={`flex gap-3 ${isUser ? 'flex-row-reverse' : ''}`}>
      <div
        className={`flex h-9 w-9 shrink-0 items-center justify-center rounded-full ring-1 ring-border/40 ${
          isUser ? 'bg-primary text-primary-foreground' : 'bg-muted/80 text-muted-foreground'
        }`}
        aria-hidden
      >
        {isUser ? <User className='h-4 w-4' /> : <Bot className='h-4 w-4' />}
      </div>
      <div className={`flex-1 min-w-0 space-y-2 ${isUser ? 'text-right' : ''}`}>
        {isUser ? (
          <div className='inline-block rounded-3xl bg-primary px-4 py-2.5 text-sm text-primary-foreground max-w-[85%]'>
            {message.parts.map((part, idx) =>
              part.type === 'text' ? <span key={`text-${message.id ?? 'msg'}-${idx}`}>{part.text}</span> : null,
            )}
          </div>
        ) : (
          <div className='space-y-2'>
            {message.parts.map((part, idx) => {
              if (part.type === 'text') {
                return (
                  <div
                    key={`md-${message.id ?? 'msg'}-${idx}`}
                    className='rounded-2xl bg-muted/30 dark:bg-muted/20 px-4 py-3.5 prose prose-sm max-w-none dark:prose-invert prose-p:leading-relaxed prose-p:my-2.5 first:prose-p:mt-0 last:prose-p:mb-0 prose-ul:my-2.5 prose-ul:list-disc prose-ul:pl-5 prose-ol:my-2.5 prose-ol:list-decimal prose-ol:pl-5 prose-li:my-0.5 prose-pre:my-2.5 prose-pre:rounded-xl prose-pre:bg-muted/60 prose-pre:p-4 prose-pre:overflow-x-auto prose-pre:border prose-pre:border-border/40 prose-code:bg-muted/80 prose-code:px-1.5 prose-code:py-0.5 prose-code:rounded-md prose-code:text-sm prose-code:before:content-none prose-code:after:content-none text-[0.9375rem] sm:text-base'
                    style={{ letterSpacing: '0.01em' }}
                  >
                    <Markdown>{part.text}</Markdown>
                    {isStreaming && (
                      <span
                        className='ml-0.5 inline-block h-4 w-1 animate-pulse rounded-sm bg-primary/70 align-middle'
                        aria-hidden
                      />
                    )}
                  </div>
                );
              }

              const toolPart = part as unknown as { type: string; toolCallId?: string };
              const key = toolPart.toolCallId ?? `part-${part.type}-${idx}`;
              return (
                <ChatToolPart
                  key={key}
                  part={part}
                  onPlaceSelect={onPlaceSelect}
                  onPlaceHover={onPlaceHover}
                  onAlertClick={onAlertClick}
                  selectedPlaceId={selectedPlaceId}
                  mapHoveredEntityId={mapHoveredEntityId}
                  conversationId={conversationId}
                  sessionId={sessionId}
                />
              );
            })}
            <p className='text-[10px] text-muted-foreground/80 mt-1.5 -ml-1 flex items-center gap-0.5' aria-hidden>
              방금
            </p>
          </div>
        )}
      </div>
    </div>
  );
}
