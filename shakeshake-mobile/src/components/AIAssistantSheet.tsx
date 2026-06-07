import { useState, useEffect, useRef } from "react";
import {
  Animated,
  KeyboardAvoidingView,
  Platform,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  View,
  Alert,
} from "react-native";
import { Feather } from "@expo/vector-icons";
import * as Haptics from "expo-haptics";
import { ollamaConnector } from "../connectors/ollamaConnector";
import { useThemeContext } from "../contexts/ThemeContext";
import { moderateScale, verticalScale } from "../constants/theme";
import type { ChatMessage } from "../types/chat";

type AIAssistantSheetProps = {
  visible: boolean;
  onClose: () => void;
  onInsertSuggestion: (text: string) => void;
  chatMessages: ChatMessage[];
  matchedUserName: string;
  userId: string;
};

const PHRASES = [
  "Thinking of the perfect reply...",
  "Crafting something thoughtful...",
  "Finding the right words...",
];

export function AIAssistantSheet({
  visible,
  onClose,
  onInsertSuggestion,
  chatMessages,
  matchedUserName,
  userId,
}: AIAssistantSheetProps) {
  const [description, setDescription] = useState("");
  const [suggestions, setSuggestions] = useState<string[]>([]);
  const [loading, setLoading] = useState(false);
  const [loadingPhrase, setLoadingPhrase] = useState(PHRASES[0]);
  const slideAnim = useRef(new Animated.Value(1)).current;
  const backdropAnim = useRef(new Animated.Value(0)).current;
  const { colors } = useThemeContext();

  // Animate in/out
  useEffect(() => {
    if (visible) {
      Animated.parallel([
        Animated.timing(slideAnim, {
          toValue: 0,
          duration: 350,
          useNativeDriver: true,
        }),
        Animated.timing(backdropAnim, {
          toValue: 1,
          duration: 300,
          useNativeDriver: true,
        }),
      ]).start();
    } else {
      Animated.parallel([
        Animated.timing(slideAnim, {
          toValue: 1,
          duration: 250,
          useNativeDriver: true,
        }),
        Animated.timing(backdropAnim, {
          toValue: 0,
          duration: 200,
          useNativeDriver: true,
        }),
      ]).start();
      // Reset state when closed
      setSuggestions([]);
      setDescription("");
    }
  }, [visible]);

  // Rotate loading phrases
  useEffect(() => {
    if (!loading) return;
    let i = 0;
    const interval = setInterval(() => {
      i = (i + 1) % PHRASES.length;
      setLoadingPhrase(PHRASES[i]);
    }, 1500);
    return () => clearInterval(interval);
  }, [loading]);

  const handleGenerate = async () => {
    if (!description.trim()) {
      Alert.alert("Describe your feelings", "Tell us what you want to say or how you feel!");
      return;
    }

    setLoading(true);
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);

    try {
      // Format chat context
      const contextLines = chatMessages.slice(-10).map((msg) => {
        const sender = msg.senderId === userId ? "You" : matchedUserName;
        return `${sender}: ${msg.text}`;
      });
      const context = contextLines.join("\n");

      const result = await ollamaConnector.generateChatReply({
        prompt: `The user wants to express something like: "${description.trim()}"\n\nGenerate 1-3 suggested replies that are natural, friendly, and contextually appropriate. Return ONLY the replies, one per line. No numbers, no emoji, no formatting.`,
        context,
        userId,
      });

      if (result.success && result.response) {
        const lines = result.response
          .split("\n")
          .map((l) => l.trim())
          .filter((l) => l.length > 0 && l.length < 300);
        setSuggestions(lines.slice(0, 3));
      } else {
        Alert.alert(
          "AI Offline",
          result.message || "Could not connect to Ollama. Make sure it's running on localhost:11434"
        );
      }
    } catch {
      Alert.alert("AI Offline", "Could not reach the AI assistant. Is Ollama running?");
    } finally {
      setLoading(false);
    }
  };

  const handleInsert = (text: string) => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    onInsertSuggestion(text);
  };

  if (!visible) return null;

  const styles = StyleSheet.create({
    backdrop: {
      ...StyleSheet.absoluteFillObject,
      backgroundColor: "rgba(0,0,0,0.5)",
    },
    panel: {
      position: "absolute",
      bottom: 0,
      left: 0,
      right: 0,
      backgroundColor: colors.background,
      borderTopLeftRadius: moderateScale(24),
      borderTopRightRadius: moderateScale(24),
      paddingHorizontal: moderateScale(20),
      paddingTop: moderateScale(8),
      paddingBottom: verticalScale(24),
      gap: moderateScale(14),
      maxHeight: "75%",
      shadowColor: "#000",
      shadowOpacity: 0.3,
      shadowRadius: 20,
      shadowOffset: { width: 0, height: -10 },
      elevation: 10,
    },
    handleContainer: {
      alignItems: "center",
      paddingBottom: moderateScale(8),
    },
    handle: {
      width: moderateScale(40),
      height: moderateScale(4),
      borderRadius: moderateScale(2),
      backgroundColor: colors.mutedForeground,
      opacity: 0.4,
    },
    header: {
      flexDirection: "row",
      justifyContent: "space-between",
      alignItems: "center",
    },
    headerLeft: {
      flexDirection: "row",
      alignItems: "center",
      gap: moderateScale(10),
    },
    headerEmoji: {
      fontSize: moderateScale(28),
    },
    headerTitle: {
      fontSize: moderateScale(17),
      fontWeight: "800",
      color: colors.foreground,
    },
    headerSubtitle: {
      fontSize: moderateScale(12),
      color: colors.mutedForeground,
    },
    closeBtn: {
      width: moderateScale(32),
      height: moderateScale(32),
      borderRadius: moderateScale(16),
      backgroundColor: colors.muted,
      alignItems: "center",
      justifyContent: "center",
    },
    inputContainer: {
      backgroundColor: colors.card,
      borderRadius: moderateScale(16),
      borderWidth: 1.5,
      borderColor: colors.border,
      padding: moderateScale(4),
    },
    input: {
      fontSize: moderateScale(15),
      fontWeight: "500",
      color: colors.foreground,
      minHeight: moderateScale(80),
      maxHeight: moderateScale(120),
      textAlignVertical: "top",
    },
    generateBtn: {
      backgroundColor: colors.primary,
      borderRadius: moderateScale(14),
      height: moderateScale(48),
      alignItems: "center",
      justifyContent: "center",
      shadowColor: colors.primary,
      shadowOpacity: 0.3,
      shadowRadius: 10,
      shadowOffset: { width: 0, height: 4 },
      elevation: 4,
    },
    generateBtnDisabled: {
      opacity: 0.5,
    },
    generateBtnText: {
      fontSize: moderateScale(15),
      fontWeight: "800",
      color: colors.white,
    },
    suggestionsContainer: {
      gap: moderateScale(8),
    },
    suggestionsLabel: {
      fontSize: moderateScale(13),
      fontWeight: "700",
      color: colors.mutedForeground,
      textTransform: "uppercase",
    },
    suggestionCard: {
      backgroundColor: colors.card,
      borderRadius: moderateScale(14),
      borderWidth: 1.5,
      borderColor: colors.border,
      padding: moderateScale(14),
      gap: moderateScale(6),
    },
    suggestionText: {
      fontSize: moderateScale(14),
      fontWeight: "600",
      color: colors.foreground,
      lineHeight: moderateScale(20),
    },
    suggestionHint: {
      fontSize: moderateScale(11),
      fontWeight: "700",
      color: colors.primary,
    },
  });

  return (
    <View style={StyleSheet.absoluteFillObject} pointerEvents="box-none">
      {/* Backdrop */}
      <Animated.View
        style={[
          styles.backdrop,
          { opacity: backdropAnim },
        ]}
      >
        <Pressable style={StyleSheet.absoluteFillObject} onPress={onClose} />
      </Animated.View>

      {/* Panel */}
      <KeyboardAvoidingView
        style={StyleSheet.absoluteFill}
        behavior={Platform.OS === "ios" ? "padding" : undefined}
        pointerEvents="box-none"
      >
        <Animated.View
          style={[
            styles.panel,
            {
              transform: [{ translateY: slideAnim.interpolate({ inputRange: [0, 1], outputRange: [0, 600] }) }],
            },
          ]}
        >
          {/* Handle bar */}
          <View style={styles.handleContainer}>
            <View style={styles.handle} />
          </View>

          {/* Header */}
          <View style={styles.header}>
            <View style={styles.headerLeft}>
              <Text style={styles.headerEmoji}>🐉</Text>
              <View>
                <Text style={styles.headerTitle}>AI Reply Assistant</Text>
                <Text style={styles.headerSubtitle}>Helping you say it right</Text>
              </View>
            </View>
            <Pressable onPress={onClose} style={styles.closeBtn}>
              <Feather name="x" size={moderateScale(20)} color={colors.foreground} />
            </Pressable>
          </View>

          {/* Description input */}
          <View style={styles.inputContainer}>
            <TextInput
              style={styles.input}
              placeholder="Tell us how you feel or what you want to say..."
              placeholderTextColor={colors.mutedForeground}
              value={description}
              onChangeText={setDescription}
              multiline
              maxLength={500}
              editable={!loading}
            />
          </View>

          {/* Generate button */}
          <Pressable
            onPress={handleGenerate}
            disabled={loading || !description.trim()}
            style={[styles.generateBtn, (loading || !description.trim()) && styles.generateBtnDisabled]}
          >
            <Text style={styles.generateBtnText}>
              {loading ? loadingPhrase : "Generate Reply ✨"}
            </Text>
          </Pressable>

          {/* Suggestions */}
          {suggestions.length > 0 && (
            <View style={styles.suggestionsContainer}>
              <Text style={styles.suggestionsLabel}>Suggested Replies:</Text>
              {suggestions.map((text, i) => (
                <Pressable
                  key={i}
                  style={styles.suggestionCard}
                  onPress={() => handleInsert(text)}
                >
                  <Text style={styles.suggestionText}>{text}</Text>
                  <Text style={styles.suggestionHint}>Tap to use →</Text>
                </Pressable>
              ))}
            </View>
          )}
        </Animated.View>
      </KeyboardAvoidingView>
    </View>
  );
}
