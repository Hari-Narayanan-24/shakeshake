import { useState } from "react";
import { StyleSheet, Text, View } from "react-native";
import { Calendar } from "react-native-calendars";
import { useThemeContext } from "../contexts/ThemeContext";
import { moderateScale, verticalScale } from "../constants/theme";
import type { CalendarEventType } from "../types/home";

type CalendarWidgetProps = {
  markedDates: Record<string, { marked: true; dotColor: string }>;
  todayEvents: CalendarEventType[];
};

export function CalendarWidget({ markedDates, todayEvents }: CalendarWidgetProps) {
  const [selectedDate, setSelectedDate] = useState(
    new Date().toISOString().split("T")[0]
  );
  const { colors } = useThemeContext();

  const marked = {
    ...markedDates,
    [selectedDate]: {
      ...(markedDates[selectedDate] || {}),
      selected: true,
      selectedColor: colors.primary,
    },
  };

  const styles = StyleSheet.create({
    container: {
      borderRadius: moderateScale(20),
      backgroundColor: colors.card,
      borderWidth: 2,
      borderColor: colors.border,
      overflow: "hidden",
      marginBottom: verticalScale(16),
    },
    calendar: {
      borderRadius: moderateScale(20),
    },
    eventsList: {
      paddingHorizontal: moderateScale(16),
      paddingBottom: moderateScale(14),
      gap: moderateScale(8),
    },
    eventsTitle: {
      fontSize: moderateScale(13),
      fontWeight: "800",
      color: colors.foreground,
      marginBottom: moderateScale(4),
    },
    eventItem: {
      flexDirection: "row",
      alignItems: "center",
      gap: moderateScale(8),
    },
    eventDot: {
      width: moderateScale(8),
      height: moderateScale(8),
      borderRadius: moderateScale(4),
      backgroundColor: colors.primary,
    },
    eventTitle: {
      fontSize: moderateScale(13),
      color: colors.mutedForeground,
      flex: 1,
    },
  });

  return (
    <View style={styles.container}>
      <Calendar
        markedDates={marked}
        onDayPress={(day) => setSelectedDate(day.dateString)}
        theme={{
          todayTextColor: colors.primary,
          selectedDayBackgroundColor: colors.primary,
          selectedDayTextColor: colors.white,
          dotColor: colors.primary,
          arrowColor: colors.primary,
          monthTextColor: colors.foreground,
          textMonthFontWeight: "800",
          textDayFontSize: moderateScale(14),
          textMonthFontSize: moderateScale(16),
          textDayHeaderFontSize: moderateScale(12),
          backgroundColor: colors.card,
        }}
        style={styles.calendar}
      />

      {todayEvents.length > 0 && (
        <View style={styles.eventsList}>
          <Text style={styles.eventsTitle}>Today's Schedule</Text>
          {todayEvents.map((event) => (
            <View key={event.id} style={styles.eventItem}>
              <View style={styles.eventDot} />
              <Text style={styles.eventTitle} numberOfLines={1}>{event.title}</Text>
            </View>
          ))}
        </View>
      )}
    </View>
  );
}
