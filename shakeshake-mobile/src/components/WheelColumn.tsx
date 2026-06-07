import { useEffect, useRef, useCallback } from "react";
import {
  FlatList,
  NativeScrollEvent,
  NativeSyntheticEvent,
  StyleSheet,
  Text,
  View,
  LayoutChangeEvent,
} from "react-native";
import { moderateScale } from "../constants/theme";
import { useThemeContext } from "../contexts/ThemeContext";

// ── Single scroll-wheel column (iOS-style drum) ────────────────────

type WheelColumnProps = {
  items: string[];
  selectedIndex: number;
  onChange: (index: number) => void;
  width?: number;
};

const ITEM_HEIGHT = moderateScale(40);
const VISIBLE_COUNT = 3;

export function WheelColumn({
  items,
  selectedIndex,
  onChange,
  width = moderateScale(70),
}: WheelColumnProps) {
  const { colors } = useThemeContext();
  const flatListRef = useRef<FlatList>(null);
  const isScrolling = useRef(false);

  // Snap to selected index when it changes externally
  useEffect(() => {
    if (flatListRef.current && !isScrolling.current) {
      flatListRef.current.scrollToIndex({
        index: selectedIndex,
        animated: true,
      });
    }
  }, [selectedIndex]);

  const handleMomentumScrollEnd = useCallback(
    (event: NativeSyntheticEvent<NativeScrollEvent>) => {
      const offsetY = event.nativeEvent.contentOffset.y;
      const index = Math.round(offsetY / ITEM_HEIGHT);
      isScrolling.current = false;
      if (index >= 0 && index < items.length && index !== selectedIndex) {
        onChange(index);
      }
    },
    [items.length, selectedIndex, onChange]
  );

  const handleScrollBeginDrag = useCallback(() => {
    isScrolling.current = true;
  }, []);

  const renderItem = useCallback(
    ({ item, index }: { item: string; index: number }) => {
      const isSelected = index === selectedIndex;
      return (
        <View style={wheelStyles.item}>
          <Text
            style={[
              wheelStyles.itemText,
              {
                fontSize: moderateScale(isSelected ? 22 : 18),
                fontWeight: isSelected ? "700" : "400",
                color: isSelected ? colors.foreground : colors.mutedForeground,
                opacity: isSelected ? 1 : 0.35,
              },
            ]}
            allowFontScaling={false}
          >
            {item}
          </Text>
        </View>
      );
    },
    [selectedIndex, colors.foreground, colors.mutedForeground]
  );

  return (
    <View
      style={[
        wheelStyles.container,
        {
          width,
          height: ITEM_HEIGHT * VISIBLE_COUNT,
        },
      ]}
    >
      {/* Highlight bar behind the selected row */}
      <View
        style={[
          wheelStyles.highlight,
          {
            top: ITEM_HEIGHT,
            height: ITEM_HEIGHT,
            borderColor: colors.border,
            backgroundColor: `${colors.primary}10`,
          },
        ]}
        pointerEvents="none"
      />

      <FlatList
        ref={flatListRef}
        data={items}
        keyExtractor={(_, i) => String(i)}
        renderItem={renderItem}
        showsVerticalScrollIndicator={false}
        snapToInterval={ITEM_HEIGHT}
        onMomentumScrollEnd={handleMomentumScrollEnd}
        onScrollBeginDrag={handleScrollBeginDrag}
        getItemLayout={(_, index) => ({
          length: ITEM_HEIGHT,
          offset: ITEM_HEIGHT * index,
          index,
        })}
        initialScrollIndex={selectedIndex}
        contentContainerStyle={{
          paddingVertical: ITEM_HEIGHT, // allow first/last items to center
        }}
      />
    </View>
  );
}

const wheelStyles = StyleSheet.create({
  container: {
    overflow: "hidden",
    borderRadius: moderateScale(12),
  },
  highlight: {
    position: "absolute",
    left: 0,
    right: 0,
    borderTopWidth: 1.5,
    borderBottomWidth: 1.5,
    zIndex: 0,
  },
  item: {
    height: ITEM_HEIGHT,
    justifyContent: "center",
    alignItems: "center",
    zIndex: 1,
  },
  itemText: {
    textAlign: "center",
  },
});
