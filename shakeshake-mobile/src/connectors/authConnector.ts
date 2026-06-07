import { setAuthToken } from "./apiClient";
import { apiRequest } from "./apiClient";
import { connectorConfig } from "./config";
import { mockSignIn, mockRegister } from "../storage/mockBackend";

type AuthResponse = {
  success: boolean;
  token?: string;
  user_id?: string;
  name?: string;
  message?: string;
};

export const authConnector = {
  async signIn(email: string, password: string): Promise<AuthResponse> {
    if (connectorConfig.useMocks) {
      return mockSignIn(email, password) as Promise<AuthResponse>;
    }
    const result = await apiRequest<AuthResponse>(connectorConfig.authBaseUrl, "/auth/sign-in", {
      method: "POST",
      body: { email, password },
    });
    if (result.success && result.token) {
      setAuthToken(result.token);
    }
    return result;
  },

  async register(payload: {
    name: string;
    email: string;
    password: string;
    age_range?: string;
    major?: string;
    bio?: string;
  }): Promise<AuthResponse> {
    if (connectorConfig.useMocks) {
      return mockRegister(payload) as Promise<AuthResponse>;
    }
    const result = await apiRequest<AuthResponse>(connectorConfig.authBaseUrl, "/auth/register", {
      method: "POST",
      body: payload,
    });
    if (result.success && result.token) {
      setAuthToken(result.token);
    }
    return result;
  },
};
