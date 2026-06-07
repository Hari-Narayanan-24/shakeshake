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
import { profileConnector } from "../connectors/profileConnector";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { moderateScale, verticalScale } from "../constants/theme";
import { useThemeContext } from "../contexts/ThemeContext";

type ProfileTabScreenProps = {
  userId: string;
  userName: string;
  onLogout: () => void;
  onOpenSettings: () => void;
};

  type ProfileData = {
  email: string;
  age_range: string;
  major: string;
  bio: string;
};

type IdentityData = {
  gender: string;
  orientation: string;
  religion: string;
};

type InterestData = {
  hobbies: string[];
  music: string[];
  movies: string[];
  tv: string[];
  games: string[];
};

type PersonalityData = {
  mbti: string;
  listener_speaker: number;
  dominant_passive: number;
  emotion_action: number;
};

export function ProfileTabScreen({ userId, userName, onLogout, onOpenSettings }: ProfileTabScreenProps) {
  const insets = useSafeAreaInsets();
  const { colors } = useThemeContext();
  const [profile, setProfile] = useState<ProfileData>({ email: "", age_range: "", major: "", bio: "" });
  const [identity, setIdentity] = useState<IdentityData>({ gender: "", orientation: "", religion: "" });
  const [interests, setInterests] = useState<InterestData>({ hobbies: [], music: [], movies: [], tv: [], games: [] });
  const [personality, setPersonality] = useState<PersonalityData>({ mbti: "", listener_speaker: 0.5, dominant_passive: 0.5, emotion_action: 0.5 });

  // Editable fields
  const [editName, setEditName] = useState(userName);
  const [editBio, setEditBio] = useState("");
  const [editMajor, setEditMajor] = useState("");
  const [editAge, setEditAge] = useState("");
  const [isEditing, setIsEditing] = useState(false);
  const [saving, setSaving] = useState(false);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadProfile();
  }, [userId]);

  const loadProfile = async () => {
    setLoading(true);
    try {
      const p = await profileConnector.getProfile(userId);
      setProfile({
        email: p.email || "",
        age_range: p.age_range || "",
        major: p.major || "",
        bio: p.bio || "",
      });
      setEditName(p.name || userName);
      setEditBio(p.bio || "");
      setEditMajor(p.major || "");
      setEditAge(p.age_range || "");
    } catch {
      // Use defaults
    }

    try {
      const i = await profileConnector.getIdentity(userId) as any;
      setIdentity({ gender: i.gender || "", orientation: i.orientation || "", religion: i.religion || "" });
    } catch (err) {
      console.warn("[ProfileTab] Failed to load identity:", err);
    }

    try {
      const int = await profileConnector.getInterests(userId) as any;
      setInterests({
        hobbies: int.hobbies || [],
        music: int.music || [],
        movies: int.movies || [],
        tv: int.tv || [],
        games: int.games || [],
      });
    } catch (err) {
      console.warn("[ProfileTab] Failed to load interests:", err);
    }

    try {
      const pers = await profileConnector.getPersonality(userId) as any;
      setPersonality({
        mbti: pers.mbti || "",
        listener_speaker: pers.listener_speaker ?? 0.5,
        dominant_passive: pers.dominant_passive ?? 0.5,
        emotion_action: pers.emotion_action ?? 0.5,
      });
    } catch (err) {
      console.warn("[ProfileTab] Failed to load personality:", err);
    }

    setLoading(false);
  };

  const handleSave = async () => {
    setSaving(true);
    try {
      await profileConnector.updateProfile(userId, {
        name: editName,
        bio: editBio,
        major: editMajor,
        age_range: editAge,
      });
      setProfile({ ...profile, bio: editBio, major: editMajor, age_range: editAge });
      setIsEditing(false);
      Alert.alert("Saved", "Profile updated!");
    } catch {
      Alert.alert("Error", "Failed to save profile.");
    } finally {
      setSaving(false);
    }
  };

  const handleLogout = () => {
    Alert.alert("Log Out", "Are you sure you want to log out?", [
      { text: "Cancel", style: "cancel" },
      { text: "Log Out", style: "destructive", onPress: onLogout },
    ]);
  };

  // ── All interest chips flattened ──
  const allInterests = [
    ...interests.hobbies,
    ...interests.music,
    ...interests.movies,
    ...interests.tv,
    ...interests.games,
  ];

  const styles = StyleSheet.create({
    root: {
      flex: 1,
      backgroundColor: colors.background,
    },
    content: {
      paddingHorizontal: moderateScale(20),
      paddingTop: insets.top + verticalScale(16),
      paddingBottom: verticalScale(40),
      gap: moderateScale(14),
    },

    // ── Header ────────────────────────────────────────────────────
    headerSection: {
      alignItems: "center",
      paddingVertical: verticalScale(12),
    },
    avatar: {
      width: moderateScale(80),
      height: moderateScale(80),
      borderRadius: moderateScale(40),
      backgroundColor: colors.primary,
      alignItems: "center",
      justifyContent: "center",
      shadowColor: colors.primary,
      shadowOpacity: 0.3,
      shadowRadius: 12,
      shadowOffset: { width: 0, height: 4 },
      elevation: 6,
    },
    avatarLetter: {
      fontSize: moderateScale(32),
      fontWeight: "900",
      color: colors.white,
    },
    profileName: {
      fontSize: moderateScale(22),
      fontWeight: "900",
      color: colors.foreground,
      marginTop: moderateScale(8),
    },
    profileEmail: {
      fontSize: moderateScale(14),
      color: colors.mutedForeground,
      marginTop: moderateScale(4),
    },

    // ── Sections ──────────────────────────────────────────────────
    section: {
      backgroundColor: colors.card,
      borderRadius: moderateScale(18),
      borderWidth: 1.5,
      borderColor: colors.border,
      padding: moderateScale(16),
      gap: moderateScale(12),
    },
    sectionHeader: {
      flexDirection: "row",
      justifyContent: "space-between",
      alignItems: "center",
    },
    sectionTitle: {
      fontSize: moderateScale(16),
      fontWeight: "800",
      color: colors.foreground,
    },
    editBtn: {
      padding: moderateScale(6),
    },

    // ── Edit Form ─────────────────────────────────────────────────
    editForm: {
      gap: moderateScale(12),
    },
    fieldGroup: {
      gap: moderateScale(4),
    },
    fieldLabel: {
      fontSize: moderateScale(12),
      fontWeight: "700",
      color: colors.mutedForeground,
      textTransform: "uppercase",
    },
    fieldInput: {
      backgroundColor: colors.muted,
      borderRadius: moderateScale(12),
      paddingHorizontal: moderateScale(14),
      paddingVertical: moderateScale(10),
      fontSize: moderateScale(14),
      fontWeight: "500",
      color: colors.foreground,
      borderWidth: 1,
      borderColor: colors.border,
    },
    bioInput: {
      minHeight: moderateScale(70),
      textAlignVertical: "top",
    },
    fieldRow: {
      flexDirection: "row",
      gap: moderateScale(10),
    },
    editActions: {
      flexDirection: "row",
      justifyContent: "flex-end",
      gap: moderateScale(10),
    },
    cancelBtn: {
      paddingHorizontal: moderateScale(16),
      paddingVertical: moderateScale(8),
      borderRadius: moderateScale(10),
      backgroundColor: colors.muted,
    },
    cancelBtnText: {
      fontSize: moderateScale(14),
      fontWeight: "700",
      color: colors.mutedForeground,
    },
    saveBtn: {
      paddingHorizontal: moderateScale(20),
      paddingVertical: moderateScale(8),
      borderRadius: moderateScale(10),
      backgroundColor: colors.primary,
    },
    saveBtnText: {
      fontSize: moderateScale(14),
      fontWeight: "700",
      color: colors.white,
    },

    // ── Display Fields ────────────────────────────────────────────
    displayFields: {
      gap: moderateScale(6),
    },
    displayText: {
      fontSize: moderateScale(14),
      fontWeight: "500",
      color: colors.foreground,
      lineHeight: moderateScale(20),
    },
    displayHint: {
      fontSize: moderateScale(13),
      color: colors.mutedForeground,
      fontStyle: "italic",
    },
    displayRow: {
      flexDirection: "row",
      alignItems: "center",
      gap: moderateScale(6),
    },
    displayLabel: {
      fontSize: moderateScale(13),
      fontWeight: "600",
      color: colors.foreground,
    },
    displayGrid: {
      flexDirection: "row",
      flexWrap: "wrap",
      gap: moderateScale(8),
    },
    displayTag: {
      backgroundColor: colors.muted,
      borderRadius: moderateScale(10),
      paddingHorizontal: moderateScale(12),
      paddingVertical: moderateScale(6),
    },
    displayTagText: {
      fontSize: moderateScale(13),
      fontWeight: "600",
      color: colors.foreground,
    },

    // ── Interests ─────────────────────────────────────────────────
    interestGrid: {
      flexDirection: "row",
      flexWrap: "wrap",
      gap: moderateScale(6),
    },
    interestChip: {
      backgroundColor: "rgba(255, 83, 118, 0.12)",
      borderRadius: moderateScale(10),
      paddingHorizontal: moderateScale(10),
      paddingVertical: moderateScale(5),
      borderWidth: 1,
      borderColor: "rgba(255, 83, 118, 0.25)",
    },
    interestChipText: {
      fontSize: moderateScale(12),
      fontWeight: "600",
      color: colors.primary,
    },

    // ── Personality ────────────────────────────────────────────────
    mbtiRow: {
      alignItems: "center",
    },
    mbtiBadge: {
      backgroundColor: colors.secondary,
      borderRadius: moderateScale(14),
      paddingHorizontal: moderateScale(20),
      paddingVertical: moderateScale(10),
      borderWidth: 2,
      borderColor: "rgba(255, 83, 118, 0.3)",
    },
    mbtiText: {
      fontSize: moderateScale(22),
      fontWeight: "900",
      color: colors.foreground,
      letterSpacing: 1,
    },
    sliderRow: {
      flexDirection: "row",
      alignItems: "center",
      gap: moderateScale(8),
    },
    sliderLabel: {
      fontSize: moderateScale(11),
      fontWeight: "600",
      color: colors.mutedForeground,
      width: moderateScale(55),
    },
    sliderTrack: {
      flex: 1,
      height: moderateScale(6),
      borderRadius: moderateScale(3),
      backgroundColor: colors.muted,
      overflow: "hidden",
    },
    sliderFill: {
      height: "100%",
      borderRadius: moderateScale(3),
      backgroundColor: colors.primary,
    },

    // ── Actions ───────────────────────────────────────────────────
    actionRow: {
      flexDirection: "row",
      alignItems: "center",
      gap: moderateScale(12),
      paddingVertical: moderateScale(4),
    },
    actionText: {
      flex: 1,
      fontSize: moderateScale(15),
      fontWeight: "600",
      color: colors.foreground,
    },
    actionDivider: {
      height: 1,
      backgroundColor: colors.border,
      marginVertical: moderateScale(4),
    },
  });

  return (
    <ScrollView style={styles.root} contentContainerStyle={styles.content}>
      {/* Header / Avatar */}
      <View style={styles.headerSection}>
        <View style={styles.avatar}>
          <Text style={styles.avatarLetter}>{(editName || userName).charAt(0).toUpperCase()}</Text>
        </View>
        <Text style={styles.profileName}>{editName || userName}</Text>
        <Text style={styles.profileEmail}>{profile.email || "No email"}</Text>
      </View>

      {/* Editable Profile */}
      <View style={styles.section}>
        <View style={styles.sectionHeader}>
          <Text style={styles.sectionTitle}>Edit Profile</Text>
          {!isEditing && (
            <Pressable onPress={() => setIsEditing(true)} style={styles.editBtn}>
              <Feather name="edit-2" size={moderateScale(14)} color={colors.primary} />
            </Pressable>
          )}
        </View>

        {isEditing ? (
          <View style={styles.editForm}>
            <View style={styles.fieldGroup}>
              <Text style={styles.fieldLabel}>Name</Text>
              <TextInput style={styles.fieldInput} value={editName} onChangeText={setEditName} />
            </View>
            <View style={styles.fieldGroup}>
              <Text style={styles.fieldLabel}>Bio</Text>
              <TextInput
                style={[styles.fieldInput, styles.bioInput]}
                value={editBio}
                onChangeText={setEditBio}
                placeholder="Tell people about yourself..."
                placeholderTextColor={colors.mutedForeground}
                multiline
                maxLength={200}
              />
            </View>
            <View style={styles.fieldRow}>
              <View style={[styles.fieldGroup, { flex: 1 }]}>
                <Text style={styles.fieldLabel}>Major</Text>
                <TextInput style={styles.fieldInput} value={editMajor} onChangeText={setEditMajor} />
              </View>
              <View style={[styles.fieldGroup, { flex: 1 }]}>
                <Text style={styles.fieldLabel}>Age Range</Text>
                <TextInput style={styles.fieldInput} value={editAge} onChangeText={setEditAge} />
              </View>
            </View>
            <View style={styles.editActions}>
              <Pressable onPress={() => setIsEditing(false)} style={styles.cancelBtn}>
                <Text style={styles.cancelBtnText}>Cancel</Text>
              </Pressable>
              <Pressable onPress={handleSave} disabled={saving} style={styles.saveBtn}>
                <Text style={styles.saveBtnText}>{saving ? "Saving..." : "Save"}</Text>
              </Pressable>
            </View>
          </View>
        ) : (
          <View style={styles.displayFields}>
            {editBio ? <Text style={styles.displayText}>{editBio}</Text> : <Text style={styles.displayHint}>No bio yet</Text>}
            {editMajor ? (
              <View style={styles.displayRow}>
                <Feather name="book" size={moderateScale(14)} color={colors.mutedForeground} />
                <Text style={styles.displayLabel}>{editMajor}</Text>
              </View>
            ) : null}
            {editAge ? (
              <View style={styles.displayRow}>
                <Feather name="calendar" size={moderateScale(14)} color={colors.mutedForeground} />
                <Text style={styles.displayLabel}>{editAge}</Text>
              </View>
            ) : null}
          </View>
        )}
      </View>

      {/* Identity */}
      {(identity.gender || identity.orientation || identity.religion) && (
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Identity</Text>
          <View style={styles.displayGrid}>
            {identity.gender ? (
              <View style={styles.displayTag}>
                <Text style={styles.displayTagText}>{identity.gender}</Text>
              </View>
            ) : null}
            {identity.orientation ? (
              <View style={styles.displayTag}>
                <Text style={styles.displayTagText}>{identity.orientation}</Text>
              </View>
            ) : null}
            {identity.religion ? (
              <View style={styles.displayTag}>
                <Text style={styles.displayTagText}>{identity.religion}</Text>
              </View>
            ) : null}
          </View>
        </View>
      )}

      {/* Interests */}
      {allInterests.length > 0 && (
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Interests</Text>
          <View style={styles.interestGrid}>
            {allInterests.map((interest) => (
              <View key={interest} style={styles.interestChip}>
                <Text style={styles.interestChipText}>{interest}</Text>
              </View>
            ))}
          </View>
        </View>
      )}

      {/* Personality */}
      {personality.mbti && (
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Personality</Text>
          <View style={styles.mbtiRow}>
            <View style={styles.mbtiBadge}>
              <Text style={styles.mbtiText}>{personality.mbti}</Text>
            </View>
          </View>
          <View style={styles.sliderRow}>
            <Text style={styles.sliderLabel}>Listener</Text>
            <View style={styles.sliderTrack}>
              <View style={[styles.sliderFill, { width: `${(personality.listener_speaker || 0.5) * 100}%` }]} />
            </View>
            <Text style={styles.sliderLabel}>Speaker</Text>
          </View>
          <View style={styles.sliderRow}>
            <Text style={styles.sliderLabel}>Dominant</Text>
            <View style={styles.sliderTrack}>
              <View style={[styles.sliderFill, { width: `${(personality.dominant_passive || 0.5) * 100}%` }]} />
            </View>
            <Text style={styles.sliderLabel}>Passive</Text>
          </View>
          <View style={styles.sliderRow}>
            <Text style={styles.sliderLabel}>Emotion</Text>
            <View style={styles.sliderTrack}>
              <View style={[styles.sliderFill, { width: `${(personality.emotion_action || 0.5) * 100}%` }]} />
            </View>
            <Text style={styles.sliderLabel}>Action</Text>
          </View>
        </View>
      )}

      {/* Actions */}
      <View style={styles.section}>
        <Pressable style={styles.actionRow} onPress={onOpenSettings}>
          <Feather name="settings" size={moderateScale(18)} color={colors.foreground} />
          <Text style={styles.actionText}>Settings</Text>
          <Feather name="chevron-right" size={moderateScale(16)} color={colors.mutedForeground} />
        </Pressable>
        <View style={styles.actionDivider} />
        <Pressable style={styles.actionRow} onPress={handleLogout}>
          <Feather name="log-out" size={moderateScale(18)} color="#EF4444" />
          <Text style={[styles.actionText, { color: "#EF4444" }]}>Log Out</Text>
          <View style={{ width: moderateScale(16) }} />
        </Pressable>
      </View>
    </ScrollView>
  );
}
