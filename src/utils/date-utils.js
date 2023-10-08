import { parse, addDays, isSameDay } from 'date-fns';

export const pad = (i) => (i < 10 ? `0${i}` : `${i}`);

export const generateICSDatetime = (str) => {
    const time = Date.parse(str);
    const date = new Date(time);
    const year = date.getFullYear();
    const month = pad(date.getMonth() + 1);
    const day = pad(date.getDate());
    const hour = pad(date.getHours());
    const minute = pad(date.getMinutes());
    const second = pad(date.getSeconds());
    return `${year}${month}${day}T${hour}${minute}${second}`;
};

// Check if two dates are consecutive
export function isConsecutiveDay(date1, date2) {
    const d1 = parse(date1, 'yyyy-MM-dd HH:mm:ss', new Date());
    const expectedNextDay = addDays(d1, 1);
    const d2 = parse(date2, 'yyyy-MM-dd HH:mm:ss', new Date());
    return isSameDay(expectedNextDay, d2);
}
