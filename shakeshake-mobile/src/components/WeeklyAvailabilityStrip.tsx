import { useState } from "react";
import {
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  View,
} from "react-native";
import { format, isToday } from "date-fns";
import * as Haptics from "expo-haptics";
import { Feather } from "@expo/vector-icons";
import { useThemeContext } from "../contexts/ThemeContext";
import { moderateScale, verticalScale } from "../constants/theme";
import { WheelColumn } from "./WheelColumn";
import type { DayAvailability, TimeSlot } from "../types/home";

// ── Quick-add presets ──────────────────────────────────────────────

const QUICK_SLOTS: Array<{ label: string; slot: TimeSlot }> = [
  { label: "Morning 9–12", slot: { startHour: 9, startMinute: 0, durationHours: 3 } },
  { label: "Afternoon 12–5", slot: { startHour: 12, startMinute: 0, durationHours: 5 } },
  { label: "Evening 5–9", slot: { startHour: 17, startMinute: 0, durationHours: 4 } },
  { label: "Night 9–12", slot: { startHour: 21, startMinute: 0, durationHours: 3 } },
];

// ── Quick-fill week presets ───────────────────────────────────────

const QUICK_FILL_OPTIONS: Array<{ label: string; emoji: string; slots: TimeSlot[]; days: number[] }> = [
  { label: "Evenings", emoji: "☕", slots: [{ startHour: 17, startMinute: 0, durationHours: 4 }], days: [0, 1, 2, 3, 4, 5, 6] },
  { label: "Mornings", emoji: "🌅", slots: [{ startHour: 9, startMinute: 0, durationHours: 3 }], days: [0, 1, 2, 3, 4, 5, 6] },
  { label: "Weekdays", emoji: "📅", slots: [{ startHour: 17, startMinute: 0, durationHours: 4 }], days: [0, 1, 2, 3, 4] },
  { label: "All Day", emoji: "✨", slots: [{ startHour: 9, startMinute: 0, durationHours: 12 }], days: [0, 1, 2, 3, 4, 5, 6] },
];

// ── Wheel picker data ─────────────────────────────────────────────

const HOURS_12 = Array.from({ length: 12 }, (_, i) => String(i + 1)); // "1"–"12"
const MINUTES = Array.from({ length: 12 }, (_, i) => String(i * 5).padStart(2, "0")); // "00"–"55"
const AM_PM = ["AM", "PM"];

/** Convert wheel indices to 24h startHour/startMinute */
function wheelToTime(hourIdx: number, minuteIdx: number, ampmIdx: number) {
  let hour = hourIdx + 1; // 1-12
  if (ampmIdx === 0 && hour === 12) hour = 0;  // 12 AM = 0
  if (ampmIdx === 1 && hour !== 12) hour += 12; // PM
  const minute = minuteIdx * 5;
  return { hour, minute };
}

/** Convert 24h hour back to wheel indices */
function timeToWheel(hour: number, minute: number) {
  const ampmIdx = hour < 12 ? 0 : 1;
  let displayHour = hour % 12;
  if (displayHour === 0) displayHour = 12;
  return {
    hourIdx: displayHour - 1,
    minuteIdx: Math.round(minute / 5) % 12,
    ampmIdx,
  };
}

// ── Helpers ────────────────────────────────────────────────────────

function formatSlot(slot: TimeSlot): string {
  const startH = slot.startHour === 0 ? 12 : slot.startHour > 12 ? slot.startHour - 12 : slot.startHour;
  const ampm = slot.startHour < 12 ? "AM" : "PM";
  const minStr = slot.startMinute === 0 ? "" : ":30";
  const endTotal = slot.startHour * 60 + slot.startMinute + slot.durationHours * 60;
  const endH24 = Math.floor(endTotal / 60) % 24;
  const endMin = Math.round(endTotal % 60);
  const endH = endH24 === 0 ? 12 : endH24 > 12 ? endH24 - 12 : endH24;
  const endAmpm = endH24 < 12 ? "AM" : "PM";
  const endMinStr = endMin === 0 ? "" : `:${endMin.toString().padStart(2, "0")}`;
  return `${startH}${minStr} ${ampm} – ${endH}${endMinStr} ${endAmpm}`;
}

