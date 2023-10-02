const crypto = require('crypto');
const { writeFileSync } = require('fs');
const { join } = require('path');

const CALENDAR_TEMPLATE = `BEGIN:VCALENDAR
VERSION:2.0
PRODID:-//Monster Hunter Now Events//EN

{{EVENTS}}

END:VCALENDAR`;

// Remove `X-` to re-enable the pair
const EVENT_TEMPLATE = `BEGIN:VEVENT
UID:{{UID}}
DTSTAMP:{{DTSTAMP}}
DTSTART:{{DTSTART}}
DTEND:{{DTEND}}
X-RRULE:FREQ=DAILY;COUNT=2
SUMMARY:{{SUMMARY}}
DESCRIPTION:{{DESCRIPTION}}
X-LOCATION:{{LOCATION}}
END:VEVENT`;

function generateICSDatetime(str) {
    const pad = (i) => i < 10 ? `0${i}` : `${i}`;
    const date = new Date(str);
    const year = date.getUTCFullYear();
    const month = pad(date.getUTCMonth() + 1);
    const day = pad(date.getUTCDate());
    const hour = pad(date.getUTCHours());
    const minute = pad(date.getUTCMinutes());
    const second = pad(date.getUTCSeconds());
    // Add a 'Z' to the end of the date if this date needs to be timezone aware
    // Without the 'Z', the date will be treated as a floating date (local to user)
    return `${year}${month}${day}T${hour}${minute}${second}`;
  }

function generateUID(str) {
    return crypto.createHash('sha1').update(str).digest('hex');
}

// Pass index to be used as a unique identifier
// Maybe switch to actual id later, or maybe just a UUID
function generateEvent(event, date, idx) {
    const UID = generateUID(`${idx}${event.summary}`);
    const start = generateICSDatetime(date.start);
    const end = generateICSDatetime(date.end);
    const adaptedEvent = {
        UID,
        DTSTAMP: start,
        DTSTART: start,
        DTEND: end,
        SUMMARY: event.summary,
        DESCRIPTION: event.description,
    };
    const icsEvent = EVENT_TEMPLATE.replace(/{{(\w+)}}/g, (match, key) => adaptedEvent[key]);
    return icsEvent;
}

function generateCalendar() {
    try {
        const { events } = require('./events.json');
        if (!events.length) {
            throw new Error('No events found');
        }
        const icsEvents = events.reduce((acc, event, idx) => {
            console.debug(`Adding event: ${event.summary}`);
            const dates = event.dates || [];
            // If there aren't any event dates, get outta here
            if (!dates.length) {
                return acc;
            }
            acc += dates.map((date) => generateEvent(event, date, idx))
                .join('\n\n');
            return acc;
        }, '');
        const icsCalendar = CALENDAR_TEMPLATE.replace('{{EVENTS}}', icsEvents);
        writeFileSync(
            join(__dirname, 'dist/events.ics'),
            icsCalendar,
        );
    } catch (err) {
        console.error(err);
    }
}

generateCalendar();
