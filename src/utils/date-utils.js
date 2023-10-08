import { addDays, format, parse, parseISO, isSameDay } from 'date-fns';

export const pad = (i) => (i < 10 ? `0${i}` : `${i}`);

export const generateICSDatetime = (str, allDay = false) => {
    const date = parseISO(str);
    return allDay
        ? format(addDays(date, 1), 'yyyyMMdd')
        : format(date, 'yyyyMMddTHHmmss');
};

// Check if two dates are consecutive
export function isConsecutiveDay(date1, date2) {
    const d1 = parse(date1, 'yyyy-MM-dd HH:mm:ss', new Date());
    const expectedNextDay = addDays(d1, 1);
    const d2 = parse(date2, 'yyyy-MM-dd HH:mm:ss', new Date());
    return isSameDay(expectedNextDay, d2);
}
