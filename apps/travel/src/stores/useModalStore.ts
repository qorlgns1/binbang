'use client';

import { create } from 'zustand';

import type { LoginModalTrigger } from '@/hooks/useChatLoginGate';

interface ModalState {
  showLoginModal: boolean;
  loginModalTrigger: LoginModalTrigger;
  openLoginModal: (trigger: LoginModalTrigger) => void;
  closeLoginModal: () => void;
}

export const useModalStore = create<ModalState>((set) => ({
  showLoginModal: false,
  loginModalTrigger: 'save',
  openLoginModal: (trigger) => set({ showLoginModal: true, loginModalTrigger: trigger }),
  closeLoginModal: () => set({ showLoginModal: false }),
}));
