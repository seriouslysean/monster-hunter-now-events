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
    const question = `Extract ONLY in-game, time-bound events from "Monster Hunter Now" content. Consider hunting specific monsters, timed quests, in-game challenges, HR levels, Chapter completions, and unlocks.

Exclude: non-timed character intros, sales/promotions, real-world events.

Return as JSON under "events" with Unix timestamps for dates. If none, return empty array.

Event format:
{
    "summary": "Event Name",
    "description": "Event Description",
    "dates": [{"start": "UNIX TIMESTAMP", "end": "UNIX TIMESTAMP"}]
}

Content:
${content}`;
    const response = await askGPTChat(question, debug);
    return response ?? { events: [] };
}
