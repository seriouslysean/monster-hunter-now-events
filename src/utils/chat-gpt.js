import { parse } from 'node-html-parser';
import OpenAI from 'openai';

export const OPENAI_CHAT_ENDPOINT =
    'https://api.openai.com/v1/chat/completions';

async function askGPTChat(messages, debug) {
    const apiKey = process.env.API_KEY_OPENAI;
    const noEvents = { events: [] };
    try {
        if (!apiKey) {
            throw new Error('OPENAI_API_KEY env required');
        }

        if (debug) {
            console.log('-----Question-----');
            console.log(JSON.stringify(messages, null, 2));
            console.log('');
        }

        const openai = new OpenAI({ apiKey });
        const chatCompletion = await openai.chat.completions.create({
            model: 'gpt-3.5-turbo',
            messages,
            temperature: 0.5, // Adjust this value (0 to 1) to control randomness. Lower values make the output more deterministic.
        });
        const response = chatCompletion.choices?.[0]?.message?.content?.trim();

        if (!response) {
            throw new Error('No response sent');
        }

        if (debug) {
            console.log('-----Response-----');
            console.log(response);
            console.log('');
        }

        return JSON.parse(response);
    } catch (err) {
        console.error(err);
        return noEvents;
    }
}

export async function getEventsFromHTML(html, debug = false) {
    if (!html) {
        console.log('!!! No html');
        return { events: [] };
    }

    const document = parse(html);
    const article = document.querySelector('#main article');
    article.querySelector('#share')?.remove();
    article.querySelector('#next-article')?.remove();
    const content = article.textContent.replace(/\n{2,}/g, '\n').trim();

    const messages = [
        {
            role: 'system',
            content: `From the provided content, extract ONLY the events that occur STRICTLY within the game environment of "Monster Hunter Now".

Criteria for Extraction:

1. **Virtual Game Environment**:
    - The event should take place strictly inside the "Monster Hunter Now" virtual game environment, enabling direct player interaction.

2. **Event Duration**:
    - A clear and definite start and end time should be mentioned for the event.
    - If an event lacks either a start or an end time, exclude it.
    - For events covering an entire day without exact timings, indicate this with the "allDay" attribute set to true. In such cases, only provide the date in the format "YYYY-MM-DD".

3. **Event Continuity**:
    - Continuous events should be considered a singular event.
    - If an event happens continuously but also occurs separately at distinct intervals (e.g., throughout the week and then separately on the weekend), catalog them as individual events. Ensure discontinuities are highlighted.

4. **No Assumptions or Additions**:
    - Refrain from making unfounded assumptions or adding anything to the content.

What to Look for:
- Time-limited quests, missions, or challenges within the game requiring player engagement.
- In-game bonuses or competitions that have a defined start and end time.
- Specific in-game locations linked to the events.

What to Avoid:
- Broad game updates, announcements, or new feature introductions without a clear time-limited in-game activity.
- Events or promotions taking place outside of the virtual game environment.
- Ambiguous statements that don’t clearly indicate a time-restricted in-game event.

When Extracting Dates:
- Sort the dates from the most recent to the oldest, ensuring consecutive dates are sequential.

Required JSON Format:
{
    "summary": "Name of the Event",
    "description": "Description of the Event",
    "dates": [
        {
            "start": "YYYY-MM-DD HH:MM:SS",
            "end": "YYYY-MM-DD HH:MM:SS",
            "allDay": true/false
        }
    ]
}

If the content doesn't contain any suitable in-game events, adhere to this format:
{
    "events": []
}`,
        },
        {
            role: 'user',
            content: 'Identify in-game events from the following content:',
        },
        {
            role: 'user',
            content,
        },
    ];

    const response = await askGPTChat(messages, debug);
    return response ?? { events: [] };
}
