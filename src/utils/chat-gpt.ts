import { parse } from 'node-html-parser';
import OpenAI from 'openai';
import logger from './log-utils.js';

import { stringifyJSON } from './utils.js';

export const OPENAI_CHAT_ENDPOINT =
    'https://api.openai.com/v1/chat/completions';

export const OPENAI_GPT_MODEL = process.env.OPENAI_GPT_MODEL ?? 'gpt-4';

export const OPENAI_CONFIG = {
    model: OPENAI_GPT_MODEL,
    // Adjust this value (0 to 1) to control randomness. Lower values make the output more deterministic.
    // https://platform.openai.com/docs/guides/gpt/how-should-i-set-the-temperature-parameter
    temperature: 0.2,
};

async function askGPTChat(messages, debug) {
    const noEvents = { events: [] };
    try {
        if (!process.env.OPENAI_API_KEY) {
            throw new Error('OPENAI_API_KEY env required');
        }

        if (debug) {
            logger.info('-----Question-----');
            logger.info(stringifyJSON(messages));
            logger.info('');
            logger.info('-----OpenAI Config-----');
            logger.info(stringifyJSON(OPENAI_CONFIG));
        }

        const openai = new OpenAI({
            apiKey: process.env.OPENAI_API_KEY,
        });
        const chatCompletion = await openai.chat.completions.create({
            messages,
            ...OPENAI_CONFIG,
        });
        const response = chatCompletion.choices?.[0]?.message?.content?.trim();

        if (!response) {
            throw new Error('No response sent');
        }

        if (debug) {
            logger.info('-----Response-----');
            logger.info(response);
            logger.info('');
        }

        return JSON.parse(response);
    } catch (err) {
        logger.error(err);
        return noEvents;
    }
}

export async function getEventsFromHTML(html, debug = false) {
    if (!html) {
        logger.info('!!! No html');
        return { events: [] };
    }

    const document = parse(html);
    const article = document.querySelector('#main article');
    if (article !== null) {
        article.querySelector('#share')?.remove();
        article.querySelector('#next-article')?.remove();
    }
    const content = article?.textContent.replace(/\n{2,}/g, '\n').trim() ?? '';

    const messages = [
        {
            role: 'system',
            content: `**Event Extraction Guidelines: Monster Hunter Now**

Extract strictly in-game events occurring within the virtual game "Monster Hunter Now". Ensure your extraction adheres to the following criteria:

1. **Game Environment**:
- Events MUST ONLY occur inside the "Monster Hunter Now" game environment. Do NOT include any external promotions, in-game shop events, updates, or non-game events.

2. **Event Duration**:
- Every event should have both a start and end time.
- For all-day events without specific times, set "allDay": true with 00:00:00 as the start and 23:59:59 as the end.

3. **Event Discreteness**:
- Separate events that have distinct objectives or activities, even if they share the same timeframe.
- Do NOT combine unrelated activities into a single event.

4. **Event Continuity**:
- Combine instances of the same event with overlapping details into one, capturing all essential facets.
- Separate additional intervals or time frames within the event details.

5. **Avoid Assumptions/Additions**:
- Extract based solely on the provided content. Do NOT incorporate external information.

**Focus On**:
- Player-centric quests, missions, and challenges that are time-bound.
- In-game bonuses, competitions with clear start/end times.
- Game locations linked with events.

**Exclude**:
- Events or promotions not part of the direct in-game experience, like pre-registration rewards, generic game updates, in-game shop promotions, or features without a specific in-game activity timeframe.
- Vague events without a clear time-bound in-game context.

Order dates from the most recent to the oldest. Ensure consecutive dates are sequential.

If no in-game event meets the criteria, return an empty events array.

Ensure the output is valid JSON.

**Output Format**:
{
    events: [{
        "summary": "Event Name",
        "description": "Event Details",
        "dates": [
            {
                "start": "YYYY-MM-DDTHH:mm:ss",
                "end": "YYYY-MM-DDTHH:mm:ss",
                "allDay": true/false
            }
        ],
        "habitat": ["Desert", "Forest", "Swamp", etc],
        "monsters": ["Rathalos", "Rathian", "Diablos", etc],
    }],
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

interface Event {
    summary: string;
    description: string;
    dates: {
        start: string;
        end: string;
        allDay: boolean;
    }[];
    habitat: string[];
    monsters: string[];
}

export async function getDedupedJSON(
    json,
    debug = false,
): Promise<{ events: Event[]; hash?: string }> {
    if (!json || !json.events || json.events.length === 0) {
        logger.info('!!! No json');
        return { events: [] };
    }

    const messages = [
        {
            role: 'system',
            content: `**Event Combination Guidelines: Monster Hunter Now**

You will receive a JSON payload containing an array of events within the "events" key, as well as a "meta" field indicating the URL and date of the post. Deduplicate and logically combine these events based on the guidelines below. Use the "meta" field to prioritize newer posts, as they are likely to contain more accurate information for the scheduled events. Your task is to accurately identify overlapping or adjacent events with the same summary and merge them into a single event entry, ensuring the integrity of the event details is maintained without introducing redundant date ranges.

1. **Meta Field Priority**:
    - When merging events from different sources, prioritize the details from the post with a newer timestamp in the "meta" field.

2. **Criteria for Merging**:
    - Exact Title Match: If two events share the exact same title, they should be considered for merging.
    - Overlapping & Adjacent Dates: Merge events that share a time frame or are adjacent (consecutive dates) within the same habitat and involve similar monsters. If two events have exactly the same date range, merge them into one; if their date ranges are adjacent or overlapping but not identical, combine these date ranges and list them chronologically in the 'dates' array, ensuring there's no repetition of the same date range.
    - Habitat & Monsters: Events in the same habitat, involving the same monsters, during overlapping, identical, or adjacent times should be merged.

3. **Generate Coherent Summaries**: Create a concise and clear summary for events that are closely related in theme or content. The summary should be short yet informative, suitable for calendar applications. Avoid including date details in the summary.

4. **Combine Descriptions Carefully**: Integrate the event descriptions to ensure the final combined description is coherent and retains the essence of both original descriptions. Do not include any date details in the description.

5. **Return All Consolidated Events**: Based on the events provided, return all consolidated events in order.

6. **Remove Unnecessary Keys**: Remove the habitat, monster, and meta keys as they are no longer needed post deduplication.

**Output Format**:
{
    events: [{
        "summary": "Event Name",
        "description": "Event Details",
        "dates": [
            {
                "start": "YYYY-MM-DDTHH:mm:ss",
                "end": "YYYY-MM-DDTHH:mm:ss",
                "allDay": true/false
            }
        ],
    }],
}

**Notes**:
- Focus on short, clear, and precise event summaries that convey the essence of the event without redundancy.
- Dates are NOT to be included in the summary or description fields since they have their designated place in the 'dates' array.
- Events that don't meet the above strict criteria for merging should remain as separate items in the returned list.
- Ensure individual timed events with unique times remain separate within the 'dates' array.
- Return ONLY valid JSON in your response and ensure no repetition of the same date range in the merged event.`,
        },
        {
            role: 'user',
            content: 'Merge these events:',
        },
        {
            role: 'user',
            content: stringifyJSON(json),
        },
    ];

    const response = await askGPTChat(messages, debug);
    const dedupedEvents = response && response.events ? response.events : [];

    return { events: dedupedEvents };
}
