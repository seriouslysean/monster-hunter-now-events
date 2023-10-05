import { parse } from 'node-html-parser';
import OpenAI from 'openai';

export const OPENAI_CHAT_ENDPOINT =
    'https://api.openai.com/v1/chat/completions';

async function askGPTChat(question, debug) {
    const apiKey = process.env.API_KEY_OPENAI;
    try {
        if (!apiKey) {
            throw new Error('OPENAI_API_KEY env required');
        }

        if (debug) {
            console.log('-----Question-----');
            console.log(question);
            console.log('');
        }

        const openai = new OpenAI({ apiKey });
        const chatCompletion = await openai.chat.completions.create({
            model: 'gpt-3.5-turbo',
            messages: [{ role: 'user', content: question }],
        });
        const response = chatCompletion.choices?.[0]?.message?.content?.trim();
        if (!response) {
            throw new Error('Invalid response');
        }

        if (debug) {
            console.log('-----Response-----');
            console.log(response);
            console.log('');
        }

        const events = JSON.parse(response);
        return events;
    } catch (err) {
        console.error(err);
        return { events: [] };
    }
}

export async function getEventsFromHTML(html, debug = false) {
    // No content found, get outta here
    if (!html) {
        console.log('!!! No html');
        return { events: [] };
    }

    const document = parse(html);
    // Get main content for the blog post
    const article = document.querySelector('#main article');
    // Remove share content
    article.querySelector('#share')?.remove();
    // Remove next article content
    article.querySelector('#next-article')?.remove();
    // Convert to text and remove extra whitespace
    const content = article.textContent.replace(/\n{2,}/g, '\n').trim();

    // Prompt AI to find events in the content from the news articles
    // This prompt has been tuned to work with the current GPT-3.5-turbo model by passing various
    // prompts through the playground and tweaking the output to be able to parse in game events only
    // while ignoring other content such as sales, promotions, and real world events
    // Use `npm run test:article` to test the prompt on a single article and then adjust as needed
    const question = `Question:

Identify time-specific in-game events from the provided content that take place strictly within the digital environment of "Monster Hunter Now." Disregard general feature announcements, game launches, and updates unless they specify a time-bound event or activity that players can actively participate in.

Strict Inclusions:
- Quests, challenges, or events within the game that players can engage in, which are tied to specific start and end dates.
- Activities specific to the game's digital universe.

May Include:
- Time-limited missions or quests targeting in-game entities.
- Short-term in-game challenges or competitions.
- Periods where specific in-game entities appear more frequently or rarely.
- Bonus periods for in-game item drops.
- References to in-game progression, such as chapter levels or HR levels.
- Specific in-game habitats or locations.

Strict Exclusions:
- Mentions of game updates, game launches, or feature unveilings that aren't associated with a specific, timed in-game event.
- Pre-registrations, bonuses, or incentives tied to real-world actions or milestones, unless they specify a related in-game event.
- Any real-world promotions, events, or general news announcements.

Output the identified events in a JSON format under the key "events". If there are no events fitting the criteria, return "[]" in the events key.

Event JSON Format:
{
    "summary": "Event Name",
    "description": "Event Description",
    "dates": [{"start": "YYYY-MM-DD HH:MM:SS", "end": "YYYY-MM-DD HH:MM:SS"}]
}

Content:
${content}`;
    const response = await askGPTChat(question, debug);
    return response ?? { events: [] };
}
