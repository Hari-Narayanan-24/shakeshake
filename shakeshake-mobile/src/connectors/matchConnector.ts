import type { DayAvailability, MatchRequestPayload, MatchResponse } from "../types/home";
import { apiRequest } from "./apiClient";
import { connectorConfig } from "./config";
import {
  mockFindMatch,
  mockConnectMatch,
  mockGetMatchHistory,
  mockGetPendingMatches,
} from "../storage/mockBackend";

export const matchConnector = {
  async findMatch(payload: MatchRequestPayload): Promise<MatchResponse> {
    if (!payload.userId?.trim()) {
      return {
        success: false,
        matched: false,
        message: "Create or sign in to your profile before matching.",
      };
    }
    if (connectorConfig.useMocks) {
      return mockFindMatch(payload);
    }
    return apiRequest<MatchResponse>(connectorConfig.matchBaseUrl, "/match/shake", {
      method: "POST",
      body: payload,
    });
  },

  async connectMatch(matchId: string, userId: string) {
    if (!matchId.trim() || !userId.trim()) {
      return { success: false, message: "Missing match or user id." };
    }
    if (connectorConfig.useMocks) {
      return mockConnectMatch(matchId, userId);
    }
    return apiRequest<{ success: boolean; message?: string }>(
      connectorConfig.matchBaseUrl,
      `/match/${matchId}/connect`,
      {
        method: "POST",
        body: { userId },
      }
    );
  },

  async getMatchHistory(userId: string) {
    if (!userId.trim()) {
      return { success: true, matches: [] };
    }
    if (connectorConfig.useMocks) {
      return mockGetMatchHistory(userId);
    }
    return apiRequest<{ success: boolean; matches: unknown[] }>(
      connectorConfig.matchBaseUrl,
      `/match/history/${userId}`,
      {
        method: "GET",
      }
    );
  },

  async getPendingMatches(userId: string) {
    if (!userId.trim()) {
      return [];
    }
    if (connectorConfig.useMocks) {
      return mockGetPendingMatches(userId);
    }
    return [];
  },
};
