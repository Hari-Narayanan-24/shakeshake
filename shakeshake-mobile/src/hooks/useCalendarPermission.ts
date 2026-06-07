import { useState, useEffect, useCallback } from "react";
import * as Calendar from "expo-calendar";
import { format, startOfMonth, endOfMonth, startOfDay, endOfDay } from "date-fns";
import { COLORS } from "../constants/theme";
import type { CalendarEventType, CalendarPermissionStatus } from "../types/home";

type UseCalendarPermissionReturn = {
  permissionStatus: CalendarPermissionStatus;
  todayEvents: CalendarEventType[];
  markedDates: Record<string, { marked: true; dotColor: string }>;
  requestPermission: () => Promise<void>;
};

export function useCalendarPermission(): UseCalendarPermissionReturn {
  const [permissionStatus, setPermissionStatus] = useState<CalendarPermissionStatus>("undetermined");
  const [todayEvents, setTodayEvents] = useState<CalendarEventType[]>([]);
  const [markedDates, setMarkedDates] = useState<Record<string, { marked: true; dotColor: string }>>({});

  const fetchMonthEvents = useCallback(async () => {
    try {
      const now = new Date();
      const monthStart = startOfMonth(now);
      const monthEnd = endOfMonth(now);

      const calendars = await Calendar.getCalendarsAsync(Calendar.EntityTypes.EVENT);
      const calendarIds = calendars.map((c) => c.id);

      if (calendarIds.length === 0) return;

      const events = await Calendar.getEventsAsync(calendarIds, monthStart, monthEnd);

      const mapped: CalendarEventType[] = events.map((e) => ({
        id: e.id,
        title: e.title,
        startDate: e.startDate instanceof Date ? e.startDate.toISOString() : String(e.startDate),
        endDate: e.endDate instanceof Date ? e.endDate.toISOString() : String(e.endDate),
      }));

      // Mark dates with events
      const marks: Record<string, { marked: true; dotColor: string }> = {};
      mapped.forEach((e) => {
        const dateStr = format(new Date(e.startDate), "yyyy-MM-dd");
        marks[dateStr] = { marked: true, dotColor: COLORS.primary };
      });
      setMarkedDates(marks);

      // Today's events
      const todayStart = startOfDay(now);
      const todayEnd = endOfDay(now);
      setTodayEvents(
        mapped.filter((e) => {
          const start = new Date(e.startDate);
          return start >= todayStart && start <= todayEnd;
        })
      );
    } catch {
      // Calendar access may fail silently on some platforms
    }
  }, []);

  useEffect(() => {
    (async () => {
      const { status } = await Calendar.getCalendarPermissionsAsync();
      setPermissionStatus(status as CalendarPermissionStatus);
      if (status === "granted") {
        await fetchMonthEvents();
      }
    })();
  }, [fetchMonthEvents]);

  const requestPermission = useCallback(async () => {
    const { status } = await Calendar.requestCalendarPermissionsAsync();
    setPermissionStatus(status as CalendarPermissionStatus);
    if (status === "granted") {
      await fetchMonthEvents();
    }
  }, [fetchMonthEvents]);

  return { permissionStatus, todayEvents, markedDates, requestPermission };
}
