import { apiRequest } from "./apiClient";
import { connectorConfig } from "./config";
import { mockGetSettings, mockSaveSettings } from "../storage/mockBackend";

export type UserSettings = {
  ollamaModel: string;
  ollamaUrl: string;
};

export type SettingsResponse = {
  success: boolean;
  ollamaModel?: string;
  ollamaUrl?: string;
};

export const settingsConnector = {
  async getSettings(userId: string): Promise<SettingsResponse> {
    if (!userId.trim()) {
      return { success: true, ollamaModel: "llama3", ollamaUrl: "http://localhost:11434" };
    }
    if (connectorConfig.useMocks) {
      return mockGetSettings(userId) as Promise<SettingsResponse>;
    }
    return apiRequest<SettingsResponse>(connectorConfig.authBaseUrl, `/settings/${userId}`);
  },

  async saveSettings(userId: string, settings: UserSettings): Promise<{ success: boolean }> {
    if (!userId.trim()) {
      return { success: false };
    }
    if (connectorConfig.useMocks) {
      return mockSaveSettings(userId, settings) as Promise<{ success: boolean }>;
    }
    return apiRequest<{ success: boolean }>(connectorConfig.authBaseUrl, `/settings/${userId}`, {
      method: "PUT",
      body: settings,
    });
  },
};
