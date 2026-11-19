import { create } from 'zustand';

export type ChatTabFilter = 'ALL' | 'UNREAD' | 'TRADING';

interface ChatStoreState {
  activeConversationId: number;
  searchKeyword: string;
  activeTab: ChatTabFilter;
  dealModalOpen: boolean;
  setActiveConversationId: (id: number) => void;
  setSearchKeyword: (keyword: string) => void;
  setActiveTab: (tab: ChatTabFilter) => void;
  setDealModalOpen: (open: boolean) => void;
}

export const useChatStore = create<ChatStoreState>((set) => ({
  activeConversationId: 501,
  searchKeyword: '',
  activeTab: 'ALL',
  dealModalOpen: false,
  setActiveConversationId: (id) => set({ activeConversationId: id }),
  setSearchKeyword: (keyword) => set({ searchKeyword: keyword }),
  setActiveTab: (tab) => set({ activeTab: tab }),
  setDealModalOpen: (open) => set({ dealModalOpen: open }),
}));
