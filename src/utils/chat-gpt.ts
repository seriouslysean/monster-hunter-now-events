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
            content: `**Event Consolidation Guide: Monster Hunter Now**

Given a JSON with events under the "events" key, consolidate them using the following rules:

1. Date Priority:
    - Prefer details from newer "timestamp" events when merging.

2. Distinct Events:
    - Maintain distinctiveness for events on the same date that relate to different quests, tasks, or primary objectives. They must be kept as separate events, even if their time ranges overlap. Overlapping dates should not automatically merge events; content and context are key.

3. Uniqueness:
    - For event titles that match, evaluate their description, habitat, monsters, and dates for potential merging. Merge only if the content is complementary. If their content is distinct, especially in the context of quests or tasks, keep them separate.

4. Dates:
    - For overlapping or consecutive date ranges with matching habitat or monsters, consider merging.
    - For exact date matches, set "allDay" to true.
    - When two events have overlapping dates, one being all-day and the other with specific times that encompass the full day, merge them under "allDay": true.
    - Reduce redundant date entries.

5. Habitat & Monsters:
    - If events occur in similar habitats with the same monsters and have overlapping or consecutive dates, consider merging.

6. Summaries:
    - Generate summaries that are clear and without date specifics. For merged events, produce a cohesive summary.

7. Description:
    - Combine descriptions avoiding redundancy. For overarching events, integrate details from more specific events without being repetitive.

8. Cleanup:
    - Remove the habitat, monster, and timestamp fields.
    - Retain the order from the raw JSON, unless dictated otherwise by merges.

9. Overarching Events:
    - Preserve events labeled as all-day, even if there are overlapping timed events. Overarching events that encompass specific event details should be marked as "allDay": true.

Output:
{
    "events": [{
        "summary": "Event Name",
        "description": "Description",
        "dates": [
            {
                "start": "YYYY-MM-DDTHH:mm:ss",
                "end": "YYYY-MM-DDTHH:mm:ss",
                "allDay": true/false
            }
        ]
    }]
}

Notes:
- Prioritize concise and non-redundant summaries.
- Separate events if their activities, quests, or tasks differ, even when they share the same date.
- Always ensure events are represented, whether individually or merged, in the output.`,
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
