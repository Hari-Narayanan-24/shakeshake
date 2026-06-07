import { useEffect, useState, useMemo } from "react";
import {
  FlatList,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  View,
} from "react-native";
import { Feather } from "@expo/vector-icons";
import * as Haptics from "expo-haptics";
import {
  categoryMeta,
  getMockPlaces,
  getMoodPlaces,
  SUPER_CATEGORY_META,
  getSuperCategories,
  getCategoriesForSuper,
} from "../constants/placesData";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { moderateScale, verticalScale } from "../constants/theme";
import { useThemeContext } from "../contexts/ThemeContext";
import type { PlaceCategory, PlaceSuggestion } from "../types/explore";

type ExploreScreenProps = {
  userId: string;
  matchMood?: string;
  matchActivities?: string[];
};

const ALL_CATEGORIES = Object.keys(categoryMeta) as PlaceCategory[];
const ALL_SUPER_CATEGORIES = getSuperCategories();

export function ExploreScreen({ userId, matchMood, matchActivities }: ExploreScreenProps) {
  const [selectedCategories, setSelectedCategories] = useState<PlaceCategory[]>(["Coffee", "Food"]);
  const [places, setPlaces] = useState<PlaceSuggestion[]>([]);
  const [showAll, setShowAll] = useState(true);
  const [selectedSuperCategory, setSelectedSuperCategory] = useState<string | null>(null);

  const { colors } = useThemeContext();

  // Load places when categories change
  const loadPlaces = () => {
    setPlaces(getMockPlaces(selectedCategories));
  };

  useEffect(() => {
    loadPlaces();
  }, [selectedCategories]);

  // Match-based mode: if matchMood is provided, override with mood-filtered places
  const moodPlaces = matchMood ? getMoodPlaces(matchMood) : [];
  const isMatchMode = !!matchMood;
  const displayPlaces = isMatchMode ? moodPlaces : places;

  // Filtered categories based on selected super-category
  const visibleCategories = useMemo(() => {
    if (isMatchMode) return ALL_CATEGORIES;
    if (!selectedSuperCategory) return ALL_CATEGORIES;
    return getCategoriesForSuper(selectedSuperCategory);
  }, [selectedSuperCategory, isMatchMode]);

  const toggleCategory = (cat: PlaceCategory) => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    setSelectedCategories((prev) =>
      prev.includes(cat) ? prev.filter((c) => c !== cat) : [...prev, cat]
    );
  };

  const insets = useSafeAreaInsets();

  const handleShowAll = () => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    setShowAll(true);
    setSelectedCategories(["Coffee", "Food", "Drinks", "Walking", "Study", "Gym", "Movies", "Concerts"]);
  };

  const selectSuperCategory = (superCat: string | null) => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    setSelectedSuperCategory(superCat);
    if (superCat) {
      const cats = getCategoriesForSuper(superCat);
      setSelectedCategories(cats.slice(0, 3));
    } else {
      setSelectedCategories(["Coffee", "Food"]);
    }
    setShowAll(true);
  };

  const styles = StyleSheet.create({
    root: {
      flex: 1,
      backgroundColor: colors.background,
    },
    header: {
      paddingHorizontal: moderateScale(20),
      paddingBottom: moderateScale(8),
    },
    headerTitle: {
      fontSize: moderateScale(24),
      fontWeight: "900",
      color: colors.foreground,
    },
    headerSubtext: {
      fontSize: moderateScale(13),
      color: colors.mutedForeground,
      marginTop: moderateScale(2),
    },
    headerSubtitle: {
      fontSize: moderateScale(13),
      color: colors.mutedForeground,
      marginTop: moderateScale(4),
    },
    matchHeaderContainer: {
      gap: moderateScale(4),
    },
    matchHeaderTitle: {
      fontSize: moderateScale(22),
      fontWeight: "900",
      color: colors.foreground,
    },

    // ── Super-category pills ────────────────────────────────────
    superCategoryScroll: {
      maxHeight: moderateScale(48),
    },
    superCategoryRow: {
      paddingHorizontal: moderateScale(16),
      gap: moderateScale(8),
      alignItems: "center",
    },
    superCatPill: {
      flexDirection: "row",
      alignItems: "center",
      gap: moderateScale(4),
      backgroundColor: colors.card,
      borderWidth: 1.5,
      borderColor: colors.border,
      borderRadius: moderateScale(22),
      paddingHorizontal: moderateScale(14),
      paddingVertical: moderateScale(8),
    },
    superCatPillSelected: {
      backgroundColor: colors.primary,
      borderColor: colors.primary,
      shadowColor: colors.primary,
      shadowOpacity: 0.25,
      shadowRadius: 8,
      shadowOffset: { width: 0, height: 4 },
      elevation: 4,
    },
    superCatPillEmoji: {
      fontSize: moderateScale(15),
    },
    superCatPillLabel: {
      fontSize: moderateScale(13),
      fontWeight: "700",
      color: colors.foreground,
    },
    superCatPillLabelSelected: {
      color: colors.white,
    },

    // ── Category chips ──────────────────────────────────────────
    categoryScroll: {
      maxHeight: moderateScale(56),
    },
    categoryRow: {
      paddingHorizontal: moderateScale(12),
      gap: moderateScale(8),
    },
    catChip: {
      flexDirection: "row",
      alignItems: "center",
      gap: moderateScale(4),
      backgroundColor: colors.card,
      borderWidth: 1.5,
      borderColor: colors.border,
      borderRadius: moderateScale(20),
      paddingHorizontal: moderateScale(10),
      paddingVertical: moderateScale(6),
    },
    catChipSelected: {
      shadowOpacity: 0.25,
      shadowRadius: 8,
      shadowOffset: { width: 0, height: 4 },
      elevation: 4,
    },
    catEmoji: {
      fontSize: moderateScale(14),
    },
    catLabel: {
      fontSize: moderateScale(11),
      fontWeight: "700",
      color: colors.foreground,
    },
    catLabelSelected: {
      color: colors.white,
    },
    seeAllBtn: {
      alignSelf: "center",
      paddingVertical: moderateScale(6),
    },
    seeAllText: {
      fontSize: moderateScale(12),
      fontWeight: "700",
      color: colors.primary,
    },

    // ── Places list ─────────────────────────────────────────────
    placesList: {
      paddingHorizontal: moderateScale(16),
      paddingBottom: verticalScale(24),
      gap: moderateScale(12),
    },
    placeCardWrapper: {
      borderRadius: moderateScale(18),
      overflow: "hidden",
      borderWidth: 2,
      borderColor: colors.border,
      backgroundColor: colors.card,
    },
    accentBar: {
      height: moderateScale(6),
      width: "100%",
    },
    placeCardContent: {
      padding: moderateScale(16),
      gap: moderateScale(10),
    },
    placeHeader: {
      flexDirection: "row",
      justifyContent: "space-between",
      alignItems: "center",
    },
    categoryBadge: {
      flexDirection: "row",
      alignItems: "center",
      gap: moderateScale(6),
      backgroundColor: colors.secondary,
      paddingHorizontal: moderateScale(10),
      paddingVertical: moderateScale(6),
      borderRadius: 999,
    },
    categoryEmoji: {
      fontSize: moderateScale(18),
    },
    categoryBadgeText: {
      fontSize: moderateScale(11),
      fontWeight: "700",
      color: colors.foreground,
      textTransform: "uppercase",
    },
    ratingRow: {
      flexDirection: "row",
      alignItems: "center",
      gap: moderateScale(3),
    },
    ratingDot: {
      width: moderateScale(8),
      height: moderateScale(8),
      borderRadius: moderateScale(4),
    },
    ratingText: {
      fontSize: moderateScale(12),
      fontWeight: "700",
      color: colors.foreground,
      marginLeft: moderateScale(4),
    },
    placeName: {
      fontSize: moderateScale(16),
      fontWeight: "800",
      color: colors.foreground,
    },
    placeAddressRow: {
      flexDirection: "row",
      alignItems: "center",
      gap: moderateScale(4),
    },
    placeAddress: {
      fontSize: moderateScale(12),
      color: colors.mutedForeground,
      flex: 1,
    },
    placeDistance: {
      fontSize: moderateScale(11),
      fontWeight: "700",
      color: colors.primary,
    },

    // ── Tags ──────────────────────────────────────────────────
    tagRow: {
      flexDirection: "row",
      flexWrap: "wrap",
      gap: moderateScale(6),
    },
    moodTag: {
      backgroundColor: "#DCFCE7",
      paddingHorizontal: moderateScale(8),
      paddingVertical: moderateScale(4),
      borderRadius: 999,
    },
    moodTagText: {
      fontSize: moderateScale(10),
      fontWeight: "700",
      color: "#16A34A",
    },
    vibeTag: {
      backgroundColor: "#E8E5FF",
      paddingHorizontal: moderateScale(8),
      paddingVertical: moderateScale(4),
      borderRadius: 999,
    },
    vibeTagText: {
      fontSize: moderateScale(10),
      fontWeight: "700",
      color: "#7C3AED",
    },

    // ── Price ───────────────────────────────────────────────────
    priceRow: {
      flexDirection: "row",
      alignItems: "center",
      gap: moderateScale(3),
      paddingTop: moderateScale(2),
    },
    priceLabel: {
      fontSize: moderateScale(12),
    },
    priceDot: {
      width: moderateScale(8),
      height: moderateScale(8),
      borderRadius: moderateScale(4),
      backgroundColor: colors.foreground,
    },

    // ── Empty ──────────────────────────────────────────────────
    emptyContainer: {
      flex: 1,
      alignItems: "center",
      justifyContent: "center",
      gap: moderateScale(12),
    },
    emptyTitle: {
      fontSize: moderateScale(20),
      fontWeight: "800",
      color: colors.foreground,
    },
    emptySubtitle: {
      fontSize: moderateScale(14),
      color: colors.mutedForeground,
      textAlign: "center",
    },
  });

  // ── Empty state ──────────────────────────────────────────────
  if (displayPlaces.length === 0) {
    return (
      <View style={styles.emptyContainer}>
        <Feather name="map-pin" size={moderateScale(40)} color={colors.primary} />
        <Text style={styles.emptyTitle}>No Places Found</Text>
        <Text style={styles.emptySubtitle}>Select categories to discover places nearby</Text>
      </View>
    );
  }

  return (
    <View style={styles.root}>
      {/* Header */}
      <View style={[styles.header, { paddingTop: insets.top + verticalScale(8) }]}>
        {isMatchMode ? (
          <View style={styles.matchHeaderContainer}>
            <Text style={styles.matchHeaderTitle}>
              Perfect for "{matchMood}" vibe 🔍
            </Text>
            {matchActivities && matchActivities.length > 0 && (
              <Text style={styles.headerSubtitle}>
                Based on: {matchActivities.slice(0, 5).join(", ")}
              </Text>
            )}
          </View>
        ) : (
          <View>
            <Text style={styles.headerTitle}>Explore</Text>
            {selectedSuperCategory && (
              <Text style={styles.headerSubtext}>
                Showing {selectedSuperCategory} categories
              </Text>
            )}
          </View>
        )}
      </View>

      {/* Super-category pills (only in normal mode) */}
      {!isMatchMode && (
        <ScrollView
          horizontal
          showsHorizontalScrollIndicator={false}
          contentContainerStyle={styles.superCategoryRow}
          style={styles.superCategoryScroll}
        >
          <Pressable
            onPress={() => selectSuperCategory(null)}
            style={[
              styles.superCatPill,
              !selectedSuperCategory && styles.superCatPillSelected,
            ]}
          >
            <Text style={[styles.superCatPillLabel, !selectedSuperCategory && styles.superCatPillLabelSelected]}>
              All
            </Text>
          </Pressable>
          {ALL_SUPER_CATEGORIES.map((superCat) => {
            const meta = SUPER_CATEGORY_META[superCat];
            const isSelected = selectedSuperCategory === superCat;
            return (
              <Pressable
                key={superCat}
                onPress={() => selectSuperCategory(superCat)}
                style={[
                  styles.superCatPill,
                  isSelected && {
                    ...styles.superCatPillSelected,
                    backgroundColor: meta.color,
                    borderColor: meta.color,
                  },
                ]}
              >
                <Text style={styles.superCatPillEmoji}>{meta.emoji}</Text>
                <Text
                  style={[
                    styles.superCatPillLabel,
                    isSelected && styles.superCatPillLabelSelected,
                  ]}
                >
                  {superCat}
                </Text>
              </Pressable>
            );
          })}
        </ScrollView>
      )}

      {/* Category chips */}
      <ScrollView
        horizontal
        showsHorizontalScrollIndicator={false}
        contentContainerStyle={styles.categoryRow}
        style={styles.categoryScroll}
      >
        {visibleCategories.map((cat) => {
          const meta = categoryMeta[cat];
          const selected = selectedCategories.includes(cat);
          return (
            <Pressable
              key={cat}
              onPress={() => toggleCategory(cat)}
              style={[
                styles.catChip,
                selected && {
                  ...styles.catChipSelected,
                  backgroundColor: meta.color,
                  borderColor: meta.color,
                  shadowColor: meta.color,
                },
              ]}
            >
              <Text style={styles.catEmoji}>{meta.emoji}</Text>
              <Text style={[styles.catLabel, selected && styles.catLabelSelected]}>
                {cat}
              </Text>
            </Pressable>
          );
        })}
      </ScrollView>

      {!showAll && !isMatchMode && (
        <Pressable onPress={handleShowAll} style={styles.seeAllBtn}>
          <Text style={styles.seeAllText}>See All</Text>
        </Pressable>
      )}

      {/* Places list */}
      <FlatList
        data={displayPlaces}
        keyExtractor={(item) => item.id}
        numColumns={1}
        contentContainerStyle={styles.placesList}
        renderItem={({ item }) => (
          <Pressable
            style={styles.placeCardWrapper}
            onPress={() => Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light)}
          >
            {/* Colored top accent bar */}
            <View
              style={[
                styles.accentBar,
                { backgroundColor: categoryMeta[item.category]?.color ?? colors.primary },
              ]}
            />
            <View style={styles.placeCardContent}>
              {/* Category + Rating row */}
              <View style={styles.placeHeader}>
                <View style={styles.categoryBadge}>
                  <Text style={styles.categoryEmoji}>
                    {categoryMeta[item.category]?.emoji}
                  </Text>
                  <Text style={styles.categoryBadgeText}>{item.category}</Text>
                </View>
                <View style={styles.ratingRow}>
                  {[1, 2, 3, 4, 5].map((star) => (
                    <View
                      key={star}
                      style={[
                        styles.ratingDot,
                        {
                          backgroundColor:
                            item.rating >= star
                              ? "#F39C12"
                              : "rgba(243,156,18,0.2)",
                        },
                      ]}
                    />
                  ))}
                  <Text style={styles.ratingText}>{item.rating.toFixed(1)}</Text>
                </View>
              </View>

              {/* Name + Address */}
              <Text style={styles.placeName}>{item.name}</Text>
              <View style={styles.placeAddressRow}>
                <Feather name="map-pin" size={moderateScale(12)} color={colors.mutedForeground} />
                <Text style={styles.placeAddress}>{item.address}</Text>
                <Text style={styles.placeDistance}>{item.distance}</Text>
              </View>

              {/* Mood tags */}
              <View style={styles.tagRow}>
                {item.moodMatch.slice(0, 3).map((m) => (
                  <View key={m} style={styles.moodTag}>
                    <Text style={styles.moodTagText}>{m}</Text>
                  </View>
                ))}
                {item.vibeTags.slice(0, 2).map((v) => (
                  <View key={v} style={styles.vibeTag}>
                    <Text style={styles.vibeTagText}>{v}</Text>
                  </View>
                ))}
              </View>

              {/* Price indicator */}
              <View style={styles.priceRow}>
                <Text style={styles.priceLabel}>💰</Text>
                {[1, 2, 3, 4].map((level) => (
                  <View
                    key={level}
                    style={[
                      styles.priceDot,
                      { opacity: (item.priceLevel ?? 2) >= level ? 1 : 0.2 },
                    ]}
                  />
                ))}
              </View>
            </View>
          </Pressable>
        )}
      />
    </View>
  );
}
