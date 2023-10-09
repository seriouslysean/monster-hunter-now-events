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
            // Adjust this value (0 to 1) to control randomness. Lower values make the output more deterministic.
            // https://platform.openai.com/docs/guides/gpt/how-should-i-set-the-temperature-parameter
            temperature: 0.2,
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
            content: `Extract events from the provided content that are STRICTLY occurring within the virtual game "Monster Hunter Now". Ensure your extraction adheres to the following:

1. **Game Environment**:
    - Events must ONLY be inside the "Monster Hunter Now" game. Exclude any external promotions or updates.

2. **Event Duration**:
    - Must have both a start and end time.
    - If it's an all-day event without specific times, use "allDay": true, with 00:00:00 as the start and 23:59:59 as the end.

3. **Event Continuity**:
    - Treat continuous events as one. If they have specific additional intervals, list those separately.

4. **Avoid Assumptions/Additions**:
    - Your extraction should be purely based on the provided content.

**Specifically Focus On**:
- Player-engaging quests, missions, or challenges that are time-bound.
- In-game bonuses or competitions with clear start and end times.
- Locations within the game tied to events.

**Avoid**:
- Broad updates or features without a time-bound game activity.
- Anything outside the game environment.
- Vague references without clear time-bound in-game context.

When you list dates, arrange them from recent to oldest. Ensure consecutive dates follow each other.

Output format:
{
    "summary": "Event Name",
    "description": "Event Details",
    "dates": [
        {
            "start": "YYYY-MM-DDTHH:mm:ss",
            "end": "YYYY-MM-DDTHH:mm:ss",
            "allDay": true/false
        }
    ]
}

If no in-game events match these criteria, return:
{
    "events": []
}

Ensure to cross-check your extracted data against the above guidelines before finalizing your output.`,
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

export async function getDedupedJSON(json, debug = false) {
    if (!json) {
        console.log('!!! No json');
        return { events: [] };
    }

    const messages = [
        {
            role: 'system',
            content: `Based on the provided JSON:

1. **Merge Only Identical Timed Events**: Merge events ONLY if they have the exact same start and end dates and times. Overlapping dates without exact match should not be merged.
2. **Generate Coherent Summaries**: Summaries should be a combination of both events only if they are closely related in theme or content. Generate a new summary that encapsulates the essence of both events without using " | ".
3. **Combine Descriptions Carefully**: Integrate the event descriptions to ensure the final combined description is coherent and retains the essence of both original descriptions.

Return the events in this format:
{
    "summary": "Generated Event Name",
    "description": "Merged Event Details",
    "dates": [
        {
            "start": "YYYY-MM-DDTHH:mm:ss",
            "end": "YYYY-MM-DDTHH:mm:ss",
            "allDay": true/false
        }
    ]
}

Events that don't meet the above strict criteria for merging should remain as separate items in the returned list. Ensure individual timed events with unique times remain separate within the 'dates' array.`,
        },
        {
            role: 'user',
            content:
                'Merge events with identical timings and closely related content:',
        },
        {
            role: 'user',
            content: JSON.stringify(json, null, 4),
        },
    ];

    const response = await askGPTChat(messages, debug);
    return response ?? { events: [] };
}
