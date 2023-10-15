<p align="center">
  <img
    src="./assets/monster-hunter-now-logo.png"
    alt="Monster Hunter Now Logo" />
</p>

# Monster Hunter Now Events

## Table Of Contents &#128203;
* Calendar Subscription (Purpose)
  - Subscribe to Calendar <br>
* Local Implementation of Calendar Subscription <br>
* Tools <br>
* References 

## Calendar Subscription &#128198;
This is a calendar subscription file for events in [Monster Hunter Now](https://monsterhunternow.com/).

In case you are not playing yet, you can join and play the game with me and my friends. [Feel free to join ](https://apps.apple.com/us/app/monster-hunter-now/id6445906110) and use my **referral code** for free items and zenny, *`89K5MKCF`*

I created this because I didn't want to add events to a shared calendar for me and my friends any longer. It's also a great way to visualize how AI is beneficial for coding via dialogue with ChatGPT, and an excuse to utilize the OpenAI API. 

## Subscribe to Calendar &#128204;

Add the [ICS file](https://seriouslysean.github.io/monster-hunter-now-events/dist/events.ics) to your calendar app.

'''
https://seriouslysean.github.io/monster-hunter-now-events/dist/events.ics
'''

## Local Implementation of Calendar Subscription 

### * Open AI Key
  1. Sign up for an OpenAI API key, https://platform.openai.com/account/api-keys
  2. Add tokens if needed, https://platform.openai.com/account/billing/overview

### * ICS File Generation
Run `npm start`

This will do three things:
1. `npm run fetch:all-articles`
  - Look for new articles
  - Download article HTML
  - Parse events from the article content
  - Save article JSON
2. `npm run generate:events-json`
  - Loop through all `fixtures/**/events.json` files
  - Generate a combined `dist/events.raw.json` file
  - Combine similar events from the raw JSON file
  - Generate a deduped `dist/events.json` file
3. `npm run generate:events-ics`
  - Generate the `dist/events.ics` file

## Tools 

* Download, Parse and Save One Article
  - `npm run fetch:article -- -u <url>`

* Download, Parse and Save ALL New Articles
  - `npm run fetch:all-articles`

Article `index.html` and `events.json` are output to `fixtures/{date}_news-{slug}`.

## References &#128187;

- https://monsterhunternow.com/news
- https://en.wikipedia.org/wiki/ICalendar
- https://chat.openai.com/