function slotsOverlap(a: TimeSlot, b: TimeSlot): boolean {
  const aStart = a.startHour * 60 + a.startMinute;
  const aEnd = aStart + a.durationHours * 60;
  const bStart = b.startHour * 60 + b.startMinute;
  const bEnd = bStart + b.durationHours * 60;
  return aStart < bEnd && bStart < aEnd;
}

// ── Component ──────────────────────────────────────────────────────

type WeeklyAvailabilityStripProps = {
  availability: DayAvailability[];
  onUpdateDay: (date: string, slots: TimeSlot[]) => void;
};

export function WeeklyAvailabilityStrip({
  availability,
  onUpdateDay,
}: WeeklyAvailabilityStripProps) {
  const [expandedDay, setExpandedDay] = useState<string | null>(null);
  const { colors } = useThemeContext();

  // Wheel picker state for start and end time
  const defaultStart = timeToWheel(9, 0); // 9:00 AM
  const defaultEnd = timeToWheel(17, 0);  // 5:00 PM
  const [startHourIdx, setStartHourIdx] = useState(defaultStart.hourIdx);
  const [startMinuteIdx, setStartMinuteIdx] = useState(defaultStart.minuteIdx);
  const [startAmpmIdx, setStartAmpmIdx] = useState(defaultStart.ampmIdx);
  const [endHourIdx, setEndHourIdx] = useState(defaultEnd.hourIdx);
  const [endMinuteIdx, setEndMinuteIdx] = useState(defaultEnd.minuteIdx);
  const [endAmpmIdx, setEndAmpmIdx] = useState(defaultEnd.ampmIdx);

  const handleDayPress = (date: string) => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    if (expandedDay === date) {
      setExpandedDay(null);
    } else {
      setExpandedDay(date);
      // Reset wheels to 9 AM → 5 PM defaults
      setStartHourIdx(defaultStart.hourIdx);
      setStartMinuteIdx(defaultStart.minuteIdx);
      setStartAmpmIdx(defaultStart.ampmIdx);
      setEndHourIdx(defaultEnd.hourIdx);
      setEndMinuteIdx(defaultEnd.minuteIdx);
      setEndAmpmIdx(defaultEnd.ampmIdx);
    }
  };

  const expandedDayData = availability.find((d) => d.date === expandedDay);

  const addSlot = (slot: TimeSlot) => {
    if (!expandedDayData) return;
    // Check for overlap with existing slots
    if (expandedDayData.timeSlots.some((s) => slotsOverlap(s, slot))) return;
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    const updated = [...expandedDayData.timeSlots, slot].sort(
      (a, b) => a.startHour * 60 + a.startMinute - (b.startHour * 60 + b.startMinute)
    );
    onUpdateDay(expandedDayData.date, updated);
  };

  const removeSlot = (slot: TimeSlot) => {
    if (!expandedDayData) return;
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    const updated = expandedDayData.timeSlots.filter(
      (s) =>
        !(
          s.startHour === slot.startHour &&
          s.startMinute === slot.startMinute &&
          s.durationHours === slot.durationHours
        )
    );
    onUpdateDay(expandedDayData.date, updated);
  };

  const addCustomSlot = () => {
    if (!expandedDayData) return;
    const start = wheelToTime(startHourIdx, startMinuteIdx, startAmpmIdx);
    const end = wheelToTime(endHourIdx, endMinuteIdx, endAmpmIdx);
    const startMinutes = start.hour * 60 + start.minute;
    const endMinutes = end.hour * 60 + end.minute;
    const duration = (endMinutes - startMinutes) / 60;
    if (duration <= 0) return; // end must be after start
    addSlot({
      startHour: start.hour,
      startMinute: start.minute,
      durationHours: Math.min(duration, 12),
    });
  };

  const clearAll = () => {
    if (!expandedDayData) return;
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    onUpdateDay(expandedDayData.date, []);
  };

  const handleQuickFill = (option: typeof QUICK_FILL_OPTIONS[0]) => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    for (const dayIdx of option.days) {
      if (dayIdx < availability.length) {
        const day = availability[dayIdx];
        // Merge with existing slots — add new ones that don't overlap
        const merged = [...day.timeSlots];
        for (const newSlot of option.slots) {
          if (!merged.some((s) => slotsOverlap(s, newSlot))) {
            merged.push(newSlot);
          }
        }
        merged.sort(
          (a, b) => a.startHour * 60 + a.startMinute - (b.startHour * 60 + b.startMinute)
        );
        onUpdateDay(day.date, merged);
      }
    }
  };

  const styles = StyleSheet.create({
    container: {
      borderRadius: moderateScale(20),
      backgroundColor: colors.card,
      borderWidth: 2,
      borderColor: colors.border,
      padding: moderateScale(16),
      marginBottom: verticalScale(16),
    },
    title: {
      fontSize: moderateScale(16),
      fontWeight: "800",
      color: colors.foreground,
      marginBottom: moderateScale(8),
    },

    // ── Quick-fill week presets ────────────────────────────────────────
    quickFillRow: {
      flexDirection: "row",
      marginBottom: moderateScale(12),
    },
    quickFillPill: {
      flexDirection: "row",
      alignItems: "center",
      gap: moderateScale(4),
      paddingHorizontal: moderateScale(12),
      paddingVertical: moderateScale(8),
      borderRadius: 999,
      backgroundColor: colors.muted,
      marginRight: moderateScale(8),
      borderWidth: 1.5,
      borderColor: "transparent",
    },
    quickFillPillActive: {
      backgroundColor: "#DCFCE7",
      borderColor: "#16A34A",
    },
    quickFillEmoji: {
      fontSize: moderateScale(14),
    },
    quickFillLabel: {
      fontSize: moderateScale(12),
      fontWeight: "700",
      color: colors.foreground,
    },
    quickFillLabelActive: {
      color: "#16A34A",
    },
    weekRow: {
      flexDirection: "row",
      justifyContent: "space-between",
    },
    dayCard: {
      alignItems: "center",
      gap: moderateScale(6),
      paddingVertical: moderateScale(8),
      paddingHorizontal: moderateScale(4),
      borderRadius: moderateScale(14),
      minWidth: moderateScale(42),
    },
    dayCardExpanded: {
      backgroundColor: colors.secondary,
    },
    dayCardToday: {},
    dayLabel: {
      fontSize: moderateScale(11),
      fontWeight: "700",
      color: colors.mutedForeground,
      textTransform: "uppercase",
    },
    dayLabelToday: {
      color: colors.primary,
    },
    dateCircle: {
      width: moderateScale(36),
      height: moderateScale(36),
      borderRadius: moderateScale(18),
      alignItems: "center",
      justifyContent: "center",
    },
    available: { backgroundColor: "#DCFCE7" },
    unavailable: { backgroundColor: "#FEE2E2" },
    dateCircleToday: {
      borderWidth: 2,
      borderColor: colors.primary,
    },
    dateNumber: {
      fontSize: moderateScale(14),
      fontWeight: "800",
    },
    dateNumAvailable: { color: "#16A34A" },
    dateNumUnavailable: { color: "#DC2626" },
    statusDot: {
      width: moderateScale(8),
      height: moderateScale(8),
      borderRadius: moderateScale(4),
    },
    dotAvailable: { backgroundColor: "#16A34A" },
    dotUnavailable: { backgroundColor: "#DC2626" },

    // ── Day detail (expanded) ────────────────────────────────────────
    dayDetail: {
      marginTop: moderateScale(12),
      paddingTop: moderateScale(12),
      borderTopWidth: 1,
      borderTopColor: colors.border,
      gap: moderateScale(8),
    },
    detailHeader: {
      flexDirection: "row",
      justifyContent: "space-between",
      alignItems: "center",
    },
    dayDetailDate: {
      fontSize: moderateScale(14),
      fontWeight: "700",
      color: colors.foreground,
    },
    clearBtn: {
      paddingHorizontal: moderateScale(12),
      paddingVertical: moderateScale(6),
      borderRadius: 999,
      backgroundColor: "#FEE2E2",
    },
    clearBtnText: {
      fontSize: moderateScale(12),
      fontWeight: "700",
      color: "#DC2626",
    },
    sectionLabel: {
      fontSize: moderateScale(12),
      fontWeight: "700",
      color: colors.mutedForeground,
      marginTop: moderateScale(4),
    },

    // ── Quick-add pills ──────────────────────────────────────────────
    quickRow: {
      flexDirection: "row",
    },
    quickPill: {
      paddingHorizontal: moderateScale(12),
      paddingVertical: moderateScale(8),
      borderRadius: 999,
      backgroundColor: "#DCFCE7",
      marginRight: moderateScale(8),
    },
    quickPillDisabled: {
      backgroundColor: colors.muted,
      opacity: 0.5,
    },
    quickPillText: {
      fontSize: moderateScale(12),
      fontWeight: "700",
      color: "#16A34A",
    },
    quickPillTextDisabled: {
      color: colors.mutedForeground,
    },

    // ── Slot list ────────────────────────────────────────────────────
    slotList: {
      flexDirection: "row",
      flexWrap: "wrap",
      gap: moderateScale(8),
      marginTop: moderateScale(4),
    },
    slotPill: {
      flexDirection: "row",
      alignItems: "center",
      gap: moderateScale(6),
      paddingHorizontal: moderateScale(12),
      paddingVertical: moderateScale(8),
      borderRadius: 999,
      backgroundColor: "#DCFCE7",
    },
    slotPillText: {
      fontSize: moderateScale(12),
      fontWeight: "700",
      color: "#16A34A",
    },
    slotRemove: {
      padding: moderateScale(2),
    },
    emptyHint: {
      fontSize: moderateScale(12),
      color: colors.mutedForeground,
      textAlign: "center",
      marginTop: moderateScale(4),
    },

    // ── Wheel picker styles ──────────────────────────────────────────
    wheelRow: {
      flexDirection: "row",
      alignItems: "center",
      justifyContent: "center",
      gap: moderateScale(2),
      marginTop: moderateScale(4),
    },
    wheelColon: {
      fontSize: moderateScale(24),
      fontWeight: "800",
      color: colors.foreground,
      paddingHorizontal: moderateScale(2),
    },
    addSlotBtn: {
      flexDirection: "row",
      alignItems: "center",
      justifyContent: "center",
      gap: moderateScale(8),
      marginTop: moderateScale(12),
      paddingVertical: moderateScale(12),
      borderRadius: 999,
      backgroundColor: colors.primary,
    },
    addSlotBtnText: {
      fontSize: moderateScale(14),
      fontWeight: "700",
      color: colors.white,
    },
  });

  return (
    <View style={styles.container}>
      <Text style={styles.title}>This Week</Text>

      {/* Quick-fill row — one tap to set availability for the whole week */}
      <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.quickFillRow}>
        {QUICK_FILL_OPTIONS.map((opt) => {
          const isFilled = opt.days.every(
            (dayIdx) =>
              dayIdx < availability.length &&
              opt.slots.every((s) =>
                availability[dayIdx].timeSlots.some((es) => slotsOverlap(es, s))
              )
          );
          return (
            <Pressable
              key={opt.label}
              onPress={() => handleQuickFill(opt)}
              style={[styles.quickFillPill, isFilled && styles.quickFillPillActive]}
            >
              <Text style={styles.quickFillEmoji}>{opt.emoji}</Text>
              <Text style={[styles.quickFillLabel, isFilled && styles.quickFillLabelActive]}>
                {opt.label}
              </Text>
            </Pressable>
          );
        })}
      </ScrollView>

      {/* Day strip */}
      <View style={styles.weekRow}>
        {availability.map((day) => {
          const isExpanded = expandedDay === day.date;
          const today = isToday(new Date(day.date));
          const avail = day.timeSlots.length > 0;
          return (
            <Pressable
              key={day.date}
              onPress={() => handleDayPress(day.date)}
              style={[
                styles.dayCard,
                isExpanded && styles.dayCardExpanded,
                today && styles.dayCardToday,
              ]}
            >
              <Text style={[styles.dayLabel, today && styles.dayLabelToday]}>
                {day.dayLabel}
              </Text>
              <View
                style={[
                  styles.dateCircle,
                  avail ? styles.available : styles.unavailable,
                  today && styles.dateCircleToday,
                ]}
              >
                <Text
                  style={[
                    styles.dateNumber,
                    avail ? styles.dateNumAvailable : styles.dateNumUnavailable,
                  ]}
                >
                  {day.dateNumber}
                </Text>
              </View>
              <View
                style={[
                  styles.statusDot,
                  avail ? styles.dotAvailable : styles.dotUnavailable,
                ]}
              />
            </Pressable>
          );
        })}
      </View>

      {/* Expanded day detail — time slot editor */}
      {expandedDayData && (
        <View style={styles.dayDetail}>
          {/* Header row */}
          <View style={styles.detailHeader}>
            <Text style={styles.dayDetailDate}>
              {format(new Date(expandedDayData.date + "T12:00:00"), "EEEE, MMMM d")}
            </Text>
            {expandedDayData.timeSlots.length > 0 && (
              <Pressable onPress={clearAll} style={styles.clearBtn}>
                <Text style={styles.clearBtnText}>Clear All</Text>
              </Pressable>
            )}
          </View>

          {/* Quick-add buttons */}
          <Text style={styles.sectionLabel}>Quick Add</Text>
          <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.quickRow}>
            {QUICK_SLOTS.map((qs) => {
              const alreadyAdded = expandedDayData.timeSlots.some(
                (s) =>
                  s.startHour === qs.slot.startHour &&
                  s.startMinute === qs.slot.startMinute &&
                  s.durationHours === qs.slot.durationHours
              );
              const wouldOverlap = expandedDayData.timeSlots.some((s) => slotsOverlap(s, qs.slot));
              const disabled = alreadyAdded || wouldOverlap;
              return (
                <Pressable
                  key={qs.label}
                  onPress={() => addSlot(qs.slot)}
                  disabled={disabled}
                  style={[styles.quickPill, disabled && styles.quickPillDisabled]}
                >
                  <Text style={[styles.quickPillText, disabled && styles.quickPillTextDisabled]}>
                    {qs.label}
                  </Text>
                </Pressable>
              );
            })}
          </ScrollView>

          {/* Start / End time wheel pickers */}
          <Text style={styles.sectionLabel}>Start Time</Text>
          <View style={styles.wheelRow}>
            <WheelColumn
              items={HOURS_12}
              selectedIndex={startHourIdx}
              onChange={setStartHourIdx}
              width={moderateScale(58)}
            />
            <Text style={styles.wheelColon}>:</Text>
            <WheelColumn
              items={MINUTES}
              selectedIndex={startMinuteIdx}
              onChange={setStartMinuteIdx}
              width={moderateScale(62)}
            />
            <WheelColumn
              items={AM_PM}
              selectedIndex={startAmpmIdx}
              onChange={setStartAmpmIdx}
              width={moderateScale(62)}
            />
          </View>

          <Text style={styles.sectionLabel}>End Time</Text>
          <View style={styles.wheelRow}>
            <WheelColumn
              items={HOURS_12}
              selectedIndex={endHourIdx}
              onChange={setEndHourIdx}
              width={moderateScale(58)}
            />
            <Text style={styles.wheelColon}>:</Text>
            <WheelColumn
              items={MINUTES}
              selectedIndex={endMinuteIdx}
              onChange={setEndMinuteIdx}
              width={moderateScale(62)}
            />
            <WheelColumn
              items={AM_PM}
              selectedIndex={endAmpmIdx}
              onChange={setEndAmpmIdx}
              width={moderateScale(62)}
            />
          </View>

          {/* Add button */}
          <Pressable
            onPress={addCustomSlot}
            style={styles.addSlotBtn}
          >
            <Feather name="plus" size={moderateScale(16)} color={colors.white} />
            <Text style={styles.addSlotBtnText}>Add Slot</Text>
          </Pressable>

          {/* Existing slots */}
          {expandedDayData.timeSlots.length > 0 && (
            <View style={styles.slotList}>
              {expandedDayData.timeSlots.map((slot, i) => (
                <View key={`${slot.startHour}-${slot.startMinute}-${i}`} style={styles.slotPill}>
                  <Text style={styles.slotPillText}>{formatSlot(slot)}</Text>
                  <Pressable onPress={() => removeSlot(slot)} style={styles.slotRemove}>
                    <Feather name="x" size={moderateScale(14)} color={colors.mutedForeground} />
                  </Pressable>
                </View>
              ))}
            </View>
          )}

          {/* Empty state */}
          {expandedDayData.timeSlots.length === 0 && (
            <Text style={styles.emptyHint}>Add a time slot to mark yourself available</Text>
          )}
        </View>
      )}
    </View>
  );
}
