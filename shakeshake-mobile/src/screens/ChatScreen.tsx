import { useEffect, useState } from "react";
import {
  FlatList,
  Pressable,
  StyleSheet,
  Text,
  View,
} from "react-native";
import { Feather } from "@expo/vector-icons";
import * as Haptics from "expo-haptics";
import { chatConnector } from "../connectors/chatConnector";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { moderateScale, verticalScale } from "../constants/theme";
import { useThemeContext } from "../contexts/ThemeContext";
import type { ChatConversation } from "../types/chat";

type ChatScreenProps = {
  userId: string;
  onOpenConversation: (matchId: string, matchedUserName: string) => void;
};

export function ChatScreen({ userId, onOpenConversation }: ChatScreenProps) {
  const insets = useSafeAreaInsets();
  const { colors } = useThemeContext();
  const [conversations, setConversations] = useState<ChatConversation[]>([]);
  const [loading, setLoading] = useState(true);

  const fetchConversations = async () => {
    try {
      const res = await chatConnector.getConversations(userId);
      setConversations(res.conversations);
    } catch {
      // Silent fail — keep existing data
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchConversations();
    const interval = setInterval(fetchConversations, 10000); // Poll every 10s
    return () => clearInterval(interval);
  }, [userId]);

  const handlePress = (conv: ChatConversation) => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    onOpenConversation(conv.matchId, conv.matchedUserName);
  };

  const styles = StyleSheet.create({
    root: {
      flex: 1,
      backgroundColor: colors.background,
    },
    header: {
      paddingHorizontal: moderateScale(20),
      paddingBottom: verticalScale(8),
    },
    headerTitle: {
      fontSize: moderateScale(26),
      fontWeight: "900",
      color: colors.foreground,
    },
    emptyContainer: {
      flex: 1,
      alignItems: "center",
      justifyContent: "center",
      backgroundColor: colors.background,
      gap: moderateScale(12),
    },
    emptyIcon: {
      width: moderateScale(80),
      height: moderateScale(80),
      borderRadius: moderateScale(40),
      backgroundColor: colors.secondary,
      alignItems: "center",
      justifyContent: "center",
    },
    emptyTitle: {
      fontSize: moderateScale(22),
      fontWeight: "900",
      color: colors.foreground,
    },
    emptySubtitle: {
      fontSize: moderateScale(14),
      color: colors.mutedForeground,
    },

    // ── Matched section ────────────────────────────────────────────
    matchedSection: {
      paddingTop: moderateScale(8),
      paddingBottom: moderateScale(4),
    },
    sectionLabel: {
      fontSize: moderateScale(13),
      fontWeight: "700",
      color: colors.mutedForeground,
      paddingHorizontal: moderateScale(20),
      marginBottom: moderateScale(8),
    },
    matchedList: {
      paddingHorizontal: moderateScale(16),
      gap: moderateScale(12),
    },
    matchedBubble: {
      alignItems: "center",
      gap: moderateScale(4),
      width: moderateScale(72),
    },
    avatar: {
      width: moderateScale(52),
      height: moderateScale(52),
      borderRadius: moderateScale(26),
      backgroundColor: colors.primary,
      alignItems: "center",
      justifyContent: "center",
    },
    avatarLetter: {
      fontSize: moderateScale(20),
      fontWeight: "800",
      color: colors.white,
    },
    matchedName: {
      fontSize: moderateScale(11),
      fontWeight: "700",
      color: colors.foreground,
      textAlign: "center",
    },
    percentBadge: {
      backgroundColor: "#DCFCE7",
      paddingHorizontal: moderateScale(6),
      paddingVertical: moderateScale(2),
      borderRadius: 999,
    },
    percentBadgeText: {
      fontSize: moderateScale(10),
      fontWeight: "800",
      color: "#16A34A",
    },

    // ── Conversation list ──────────────────────────────────────────
    convList: {
      paddingHorizontal: moderateScale(16),
      paddingTop: verticalScale(8),
    },
    convItem: {
      flexDirection: "row",
      alignItems: "center",
      gap: moderateScale(12),
      paddingVertical: moderateScale(12),
      borderBottomWidth: 1,
      borderBottomColor: colors.border,
    },
    convAvatar: {
      width: moderateScale(46),
      height: moderateScale(46),
      borderRadius: moderateScale(23),
      backgroundColor: colors.secondary,
      alignItems: "center",
      justifyContent: "center",
    },
    convAvatarLetter: {
      fontSize: moderateScale(18),
      fontWeight: "800",
      color: colors.primary,
    },
    convContent: {
      flex: 1,
      gap: moderateScale(2),
    },
    convHeader: {
      flexDirection: "row",
      justifyContent: "space-between",
      alignItems: "center",
    },
    convName: {
      fontSize: moderateScale(15),
      fontWeight: "700",
      color: colors.foreground,
    },
    convTime: {
      fontSize: moderateScale(12),
      color: colors.mutedForeground,
    },
    convPreview: {
      fontSize: moderateScale(13),
      color: colors.mutedForeground,
    },
    unreadBadge: {
      backgroundColor: colors.primary,
      width: moderateScale(22),
      height: moderateScale(22),
      borderRadius: moderateScale(11),
      alignItems: "center",
      justifyContent: "center",
    },
    unreadBadgeText: {
      fontSize: moderateScale(11),
      fontWeight: "800",
      color: colors.white,
    },
  });

  // ── Empty state ──────────────────────────────────────────────────
  if (!loading && conversations.length === 0) {
    return (
      <View style={styles.emptyContainer}>
        <View style={styles.emptyIcon}>
          <Feather name="zap" size={moderateScale(40)} color={colors.primary} />
        </View>
        <Text style={styles.emptyTitle}>No Matches Yet</Text>
        <Text style={styles.emptySubtitle}>
          Shake to find your first match! ⚡
        </Text>
      </View>
    );
  }

  return (
    <View style={styles.root}>
      <View style={[styles.header, { paddingTop: insets.top + verticalScale(8) }]}>
        <Text style={styles.headerTitle}>Chat</Text>
      </View>

      {/* Matched section — horizontal scroll of match bubbles */}
      {conversations.length > 0 && (
        <View style={styles.matchedSection}>
          <Text style={styles.sectionLabel}>Matched</Text>
          <FlatList
            horizontal
            showsHorizontalScrollIndicator={false}
            data={conversations}
            keyExtractor={(item) => item.matchId}
            renderItem={({ item }) => (
              <Pressable
                onPress={() => handlePress(item)}
                style={styles.matchedBubble}
              >
                <View style={styles.avatar}>
                  <Text style={styles.avatarLetter}>
                    {item.matchedUserName.charAt(0).toUpperCase()}
                  </Text>
                </View>
                <Text style={styles.matchedName} numberOfLines={1}>
                  {item.matchedUserName}
                </Text>
                <View style={styles.percentBadge}>
                  <Text style={styles.percentBadgeText}>
                    {Math.round(item.matchPercentage)}%
                  </Text>
                </View>
              </Pressable>
            )}
            contentContainerStyle={styles.matchedList}
          />
        </View>
      )}

      {/* Conversation list */}
      <FlatList
        data={conversations}
        keyExtractor={(item) => item.matchId}
        renderItem={({ item }) => (
          <Pressable
            onPress={() => handlePress(item)}
            style={styles.convItem}
          >
            <View style={styles.convAvatar}>
              <Text style={styles.convAvatarLetter}>
                {item.matchedUserName.charAt(0).toUpperCase()}
              </Text>
            </View>
            <View style={styles.convContent}>
              <View style={styles.convHeader}>
                <Text style={styles.convName}>{item.matchedUserName}</Text>
                <Text style={styles.convTime}>
                  {item.lastMessage
                    ? new Date(item.lastMessage.timestamp).toLocaleTimeString([], {
                        hour: "2-digit",
                        minute: "2-digit",
                      })
                    : ""}
                </Text>
              </View>
              <Text style={styles.convPreview} numberOfLines={1}>
                {item.lastMessage?.text ?? item.catchPhrase ?? "Start chatting!"}
              </Text>
            </View>
            {item.unreadCount > 0 && (
              <View style={styles.unreadBadge}>
                <Text style={styles.unreadBadgeText}>{item.unreadCount}</Text>
              </View>
            )}
          </Pressable>
        )}
        contentContainerStyle={styles.convList}
      />
    </View>
  );
}
