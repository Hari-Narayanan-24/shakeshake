import { apiRequest } from "./apiClient";
import { connectorConfig } from "./config";
import type {
  ChatHistoryResponse,
  ChatMessagesResponse,
  SendMessagePayload,
} from "../types/chat";
import {
  mockGetConversations,
  mockGetMessages,
  mockSendMessage,
  mockMarkRead,
} from "../storage/mockBackend";

export const chatConnector = {
  async getConversations(userId: string): Promise<ChatHistoryResponse> {
    if (!userId.trim()) {
      return { success: true, conversations: [] };
    }
    if (connectorConfig.useMocks) {
      return mockGetConversations(userId);
    }
    return apiRequest<ChatHistoryResponse>(connectorConfig.matchBaseUrl, `/chat/conversations/${userId}`);
  },

  async getMessages(matchId: string): Promise<ChatMessagesResponse> {
    if (!matchId.trim()) {
      return { success: true, messages: [] };
    }
    if (connectorConfig.useMocks) {
      return mockGetMessages(matchId);
    }
    return apiRequest<ChatMessagesResponse>(connectorConfig.matchBaseUrl, `/chat/messages/${matchId}`);
  },

  async sendMessage(
    payload: SendMessagePayload
  ): Promise<{ success: boolean; message?: unknown }> {
    if (!payload.matchId.trim() || !payload.senderId.trim() || !payload.text.trim()) {
      return { success: false, message: "Missing chat message data." };
    }
    if (connectorConfig.useMocks) {
      return mockSendMessage(payload);
    }
    return apiRequest(connectorConfig.matchBaseUrl, "/chat/send", {
      method: "POST",
      body: payload,
    });
  },

  async markRead(matchId: string, userId: string): Promise<{ success: boolean }> {
    if (!matchId.trim() || !userId.trim()) {
      return { success: true };
    }
    if (connectorConfig.useMocks) {
      return mockMarkRead(matchId, userId);
    }
    return apiRequest(connectorConfig.matchBaseUrl, `/chat/mark-read/${matchId}`, {
      method: "POST",
      body: { userId },
    });
  },
};
