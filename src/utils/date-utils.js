import {
    addDays,
    addWeeks,
    format,
    parse,
    parseISO,
    isBefore,
    isSameDay,
} from 'date-fns';

export const pad = (i) => (i < 10 ? `0${i}` : `${i}`);

/**
 * Checks if all event dates are more than 2 weeks old.
 *
 * @param {Object} event - The event object to check.
 * @returns {boolean} - True if the event is recent, false otherwise.
 */
export function isEventRecent(event) {
    const twoWeeksAgo = addWeeks(new Date(), -2);

    // Check if all dates in the event are before the twoWeeksAgo date
    return event.dates.some(
        (date) => !isBefore(new Date(date.end), twoWeeksAgo),
    );
}

export function generateICSDatetime(
    str,
    allDay = false,
    dateModifier = (date) => date,
) {
    const date = parseISO(str);
    const adaptedDate = dateModifier(date);
    return allDay
        ? format(adaptedDate, 'yyyyMMdd')
        : format(adaptedDate, "yyyyMMdd'T'HHmmss");
}

// Check if two dates are consecutive
export function isConsecutiveDay(date1, date2) {
    const d1 = parse(date1, 'yyyy-MM-dd HH:mm:ss', new Date());
    const expectedNextDay = addDays(d1, 1);
    const d2 = parse(date2, 'yyyy-MM-dd HH:mm:ss', new Date());
    return isSameDay(expectedNextDay, d2);
}
