'use client';

import { useCallback, useState } from 'react';
import { toast } from 'sonner';

import type { PlaceEntity } from '@/lib/types';

export type LoginModalTrigger = 'save' | 'history' | 'bookmark' | 'limit';

interface UseChatLoginGateOptions {
  authStatus: 'authenticated' | 'unauthenticated' | 'loading';
  messagesCount: number;
  onOpenHistory: () => void;
}

interface UseChatLoginGateResult {
  showLoginModal: boolean;
  loginModalTrigger: LoginModalTrigger;
  closeLoginModal: () => void;
  openLoginModalForRateLimit: () => void;
  handleAlertClick: (_place: PlaceEntity) => void;
  handleHistoryClick: () => void;
  handleSaveClick: () => void;
}

export function useChatLoginGate({
  authStatus,
  messagesCount,
  onOpenHistory,
}: UseChatLoginGateOptions): UseChatLoginGateResult {
  const [showLoginModal, setShowLoginModal] = useState(false);
  const [loginModalTrigger, setLoginModalTrigger] = useState<LoginModalTrigger>('save');

  const openLoginModal = useCallback((trigger: LoginModalTrigger) => {
    setLoginModalTrigger(trigger);
    setShowLoginModal(true);
  }, []);

  const closeLoginModal = useCallback(() => {
    setShowLoginModal(false);
  }, []);

  const handleAlertClick = useCallback(
    (_place: PlaceEntity) => {
      if (authStatus === 'authenticated') {
        toast.info('빈방 알림 기능은 준비 중이에요.');
        return;
      }

      openLoginModal('bookmark');
    },
    [authStatus, openLoginModal],
  );

  const handleSaveClick = useCallback(() => {
    if (messagesCount === 0) {
      toast.info('저장할 대화가 아직 없어요.');
      return;
    }

    if (authStatus === 'authenticated') {
      onOpenHistory();
      return;
    }

    openLoginModal('save');
  }, [authStatus, messagesCount, onOpenHistory, openLoginModal]);

  const handleHistoryClick = useCallback(() => {
    if (authStatus === 'authenticated') {
      onOpenHistory();
      return;
    }

    openLoginModal('history');
  }, [authStatus, onOpenHistory, openLoginModal]);

  const openLoginModalForRateLimit = useCallback(() => {
    openLoginModal('limit');
  }, [openLoginModal]);

  return {
    showLoginModal,
    loginModalTrigger,
    closeLoginModal,
    openLoginModalForRateLimit,
    handleAlertClick,
    handleHistoryClick,
    handleSaveClick,
  };
}
