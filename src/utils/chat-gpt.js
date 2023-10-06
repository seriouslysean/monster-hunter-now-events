import { parse } from 'node-html-parser';
import OpenAI from 'openai';

export const OPENAI_CHAT_ENDPOINT =
    'https://api.openai.com/v1/chat/completions';

async function askGPTChat(question, debug) {
    const apiKey = process.env.API_KEY_OPENAI;
    const noEvents = { events: [] };
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
            throw new Error('No response sent');
        }

        if (debug) {
            console.log('-----Response-----');
            console.log(response);
            console.log('');
        }

        try {
            return JSON.parse(response);
        } catch (err) {
            throw new Error('Invalid JSON returned!');
        }
    } catch (err) {
        console.error(err);
        return noEvents;
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
    const question = `From the provided content, extract ONLY the events that occur STRICTLY within the game environment of "Monster Hunter Now".

The criteria are clear:
- The event should take place within the virtual game environment, allowing for player interaction.
- A clear start and end time for the event must be evident.
- Assumptions or creative additions to the content should not be made.

The content should be read carefully to identify:
- Time-bound in-game quests, challenges, or missions that require player engagement.
- Time-limited in-game bonuses or competitions with defined start and end times.
- Specific in-game locations or settings tied to events.

Exclude the following:
- Wide-ranging game updates, announcements, or new feature additions without a specific in-game, time-bound challenge or activity.
- Any event, bonus, promotion, or activity that takes place outside the game environment in the real world.
- Statements or references that lack clear signals of a time-limited in-game event.

Use the JSON format provided:
{
    "summary": "Name of the Event",
    "description": "Description of the Event",
    "dates": [{"start": "YYYY-MM-DD HH:MM:SS", "end": "YYYY-MM-DD HH:MM:SS"}]
}

If the content doesn't reveal any qualifying in-game events, use the following format:
{
    "events": []
}

Content:
${content}`;
    const response = await askGPTChat(question, debug);
    return response ?? { events: [] };
}
