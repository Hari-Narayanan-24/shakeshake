"""
Time slot overlap calculation.
Two users can only match if they have overlapping availability.
"""

from models import DayAvailability, OverlappingSlot, TimeSlot


def compute_time_overlap(
    avail_a: list[DayAvailability],
    avail_b: list[DayAvailability],
) -> list[OverlappingSlot]:
    """
    Find all overlapping time intervals between two users' weekly availability.
    Returns a list of OverlappingSlot objects representing the shared free time.
    """
    # Index availability B by date for O(1) lookup
    b_by_date: dict[str, list[TimeSlot]] = {}
    for day in avail_b:
        if day.timeSlots:
            b_by_date[day.date] = day.timeSlots

    overlaps: list[OverlappingSlot] = []

    for day_a in avail_a:
        if not day_a.timeSlots:
            continue
        b_slots = b_by_date.get(day_a.date)
        if not b_slots:
            continue

        for slot_a in day_a.timeSlots:
            a_start = slot_a.startHour * 60 + slot_a.startMinute
            a_end = a_start + slot_a.durationHours * 60

            for slot_b in b_slots:
                b_start = slot_b.startHour * 60 + slot_b.startMinute
                b_end = b_start + slot_b.durationHours * 60

                overlap_start = max(a_start, b_start)
                overlap_end = min(a_end, b_end)

                if overlap_end > overlap_start:
                    overlap_minutes = overlap_end - overlap_start
                    overlaps.append(
                        OverlappingSlot(
                            date=day_a.date,
                            startHour=overlap_start // 60,
                            startMinute=overlap_start % 60,
                            durationHours=round(overlap_minutes / 60, 1),
                        )
                    )

    return overlaps


def has_any_overlap(
    avail_a: list[DayAvailability],
    avail_b: list[DayAvailability],
) -> bool:
    """Quick check if two users have any overlapping availability."""
    return len(compute_time_overlap(avail_a, avail_b)) > 0
