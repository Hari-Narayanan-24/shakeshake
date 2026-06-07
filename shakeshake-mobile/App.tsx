import { StatusBar } from "expo-status-bar";
import { useState, useEffect } from "react";
import { Alert, TextInput, View, Text, Pressable, KeyboardAvoidingView, Platform, BackHandler } from "react-native";
import { NavigationContainer } from "@react-navigation/native";
import { SafeAreaProvider, useSafeAreaInsets } from "react-native-safe-area-context";
import { Feather } from "@expo/vector-icons";

import { IdentityScreen } from "./src/screens/IdentityScreen";
import { InterestsScreen } from "./src/screens/InterestsScreen";
import { PersonalityScreen } from "./src/screens/PersonalityScreen";
import { ProfileScreen } from "./src/screens/ProfileScreen";
import { SuccessScreen } from "./src/screens/SuccessScreen";
import { WelcomeScreen } from "./src/screens/WelcomeScreen";
import { MainTabNavigator } from "./src/navigation/MainTabNavigator";
import { authConnector, profileConnector } from "./src/connectors";
import { setAuthToken, clearAuthToken } from "./src/connectors/apiClient";
import { checkBackendHealth, connectorConfig } from "./src/connectors/config";
import { initMockData } from "./src/storage/mockBackend";
import { ThemeProvider, useThemeContext } from "./src/contexts/ThemeContext";
import { moderateScale, verticalScale } from "./src/constants/theme";
import type {
  AgeRange,
  IdentityForm,
  InterestForm,
  PersonalityTraitsForm,
  ProfileForm,
  ScreenName,
} from "./src/types/onboarding";

function createLocalUserId(email: string, name: string) {
  const source = (email || name || "user").trim().toLowerCase();
  const slug = source.replace(/[^a-z0-9]+/g, "_").replace(/^_+|_+$/g, "");
  return `local_${slug || "user"}`;
}

// ── Sign-In overlay (needs ThemeContext access) ──────────────────────
function SignInOverlay({
  insets,
  onSignIn,
  onBack,
  loading,
  email,
  password,
  onEmailChange,
  onPasswordChange,
}: {
  insets: { top: number; bottom: number };
  onSignIn: () => void;
  onBack: () => void;
  loading: boolean;
  email: string;
  password: string;
  onEmailChange: (v: string) => void;
  onPasswordChange: (v: string) => void;
}) {
  const { colors } = useThemeContext();
  return (
    <KeyboardAvoidingView
      style={[{ flex: 1, backgroundColor: colors.background, justifyContent: "center" }]}
      behavior={Platform.OS === "ios" ? "padding" : undefined}
      keyboardVerticalOffset={insets.top}
    >
      <View style={[{
        width: "100%",
        maxWidth: moderateScale(380),
        paddingHorizontal: moderateScale(28),
        gap: moderateScale(16),
        paddingTop: insets.top + verticalScale(24),
        paddingBottom: insets.bottom + verticalScale(24),
      }]}>
        <Pressable onPress={onBack} style={{ alignSelf: "flex-start", padding: moderateScale(8) }}>
          <Feather name="arrow-left" size={moderateScale(22)} color={colors.foreground} />
        </Pressable>
        <Text style={{ fontSize: moderateScale(26), fontWeight: "900", color: colors.foreground, textAlign: "center" }}>
          Welcome Back 👋
        </Text>
        <Text style={{ fontSize: moderateScale(14), color: colors.mutedForeground, textAlign: "center" }}>
          Sign in to your account
        </Text>
        <View style={{ gap: moderateScale(12) }}>
          <View style={{
            flexDirection: "row", alignItems: "center", gap: moderateScale(10),
            backgroundColor: colors.card, borderWidth: 2, borderColor: colors.border,
            borderRadius: moderateScale(16), paddingHorizontal: moderateScale(14), height: moderateScale(52),
          }}>
            <Feather name="mail" size={moderateScale(18)} color={colors.mutedForeground} />
            <TextInput
              style={{ flex: 1, fontSize: moderateScale(15), fontWeight: "500", color: colors.foreground }}
              placeholder="Email"
              placeholderTextColor={colors.mutedForeground}
              value={email}
              onChangeText={onEmailChange}
              autoCapitalize="none"
              keyboardType="email-address"
              autoCorrect={false}
            />
          </View>
          <View style={{
            flexDirection: "row", alignItems: "center", gap: moderateScale(10),
            backgroundColor: colors.card, borderWidth: 2, borderColor: colors.border,
            borderRadius: moderateScale(16), paddingHorizontal: moderateScale(14), height: moderateScale(52),
          }}>
            <Feather name="lock" size={moderateScale(18)} color={colors.mutedForeground} />
            <TextInput
              style={{ flex: 1, fontSize: moderateScale(15), fontWeight: "500", color: colors.foreground }}
              placeholder="Password"
              placeholderTextColor={colors.mutedForeground}
              value={password}
              onChangeText={onPasswordChange}
              secureTextEntry
            />
          </View>
        </View>
        <Pressable onPress={onSignIn} disabled={loading} style={{
          backgroundColor: colors.primary, borderRadius: moderateScale(16), height: moderateScale(52),
          alignItems: "center", justifyContent: "center",
          shadowColor: colors.primary, shadowOpacity: 0.3, shadowRadius: 14,
          shadowOffset: { width: 0, height: 6 }, elevation: 6,
        }}>
          <Text style={{ fontSize: moderateScale(17), fontWeight: "800", color: colors.white }}>
            {loading ? "Signing in..." : "Sign In"}
          </Text>
        </Pressable>
      </View>
    </KeyboardAvoidingView>
  );
}

