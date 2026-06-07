import { apiRequest } from "./apiClient";
import { connectorConfig } from "./config";
import { mockCompleteOnboarding } from "../storage/mockBackend";

export const onboardingConnector = {
  async completeOnboarding(payload: Record<string, unknown>) {
    if (connectorConfig.useMocks) {
      return mockCompleteOnboarding(payload);
    }
    return apiRequest<{ success: boolean }>(connectorConfig.onboardingBaseUrl, "/onboarding/complete", {
      method: "POST",
      body: payload,
    });
  },
};
