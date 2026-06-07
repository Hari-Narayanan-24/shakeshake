import { useEffect, useState, useRef } from "react";
import {
  FlatList,
  KeyboardAvoidingView,
  Platform,
  Pressable,
  StyleSheet,
  Text,
  TextInput,
  View,
} from "react-native";
import { Feather } from "@expo/vector-icons";
import * as Haptics from "expo-haptics";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { chatConnector } from "../connectors/chatConnector";
import { AIAssistantButton } from "../components/AIAssistantButton";
import { AIAssistantSheet } from "../components/AIAssistantSheet";
import { moderateScale, verticalScale } from "../constants/theme";
import { useThemeContext } from "../contexts/ThemeContext";
import type { ChatMessage } from "../types/chat";

type ChatDetailScreenProps = {
  matchId: string;
  matchedUserName: string;
  userId: string;
  onBack: () => void;
};

export function ChatDetailScreen({
  matchId,
  matchedUserName,
  userId,
  onBack,
}: ChatDetailScreenProps) {
  const insets = useSafeAreaInsets();
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [inputText, setInputText] = useState("");
  const [sending, setSending] = useState(false);
  const [aiSheetVisible, setAiSheetVisible] = useState(false);
  const flatListRef = useRef<FlatList>(null);
  const { colors } = useThemeContext();

  const fetchMessages = async () => {
    try {
      const res = await chatConnector.getMessages(matchId);
      setMessages(res.messages);
    } catch {
      // Silent
    }
  };

  useEffect(() => {
    fetchMessages();
    chatConnector.markRead(matchId, userId);
    const interval = setInterval(fetchMessages, 5000);
    return () => clearInterval(interval);
  }, [matchId, userId]);

  useEffect(() => {
    if (messages.length > 0) {
      setTimeout(() => flatListRef.current?.scrollToEnd({ animated: true }), 100);
    }
  }, [messages.length]);

  const handleSend = async () => {
    const text = inputText.trim();
    if (!text || sending) return;

    setSending(true);
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    setInputText("");

    try {
      await chatConnector.sendMessage({
        matchId,
        senderId: userId,
        text,
      });
      await fetchMessages();
    } catch {
      setInputText(text);
    } finally {
      setSending(false);
    }
  };

  const handleInsertSuggestion = (text: string) => {
    setInputText(text);
    setAiSheetVisible(false);
  };

  const styles = StyleSheet.create({
    root: {
      flex: 1,
      backgroundColor: colors.background,
    },
    header: {
      flexDirection: "row",
      alignItems: "center",
      paddingHorizontal: moderateScale(12),
      paddingBottom: verticalScale(8),
      borderBottomWidth: 1,
      borderBottomColor: colors.border,
      backgroundColor: colors.card,
    },
    backBtn: {
      padding: moderateScale(8),
    },
    headerInfo: {
      flexDirection: "row",
      alignItems: "center",
      gap: moderateScale(10),
      marginLeft: moderateScale(4),
    },
    headerAvatar: {
      width: moderateScale(40),
      height: moderateScale(40),
      borderRadius: moderateScale(20),
      backgroundColor: colors.primary,
      alignItems: "center",
      justifyContent: "center",
      shadowColor: colors.primary,
      shadowOpacity: 0.3,
      shadowRadius: 8,
      shadowOffset: { width: 0, height: 3 },
      elevation: 4,
    },
    headerAvatarLetter: {
      fontSize: moderateScale(16),
      fontWeight: "800",
      color: colors.white,
    },
    headerName: {
      fontSize: moderateScale(17),
      fontWeight: "700",
      color: colors.foreground,
    },
    headerStatus: {
      fontSize: moderateScale(11),
      fontWeight: "600",
      color: colors.primary,
    },

    // ── Messages ──────────────────────────────────────────────────
    messageList: {
      flex: 1,
    },
    messageListContent: {
      paddingHorizontal: moderateScale(16),
      paddingVertical: verticalScale(12),
    },
    messageRow: {
      marginBottom: moderateScale(10),
      maxWidth: "75%",
    },
    messageRowMine: {
      alignSelf: "flex-end",
      alignItems: "flex-end",
    },
    messageRowTheirs: {
      alignSelf: "flex-start",
      alignItems: "flex-start",
    },
    messageBubble: {
      paddingHorizontal: moderateScale(14),
      paddingVertical: moderateScale(10),
      borderRadius: moderateScale(18),
    },
    bubbleMine: {
      backgroundColor: colors.primary,
      borderBottomRightRadius: moderateScale(4),
    },
    bubbleTheirs: {
      backgroundColor: colors.card,
      borderWidth: 1,
      borderColor: colors.border,
      borderBottomLeftRadius: moderateScale(4),
    },
    messageText: {
      fontSize: moderateScale(14),
      fontWeight: "500",
      color: colors.foreground,
      lineHeight: moderateScale(20),
    },
    messageTextMine: {
      color: colors.white,
    },
    messageTime: {
      fontSize: moderateScale(10),
      color: colors.mutedForeground,
      marginTop: moderateScale(2),
    },

    // ── AI Button ─────────────────────────────────────────────────
    aiButtonContainer: {
      position: "absolute",
      bottom: verticalScale(68),
      right: moderateScale(16),
      zIndex: 10,
    },

    // ── Input bar ─────────────────────────────────────────────────
    inputBar: {
      flexDirection: "row",
      alignItems: "flex-end",
      gap: moderateScale(8),
      paddingHorizontal: moderateScale(12),
      paddingVertical: moderateScale(10),
      backgroundColor: colors.card,
      borderTopWidth: 1,
      borderTopColor: colors.border,
    },
    input: {
      flex: 1,
      backgroundColor: colors.muted,
      borderRadius: moderateScale(20),
      paddingHorizontal: moderateScale(16),
      paddingVertical: moderateScale(10),
      fontSize: moderateScale(14),
      fontWeight: "500",
      color: colors.foreground,
      maxHeight: moderateScale(100),
    },
    sendBtn: {
      width: moderateScale(42),
      height: moderateScale(42),
      borderRadius: moderateScale(21),
      backgroundColor: colors.primary,
      alignItems: "center",
      justifyContent: "center",
    },
    sendBtnDisabled: {
      backgroundColor: colors.muted,
      opacity: 0.5,
    },
  });

  return (
    <View style={styles.root}>
      {/* Header */}
      <View style={[styles.header, { paddingTop: insets.top + verticalScale(8) }]}>
        <Pressable onPress={onBack} style={styles.backBtn}>
          <Feather name="arrow-left" size={moderateScale(22)} color={colors.foreground} />
        </Pressable>
        <View style={styles.headerInfo}>
          <View style={styles.headerAvatar}>
            <Text style={styles.headerAvatarLetter}>
              {matchedUserName.charAt(0).toUpperCase()}
            </Text>
          </View>
          <View>
            <Text style={styles.headerName}>{matchedUserName}</Text>
            <Text style={styles.headerStatus}>Chat Tunnel 🔒</Text>
          </View>
        </View>
      </View>

      {/* Messages */}
      <FlatList
        ref={flatListRef}
        data={messages}
        keyExtractor={(item) => item.id}
        style={styles.messageList}
        contentContainerStyle={styles.messageListContent}
        renderItem={({ item }) => {
          const isMine = item.senderId === userId;
          return (
            <View
              style={[
                styles.messageRow,
                isMine ? styles.messageRowMine : styles.messageRowTheirs,
              ]}
            >
              <View
                style={[
                  styles.messageBubble,
                  isMine ? styles.bubbleMine : styles.bubbleTheirs,
                ]}
              >
                <Text style={[styles.messageText, isMine && styles.messageTextMine]}>
                  {item.text}
                </Text>
              </View>
              <Text style={styles.messageTime}>
                {new Date(item.timestamp).toLocaleTimeString([], {
                  hour: "2-digit",
                  minute: "2-digit",
                })}
              </Text>
            </View>
          );
        }}
      />

      {/* AI Assistant Button (floating, above input bar) */}
      <View style={styles.aiButtonContainer}>
        <AIAssistantButton onPress={() => setAiSheetVisible(true)} />
      </View>

      {/* Input bar */}
      <KeyboardAvoidingView
        behavior={Platform.OS === "ios" ? "padding" : undefined}
        keyboardVerticalOffset={0}
      >
        <View style={styles.inputBar}>
          <TextInput
            style={styles.input}
            placeholder="Type a message..."
            placeholderTextColor={colors.mutedForeground}
            value={inputText}
            onChangeText={setInputText}
            multiline
            maxLength={2000}
            editable={!sending}
          />
          <Pressable
            onPress={handleSend}
            disabled={!inputText.trim() || sending}
            style={[styles.sendBtn, (!inputText.trim() || sending) && styles.sendBtnDisabled]}
          >
            <Feather name="send" size={moderateScale(18)} color={colors.white} />
          </Pressable>
        </View>
      </KeyboardAvoidingView>

      {/* AI Assistant Sheet */}
      <AIAssistantSheet
        visible={aiSheetVisible}
        onClose={() => setAiSheetVisible(false)}
        onInsertSuggestion={handleInsertSuggestion}
        chatMessages={messages}
        matchedUserName={matchedUserName}
        userId={userId}
      />
    </View>
  );
}
