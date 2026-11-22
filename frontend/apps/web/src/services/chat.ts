import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { http, httpBlocking } from '@ulis/apis';
import { localDb } from './local-db';
import type { ChatConversationItem, ChatMessageItem } from './mock-data';

export const chatQueryKey = {
  conversations: () => ['chat', 'conversations'] as const,
  messages: (conversationId: number) => ['chat', 'messages', conversationId] as const,
};

export interface SendMessagePayload {
  conversationId: number;
  content: string;
  senderId: number;
  senderName: string;
  isAppointment?: boolean;
}

export const useConversations = () =>
  useQuery({
    queryKey: chatQueryKey.conversations(),
    refetchInterval: 4000,
    queryFn: async (): Promise<ChatConversationItem[]> => {
      try {
        const res = await http.post<{ data?: { content?: ChatConversationItem[] } }>(
          '/conversations/search',
          { pageNumber: 1, pageSize: 20 },
        );
        if (Array.isArray(res.data?.data?.content)) {
          return res.data.data.content;
        }
      } catch {
        // Fallback local DB
      }
      return localDb.getConversations();
    },
  });

export const useConversationMessages = (conversationId: number) =>
  useQuery({
    queryKey: chatQueryKey.messages(conversationId),
    enabled: conversationId > 0,
    refetchInterval: conversationId > 0 ? 3000 : false,
    queryFn: async (): Promise<ChatMessageItem[]> => {
      try {
        const res = await http.post<{ data?: { content?: ChatMessageItem[] } }>(
          `/conversations/${conversationId}/messages`,
          { pageNumber: 1, pageSize: 30 },
        );
        if (Array.isArray(res.data?.data?.content)) {
          return res.data.data.content;
        }
      } catch {
        // Fallback local DB
      }
      const allMap = localDb.getMessages();
      return allMap[conversationId] ?? [];
    },
  });

export const useOpenConversation = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (payload: {
      bookPostId: number;
      peerId: number;
    }): Promise<ChatConversationItem> => {
      const res = await httpBlocking.post<{ data?: ChatConversationItem }>(
        '/conversations/open',
        payload,
      );
      return res.data.data as ChatConversationItem;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: chatQueryKey.conversations() });
    },
  });
};

export const useSendMessage = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (payload: SendMessagePayload): Promise<ChatMessageItem> => {
      try {
        const res = await httpBlocking.post<{ data?: ChatMessageItem }>(
          `/conversations/${payload.conversationId}/messages/send`,
          { content: payload.content.trim() },
        );
        if (res.data?.data) return res.data.data;
      } catch {
        // Fallback local DB
      }
      const allMap = localDb.getMessages();
      const current = allMap[payload.conversationId] ?? [];
      const newMsg: ChatMessageItem = {
        id: Date.now(),
        conversationId: payload.conversationId,
        senderId: payload.senderId,
        senderName: payload.senderName,
        content: payload.content.trim(),
        createdAt: 'Vừa xong',
        isRead: true,
        isAppointment: payload.isAppointment,
      };
      allMap[payload.conversationId] = [...current, newMsg];
      localDb.saveMessages(allMap);

      const convs = localDb.getConversations().map((c) =>
        c.id === payload.conversationId
          ? {
              ...c,
              lastMessage: payload.content.trim(),
              lastMessageTime: 'Vừa xong',
              isLastFromMe: true,
              unreadCount: 0,
            }
          : c,
      );
      localDb.saveConversations(convs);
      return newMsg;
    },
    onSettled: (_d, _e, vars) => {
      queryClient.invalidateQueries({ queryKey: chatQueryKey.messages(vars.conversationId) });
      queryClient.invalidateQueries({ queryKey: chatQueryKey.conversations() });
    },
  });
};

export const useMarkConversationRead = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (conversationId: number): Promise<number> => {
      try {
        await http.put(`/conversations/${conversationId}/read`);
      } catch {
        // Fallback local DB
      }
      const convs = localDb
        .getConversations()
        .map((c) => (c.id === conversationId ? { ...c, unreadCount: 0 } : c));
      localDb.saveConversations(convs);
      return conversationId;
    },
    onSettled: () => {
      queryClient.invalidateQueries({ queryKey: chatQueryKey.conversations() });
    },
  });
};