// ── Inner app content — uses useSafeAreaInsets inside SafeAreaProvider ────
function AppContent() {
  const insets = useSafeAreaInsets();

  const [hasCompletedOnboarding, setHasCompletedOnboarding] = useState(false);
  const [screen, setScreen] = useState<ScreenName>("welcome");
  const [showSignIn, setShowSignIn] = useState(false);
  const [signInEmail, setSignInEmail] = useState("");
  const [signInPassword, setSignInPassword] = useState("");
  const [signInLoading, setSignInLoading] = useState(false);
  const [userId, setUserId] = useState("");
  const [userName, setUserName] = useState("");
  const [profileForm, setProfileForm] = useState<ProfileForm>({
    name: "",
    email: "",
    password: "",
    ageRange: "" as AgeRange | "",
    major: "",
    bio: "",
  });
  const [identityForm, setIdentityForm] = useState<IdentityForm>({
    gender: "",
    orientation: "",
    religion: "",
    religionOpenness: "",
  });
  const [interestForm, setInterestForm] = useState<InterestForm>({
    hobbies: [],
    music: [],
    movies: [],
    tv: [],
    games: [],
  });
  const [personalityForm, setPersonalityForm] = useState<PersonalityTraitsForm>({
    mbti: "",
    sbti: "",
    listenerSpeaker: 0.5,
    dominantPassive: 0.5,
    emotionAction: 0.5,
  });
  const [loading, setLoading] = useState(false);

  // ── Android hardware back button for sign-in overlay ───────────────
  useEffect(() => {
    if (showSignIn) {
      const sub = BackHandler.addEventListener("hardwareBackPress", () => {
        setShowSignIn(false);
        return true;
      });
      return () => sub.remove();
    }
  }, [showSignIn]);

  // ── Sign In Handler ─────────────────────────────────────────────
  const handleSignIn = async () => {
    if (!signInEmail.trim() || !signInPassword.trim()) {
      Alert.alert("Missing Fields", "Please enter your email and password.");
      return;
    }
    setSignInLoading(true);
    try {
      const result = await authConnector.signIn(signInEmail, signInPassword);
      if (result.success && result.user_id) {
        setUserId(result.user_id);
        setUserName(result.name ?? "User");

        // Try to load profile data from backend
        try {
          const profile = await profileConnector.getProfile(result.user_id);
          if (profile.name) setUserName(profile.name);
        } catch {
          // Profile fetch failed, continue with data from sign-in
        }

        setHasCompletedOnboarding(true);
      } else {
        Alert.alert("Sign In Failed", result.message ?? "Invalid email or password.");
      }
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : "";
      if (msg.includes("Network") || msg.includes("fetch") || msg.includes("ECONNREFUSED")) {
        Alert.alert("Offline Mode", "Backend is offline — running in local demo mode.");
        setUserId("mock_user_current");
        setUserName(signInEmail.split("@")[0] || "Demo User");
        setHasCompletedOnboarding(true);
      } else {
        Alert.alert("Sign In Error", msg || "Could not connect to server.");
      }
    } finally {
      setSignInLoading(false);
    }
  };

  // ── Logout Handler ──────────────────────────────────────────────
  const handleLogout = () => {
    setAuthToken(null);
    setUserId("");
    setUserName("");
    setHasCompletedOnboarding(false);
    setScreen("welcome");
    setShowSignIn(false);
    setProfileForm({ name: "", email: "", password: "", ageRange: "", major: "", bio: "" });
    setIdentityForm({ gender: "", orientation: "", religion: "", religionOpenness: "" });
    setInterestForm({ hobbies: [], music: [], movies: [], tv: [], games: [] });
    setPersonalityForm({ mbti: "", sbti: "", listenerSpeaker: 0.5, dominantPassive: 0.5, emotionAction: 0.5 });
  };

  // ── Main app (after onboarding) ───────────────────────────────
  if (hasCompletedOnboarding) {
    return (
      <NavigationContainer>
        <MainTabNavigator
          userId={userId}
          userName={userName}
          onLogout={handleLogout}
        />
      </NavigationContainer>
    );
  }

  // ── Onboarding flow ────────────────────────────────────────────
  const goToProfile = () => setScreen("profile");

  const goToIdentity = async () => {
    setLoading(true);
    try {
      const result = await profileConnector.createProfile({
        name: profileForm.name,
        email: profileForm.email,
        password: profileForm.password,
        age_range: profileForm.ageRange,
        major: profileForm.major,
        bio: profileForm.bio,
      });
      if (result.user_id) {
        setUserId(result.user_id);
      } else {
        setUserId(createLocalUserId(profileForm.email, profileForm.name));
      }
    } catch (err) {
      console.warn("Profile create failed (backend offline?), continuing anyway", err);
      setUserId(createLocalUserId(profileForm.email, profileForm.name));
    } finally {
      setUserName(profileForm.name);
      setScreen("identity");
      setLoading(false);
    }
  };

  const goToInterests = async () => {
    setLoading(true);
    try {
      if (userId) {
        await profileConnector.saveIdentity(userId, {
          gender: identityForm.gender,
          orientation: identityForm.orientation,
          religion: identityForm.religion,
          religion_openness: identityForm.religionOpenness,
        });
      }
    } catch (err) {
      console.warn("Identity save failed, continuing anyway", err);
    } finally {
      setScreen("interests");
      setLoading(false);
    }
  };

  const goToPersonality = async () => {
    setLoading(true);
    try {
      if (userId) {
        await profileConnector.saveInterests(userId, interestForm);
      }
    } catch (err) {
      console.warn("Interests save failed, continuing anyway", err);
    } finally {
      setScreen("personality");
      setLoading(false);
    }
  };

  const goToSuccess = async () => {
    if (!personalityForm.mbti) return;
    setLoading(true);
    try {
      if (userId) {
        await profileConnector.savePersonality(userId, {
          mbti: personalityForm.mbti,
          sbti: personalityForm.sbti,
          listener_speaker: personalityForm.listenerSpeaker,
          dominant_passive: personalityForm.dominantPassive,
          emotion_action: personalityForm.emotionAction,
        });
      }
    } catch (err) {
      console.warn("Personality save failed, continuing anyway", err);
    } finally {
      setScreen("success");
      setLoading(false);
    }
  };

  const startExploring = () => {
    if (!userId) {
      setUserId(createLocalUserId(profileForm.email, profileForm.name));
    }
    setHasCompletedOnboarding(true);
  };

  const { colors } = useThemeContext();

  return (
    <View style={{ flex: 1, backgroundColor: colors.background }}>
      <StatusBar style="light" />

      {screen === "welcome" && !showSignIn && (
        <WelcomeScreen
          onGetStarted={goToProfile}
          onSignIn={() => setShowSignIn(true)}
        />
      )}

      {screen === "welcome" && showSignIn && (
        <SignInOverlay
          insets={insets}
          onSignIn={handleSignIn}
          onBack={() => setShowSignIn(false)}
          loading={signInLoading}
          email={signInEmail}
          password={signInPassword}
          onEmailChange={setSignInEmail}
          onPasswordChange={setSignInPassword}
        />
      )}

      {screen === "profile" && (
        <ProfileScreen
          profileForm={profileForm}
          onChangeForm={setProfileForm}
          onBack={() => setScreen("welcome")}
          onContinue={goToIdentity}
          loading={loading}
        />
      )}

      {screen === "identity" && (
        <IdentityScreen
          identityForm={identityForm}
          onChangeIdentity={setIdentityForm}
          onBack={() => setScreen("profile")}
          onContinue={goToInterests}
          loading={loading}
        />
      )}

      {screen === "interests" && (
        <InterestsScreen
          interestForm={interestForm}
          onChangeInterest={setInterestForm}
          onBack={() => setScreen("identity")}
          onContinue={goToPersonality}
          loading={loading}
        />
      )}

      {screen === "personality" && (
        <PersonalityScreen
          personalityForm={personalityForm}
          onChangePersonality={setPersonalityForm}
          onBack={() => setScreen("interests")}
          onContinue={goToSuccess}
          loading={loading}
        />
      )}

      {screen === "success" && (
        <SuccessScreen
          name={profileForm.name}
          selectedInterests={interestForm.hobbies}
          selectedPersonality={personalityForm.mbti}
          onStartExploring={startExploring}
        />
      )}
    </View>
  );
}

// ── Root: SafeAreaProvider + ThemeProvider wrap everything ──────────────
export default function App() {
  // ── Seed mock data on first launch & check backend connectivity ─────
  useEffect(() => {
    initMockData();

    // Ping the backend to detect if it's running.
    // If unreachable, config.ts will auto-enable mock fallback.
    checkBackendHealth().then((reachable) => {
      if (reachable) {
        console.log("[App] ✅ Backend is online — using real APIs");
      } else {
        console.log("[App] ⚠️  Backend offline — using mock data fallback");
      }
    });
  }, []);

  return (
    <SafeAreaProvider>
      <ThemeProvider>
        <AppContent />
      </ThemeProvider>
    </SafeAreaProvider>
  );
}
