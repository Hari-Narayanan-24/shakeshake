import { useEffect, useState } from "react";
import {
  Alert,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  View,
} from "react-native";
import { Feather } from "@expo/vector-icons";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { settingsConnector } from "../connectors/settingsConnector";
import { moderateScale, verticalScale } from "../constants/theme";
import { THEMES } from "../constants/themes";
import type { ThemeId } from "../constants/themes";
import { useTheme } from "../hooks/useTheme";
import { useThemeContext } from "../contexts/ThemeContext";

type SettingsScreenProps = {
  userId: string;
  onBack: () => void;
};

type AIProvider = "gpt" | "glm";

export function SettingsScreen({ userId, onBack }: SettingsScreenProps) {
  const insets = useSafeAreaInsets();
  const [provider, setProvider] = useState<AIProvider>("gpt");
  const [gptApiKey, setGptApiKey] = useState("");
  const [gptUrl, setGptUrl] = useState("https://api.openai.com/v1");
  const [glmApiKey, setGlmApiKey] = useState("");
  const [glmUrl, setGlmUrl] = useState("");
  const [saving, setSaving] = useState(false);
  const [loading, setLoading] = useState(true);

  const { themeId, setTheme, theme } = useTheme();
  const { colors } = useThemeContext();

  useEffect(() => {
    (async () => {
      try {
        const s = await settingsConnector.getSettings(userId);
        if (s.ollamaModel === "glm") setProvider("glm");
        if (s.ollamaUrl && s.ollamaUrl !== "http://localhost:11434") {
          setGptUrl(s.ollamaUrl);
        }
      } catch (err) {
        console.warn("[Settings] Failed to load settings:", err);
      }
      setLoading(false);
    })();
  }, [userId]);

  const handleSave = async () => {
    setSaving(true);
    try {
      await settingsConnector.saveSettings(userId, {
        ollamaModel: provider,
        ollamaUrl: provider === "gpt" ? gptUrl.trim() : glmUrl.trim() || "http://localhost:11434",
      });
      Alert.alert("Saved", `Switched to ${provider === "gpt" ? "GPT" : "GLM"} model`);
    } catch {
      Alert.alert("Error", "Failed to save settings.");
    } finally {
      setSaving(false);
    }
  };

  const themeIds: ThemeId[] = ["rose", "sunset", "ocean", "midnight", "forest", "lavender", "neon", "cyber", "pastel", "aurora"];

  const styles = StyleSheet.create({
    root: {
      flex: 1,
      backgroundColor: colors.background,
    },
    content: {
      paddingHorizontal: moderateScale(20),
      paddingBottom: verticalScale(40),
      gap: moderateScale(14),
    },
    header: {
      flexDirection: "row",
      justifyContent: "space-between",
      alignItems: "center",
      marginBottom: moderateScale(8),
    },
    backBtn: {
      width: moderateScale(38),
      height: moderateScale(38),
      borderRadius: moderateScale(19),
      backgroundColor: colors.card,
      alignItems: "center",
      justifyContent: "center",
    },
    title: {
      fontSize: moderateScale(22),
      fontWeight: "900",
      color: colors.foreground,
    },
    section: {
      backgroundColor: colors.card,
      borderRadius: moderateScale(18),
      borderWidth: 1.5,
      borderColor: colors.border,
      padding: moderateScale(16),
      gap: moderateScale(12),
    },
    sectionTitle: {
      fontSize: moderateScale(16),
      fontWeight: "800",
      color: colors.foreground,
    },
    sectionDesc: {
      fontSize: moderateScale(13),
      color: colors.mutedForeground,
    },

    // ── Theme Gallery ─────────────────────────────────────────────────
    themeGrid: {
      flexDirection: "row",
      flexWrap: "wrap",
      gap: moderateScale(8),
      justifyContent: "center",
    },
    themeItem: {
      alignItems: "center",
      width: "30%",
      gap: moderateScale(6),
    },
    themeCircleWrapper: {
      position: "relative",
      alignItems: "center",
      justifyContent: "center",
    },
    themeRing: {
      width: moderateScale(60),
      height: moderateScale(60),
      borderRadius: moderateScale(30),
      borderWidth: 3,
      borderColor: colors.border,
      alignItems: "center",
      justifyContent: "center",
    },
    themeCircle: {
      width: moderateScale(48),
      height: moderateScale(48),
      borderRadius: moderateScale(24),
      alignItems: "center",
      justifyContent: "center",
    },
    themeEmoji: {
      fontSize: moderateScale(22),
    },
    themeBadge: {
      position: "absolute",
      bottom: -2,
      right: -2,
      width: moderateScale(20),
      height: moderateScale(20),
      borderRadius: moderateScale(10),
      alignItems: "center",
      justifyContent: "center",
      borderWidth: 2,
      borderColor: colors.white,
    },
    themeName: {
      fontSize: moderateScale(12),
      fontWeight: "600",
      color: colors.mutedForeground,
    },

    // ── Toggle Cards ─────────────────────────────────────────────
    toggleRow: {
      gap: moderateScale(10),
    },
    toggleCard: {
      flexDirection: "row",
      alignItems: "center",
      backgroundColor: colors.muted,
      borderRadius: moderateScale(16),
      borderWidth: 2,
      borderColor: colors.border,
      padding: moderateScale(14),
      gap: moderateScale(12),
    },
    toggleCardActive: {
      backgroundColor: "rgba(255, 83, 118, 0.08)",
      borderColor: colors.primary,
      shadowColor: colors.primary,
      shadowOpacity: 0.15,
      shadowRadius: 10,
      shadowOffset: { width: 0, height: 4 },
      elevation: 4,
    },
    radioOuter: {
      width: moderateScale(22),
      height: moderateScale(22),
      borderRadius: moderateScale(11),
      borderWidth: 2.5,
      borderColor: colors.border,
      alignItems: "center",
      justifyContent: "center",
    },
    radioOuterActive: {
      borderColor: colors.primary,
    },
    radioInner: {
      width: moderateScale(12),
      height: moderateScale(12),
      borderRadius: moderateScale(6),
      backgroundColor: colors.primary,
    },
    toggleInfo: {
      flex: 1,
      gap: moderateScale(2),
    },
    toggleLabel: {
      fontSize: moderateScale(16),
      fontWeight: "800",
      color: colors.foreground,
    },
    toggleLabelActive: {
      color: colors.primary,
    },
    toggleDesc: {
      fontSize: moderateScale(12),
      color: colors.mutedForeground,
    },

    // ── Input Fields ──────────────────────────────────────────────
    fieldGroup: {
      gap: moderateScale(6),
    },
    fieldLabel: {
      fontSize: moderateScale(12),
      fontWeight: "700",
      color: colors.mutedForeground,
      textTransform: "uppercase",
    },
    inputWrapper: {
      flexDirection: "row",
      alignItems: "center",
      gap: moderateScale(10),
      backgroundColor: colors.muted,
      borderRadius: moderateScale(12),
      paddingHorizontal: moderateScale(14),
      height: moderateScale(46),
      borderWidth: 1,
      borderColor: colors.border,
    },
    input: {
      flex: 1,
      fontSize: moderateScale(14),
      fontWeight: "500",
      color: colors.foreground,
    },
    comingSoon: {
      flexDirection: "row",
      alignItems: "center",
      gap: moderateScale(8),
      padding: moderateScale(4),
    },
    comingSoonText: {
      fontSize: moderateScale(12),
      color: colors.mutedForeground,
      fontStyle: "italic",
      flex: 1,
    },

    // ── Save Button ──────────────────────────────────────────────
    saveBtn: {
      backgroundColor: colors.primary,
      borderRadius: moderateScale(16),
      height: moderateScale(52),
      alignItems: "center",
      justifyContent: "center",
      shadowColor: colors.primary,
      shadowOpacity: 0.3,
      shadowRadius: 14,
      shadowOffset: { width: 0, height: 6 },
      elevation: 6,
    },
    saveBtnDisabled: {
      opacity: 0.5,
    },
    saveBtnText: {
      fontSize: moderateScale(17),
      fontWeight: "800",
      color: colors.white,
    },
  });

  return (
    <ScrollView style={styles.root} contentContainerStyle={[styles.content, { paddingTop: insets.top + verticalScale(16) }]}>
      {/* Header */}
      <View style={styles.header}>
        <Pressable onPress={onBack} style={styles.backBtn}>
          <Feather name="arrow-left" size={moderateScale(22)} color={colors.foreground} />
        </Pressable>
        <Text style={styles.title}>Settings</Text>
        <View style={{ width: moderateScale(38) }} />
      </View>

      {/* Theme Gallery */}
      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Theme Gallery</Text>
        <Text style={styles.sectionDesc}>Pick your vibe — personalize the app colors</Text>

        <View style={styles.themeGrid}>
          {themeIds.map((id) => {
            const t = THEMES[id];
            const isSelected = themeId === id;
            return (
              <Pressable
                key={id}
                style={styles.themeItem}
                onPress={() => setTheme(id)}
              >
                <View style={styles.themeCircleWrapper}>
                  {/* Selection ring */}
                  <View
                    style={[
                      styles.themeRing,
                      isSelected && { borderColor: t.primary },
                    ]}
                  >
                    <View style={[styles.themeCircle, { backgroundColor: t.primary }]}>
                      <Text style={styles.themeEmoji}>{t.emoji}</Text>
                    </View>
                  </View>
                  {/* Checkmark badge */}
                  {isSelected && (
                    <View style={[styles.themeBadge, { backgroundColor: t.primary }]}>
                      <Feather name="check" size={moderateScale(10)} color="#FFFFFF" />
                    </View>
                  )}
                </View>
                <Text
                  style={[
                    styles.themeName,
                    isSelected && { color: t.primary, fontWeight: "800" },
                  ]}
                >
                  {t.name}
                </Text>
              </Pressable>
            );
          })}
        </View>
      </View>

      {/* AI Model Toggle */}
      <View style={styles.section}>
        <Text style={styles.sectionTitle}>AI Model</Text>
        <Text style={styles.sectionDesc}>Choose which AI powers your chat assistant</Text>

        <View style={styles.toggleRow}>
          {/* GPT Option */}
          <Pressable
            style={[styles.toggleCard, provider === "gpt" && styles.toggleCardActive]}
            onPress={() => setProvider("gpt")}
          >
            <View style={[styles.radioOuter, provider === "gpt" && styles.radioOuterActive]}>
              {provider === "gpt" && <View style={styles.radioInner} />}
            </View>
            <View style={styles.toggleInfo}>
              <Text style={[styles.toggleLabel, provider === "gpt" && styles.toggleLabelActive]}>
                GPT
              </Text>
              <Text style={styles.toggleDesc}>OpenAI GPT model</Text>
            </View>
            <Feather name="zap" size={moderateScale(16)} color={provider === "gpt" ? colors.primary : colors.mutedForeground} />
          </Pressable>

          {/* GLM Option */}
          <Pressable
            style={[styles.toggleCard, provider === "glm" && styles.toggleCardActive]}
            onPress={() => setProvider("glm")}
          >
            <View style={[styles.radioOuter, provider === "glm" && styles.radioOuterActive]}>
              {provider === "glm" && <View style={styles.radioInner} />}
            </View>
            <View style={styles.toggleInfo}>
              <Text style={[styles.toggleLabel, provider === "glm" && styles.toggleLabelActive]}>
                GLM
              </Text>
              <Text style={styles.toggleDesc}>Configure later in settings</Text>
            </View>
            <Feather name="cpu" size={moderateScale(16)} color={provider === "glm" ? colors.primary : colors.mutedForeground} />
          </Pressable>
        </View>
      </View>

      {/* Provider-specific config */}
      {provider === "gpt" && (
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>GPT Configuration</Text>
          <View style={styles.fieldGroup}>
            <Text style={styles.fieldLabel}>API Key</Text>
            <View style={styles.inputWrapper}>
              <Feather name="key" size={moderateScale(16)} color={colors.mutedForeground} />
              <TextInput
                style={styles.input}
                placeholder="sk-..."
                placeholderTextColor={colors.mutedForeground}
                value={gptApiKey}
                onChangeText={setGptApiKey}
                autoCapitalize="none"
                autoCorrect={false}
                secureTextEntry
              />
            </View>
          </View>
          <View style={styles.fieldGroup}>
            <Text style={styles.fieldLabel}>API URL</Text>
            <View style={styles.inputWrapper}>
              <Feather name="globe" size={moderateScale(16)} color={colors.mutedForeground} />
              <TextInput
                style={styles.input}
                value={gptUrl}
                onChangeText={setGptUrl}
                autoCapitalize="none"
                autoCorrect={false}
                keyboardType="url"
              />
            </View>
          </View>
        </View>
      )}

      {provider === "glm" && (
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>GLM Configuration</Text>
          <View style={styles.fieldGroup}>
            <Text style={styles.fieldLabel}>API Key</Text>
            <View style={styles.inputWrapper}>
              <Feather name="key" size={moderateScale(16)} color={colors.mutedForeground} />
              <TextInput
                style={styles.input}
                placeholder="Enter your GLM API key"
                placeholderTextColor={colors.mutedForeground}
                value={glmApiKey}
                onChangeText={setGlmApiKey}
                autoCapitalize="none"
                autoCorrect={false}
                secureTextEntry
              />
            </View>
          </View>
          <View style={styles.fieldGroup}>
            <Text style={styles.fieldLabel}>API URL</Text>
            <View style={styles.inputWrapper}>
              <Feather name="globe" size={moderateScale(16)} color={colors.mutedForeground} />
              <TextInput
                style={styles.input}
                placeholder="https://your-glm-server.com/api"
                placeholderTextColor={colors.mutedForeground}
                value={glmUrl}
                onChangeText={setGlmUrl}
                autoCapitalize="none"
                autoCorrect={false}
                keyboardType="url"
              />
            </View>
          </View>
          <View style={styles.comingSoon}>
            <Feather name="info" size={moderateScale(14)} color={colors.mutedForeground} />
            <Text style={styles.comingSoonText}>
              GLM integration — add your API key and URL when ready
            </Text>
          </View>
        </View>
      )}

      {/* Save Button */}
      <Pressable
        onPress={handleSave}
        disabled={saving}
        style={[styles.saveBtn, saving && styles.saveBtnDisabled]}
      >
        <Text style={styles.saveBtnText}>{saving ? "Saving..." : "Save Settings"}</Text>
      </Pressable>
    </ScrollView>
  );
}
