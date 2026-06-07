export type ChatMessage = {
  id: string;
  matchId: string;
  senderId: string;
  text: string;
  timestamp: string; // ISO 8601
};

export type ChatConversation = {
  matchId: string;
  userId: string;
  matchedUserId: string;
  matchedUserName: string;
  matchPercentage: number;
  catchPhrase: string;
  lastMessage?: ChatMessage;
  unreadCount: number;
  createdAt: string;
};

export type SendMessagePayload = {
  matchId: string;
  senderId: string;
  text: string;
};

export type ChatHistoryResponse = {
  success: boolean;
  conversations: ChatConversation[];
};

export type ChatMessagesResponse = {
  success: boolean;
  messages: ChatMessage[];
};
