<p align="center">
  <img
    src="./assets/monster-hunter-now-logo.png"
    alt="Monster Hunter Now Logo" />
</p>

# Monster Hunter Now Events
## Table Of Contents
* Calendar Subscription (Purpose)
  - Steps to Subscribe the Event Calendar <br>
* Local Implementation of Calendar Subscription <br>
* Tools <br>
* References 

## Calendar Subscription
This is a calendar subscription page for events in [Monster Hunter Now](https://monsterhunternow.com/).

In case you are new to Events, [Feel free to explore and join the enriching experience.](https://apps.apple.com/us/app/monster-hunter-now/id6445906110). Use the below referral code for free items and zenny, **`89K5MKCF`**.

This has been created to add events to a shared calendar for all the players including me and my friends. It's a great way to visualize how AI is beneficial for coding via dialogue with ChatGPT, and an exemplary way of utilizing the OpenAI API. 

### Steps to Subscribe the Event Calendar

Add the [ICS file](https://seriouslysean.github.io/monster-hunter-now-events/dist/events.ics) to your calendar app.

```
https://seriouslysean.github.io/monster-hunter-now-events/dist/events.ics
```

## Local Implementation of Calendar Subscription (Runs locally)
* Open AI Key <br>
* ICS File Generation

### * Open AI Key
  1. Sign up for an OpenAI API key, https://platform.openai.com/account/api-keys
  2. Add tokens if needed, https://platform.openai.com/account/billing/overview

### * ICS File Generation
Run `npm start`
The above command executes in below three steps:
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

## References
Links to be referred : 
- https://monsterhunternow.com/news
- https://en.wikipedia.org/wiki/ICalendar
- https://chat.openai.com/
