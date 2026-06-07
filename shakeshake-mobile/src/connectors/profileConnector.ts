import type {
  IdentityPayload,
  IdentityResponse,
  InterestPayload,
  InterestResponse,
  PersonalityTraitsPayload,
  PersonalityTraitsResponse,
  ProfileCreatePayload,
  ProfileResponse,
} from "../types/onboarding";
import { apiRequest } from "./apiClient";
import { connectorConfig } from "./config";
import {
  mockGetProfile,
  mockCreateProfile,
  mockUpdateProfile,
  mockSaveIdentity,
  mockGetIdentity,
  mockSaveInterests,
  mockGetInterests,
  mockSavePersonality,
  mockGetPersonality,
} from "../storage/mockBackend";

export const profileConnector = {
  async createProfile(payload: ProfileCreatePayload): Promise<ProfileResponse> {
    if (connectorConfig.useMocks) {
      return mockCreateProfile(payload) as Promise<ProfileResponse>;
    }
    return apiRequest<ProfileResponse>(connectorConfig.profileBaseUrl, "/profile/create", {
      method: "POST",
      body: payload,
    });
  },

  async getProfile(userId: string): Promise<ProfileResponse> {
    if (!userId.trim()) {
      return { success: false, message: "Missing user id." } as ProfileResponse;
    }
    if (connectorConfig.useMocks) {
      return mockGetProfile(userId) as Promise<ProfileResponse>;
    }
    return apiRequest<ProfileResponse>(connectorConfig.profileBaseUrl, `/profile/${userId}`, {
      method: "GET",
    });
  },

  async updateProfile(
    userId: string,
    payload: { name?: string; bio?: string; major?: string; age_range?: string }
  ): Promise<{ success: boolean }> {
    if (!userId.trim()) {
      return { success: false };
    }
    if (connectorConfig.useMocks) {
      return mockUpdateProfile(userId, payload) as Promise<{ success: boolean }>;
    }
    return apiRequest<{ success: boolean }>(connectorConfig.profileBaseUrl, `/profile/${userId}`, {
      method: "PUT",
      body: payload,
    });
  },

  async saveIdentity(userId: string, payload: IdentityPayload): Promise<IdentityResponse> {
    if (!userId.trim()) {
      return { success: false, message: "Missing user id." } as IdentityResponse;
    }
    if (connectorConfig.useMocks) {
      return mockSaveIdentity(userId, payload) as Promise<IdentityResponse>;
    }
    return apiRequest<IdentityResponse>(connectorConfig.profileBaseUrl, `/profile/${userId}/identity`, {
      method: "POST",
      body: payload,
    });
  },

  async getIdentity(userId: string): Promise<IdentityResponse> {
    if (!userId.trim()) {
      return { success: true, gender: "", orientation: "", religion: "", religion_openness: "" } as IdentityResponse;
    }
    if (connectorConfig.useMocks) {
      return mockGetIdentity(userId) as Promise<IdentityResponse>;
    }
    return apiRequest<IdentityResponse>(connectorConfig.profileBaseUrl, `/profile/${userId}/identity`, {
      method: "GET",
    });
  },

  async saveInterests(userId: string, payload: InterestPayload): Promise<InterestResponse> {
    if (!userId.trim()) {
      return { success: false, message: "Missing user id." } as InterestResponse;
    }
    if (connectorConfig.useMocks) {
      return mockSaveInterests(userId, payload) as Promise<InterestResponse>;
    }
    return apiRequest<InterestResponse>(connectorConfig.profileBaseUrl, `/profile/${userId}/interests`, {
      method: "POST",
      body: payload,
    });
  },

  async getInterests(userId: string): Promise<InterestResponse> {
    if (!userId.trim()) {
      return { success: true, hobbies: [], music: [], movies: [], tv: [], games: [] } as InterestResponse;
    }
    if (connectorConfig.useMocks) {
      return mockGetInterests(userId) as Promise<InterestResponse>;
    }
    return apiRequest<InterestResponse>(connectorConfig.profileBaseUrl, `/profile/${userId}/interests`, {
      method: "GET",
    });
  },

  async savePersonality(userId: string, payload: PersonalityTraitsPayload): Promise<PersonalityTraitsResponse> {
    if (!userId.trim()) {
      return { success: false, message: "Missing user id." } as PersonalityTraitsResponse;
    }
    if (connectorConfig.useMocks) {
      return mockSavePersonality(userId, payload) as Promise<PersonalityTraitsResponse>;
    }
    return apiRequest<PersonalityTraitsResponse>(connectorConfig.profileBaseUrl, `/profile/${userId}/personality`, {
      method: "POST",
      body: payload,
    });
  },

  async getPersonality(userId: string): Promise<PersonalityTraitsResponse> {
    if (!userId.trim()) {
      return { success: true, mbti: "", listener_speaker: 0.5, dominant_passive: 0.5, emotion_action: 0.5 } as PersonalityTraitsResponse;
    }
    if (connectorConfig.useMocks) {
      return mockGetPersonality(userId) as Promise<PersonalityTraitsResponse>;
    }
    return apiRequest<PersonalityTraitsResponse>(connectorConfig.profileBaseUrl, `/profile/${userId}/personality`, {
      method: "GET",
    });
  },
};
