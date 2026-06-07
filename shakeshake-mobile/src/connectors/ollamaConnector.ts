import { apiRequest } from "./apiClient";
import { connectorConfig } from "./config";
import { mockGenerateChatReply, mockCheckOllamaStatus } from "../storage/mockBackend";

export type OllamaGenerateParams = {
  prompt: string;
  context?: string;
  model?: string;
  userId?: string;
};

export type OllamaStatusResponse = {
  success: boolean;
  online: boolean;
  models?: string[];
};

export type OllamaGenerateResponse = {
  success: boolean;
  response?: string;
  model?: string;
  message?: string;
};

export const ollamaConnector = {
  async generateChatReply(
    params: OllamaGenerateParams
  ): Promise<OllamaGenerateResponse> {
    if (connectorConfig.useMocks) {
      return mockGenerateChatReply(params.prompt);
    }
    return apiRequest<OllamaGenerateResponse>(connectorConfig.matchBaseUrl, "/ollama/generate", {
      method: "POST",
      body: params,
    });
  },

  async checkStatus(): Promise<OllamaStatusResponse> {
    if (connectorConfig.useMocks) {
      return mockCheckOllamaStatus();
    }
    return apiRequest<OllamaStatusResponse>(connectorConfig.matchBaseUrl, "/ollama/status");
  },
};
