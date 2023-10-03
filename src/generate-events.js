import { readFileSync } from "fs";
import axios from "axios";
import { parse } from "node-html-parser";
import { resolve } from "path";

import askGPTChat from "./utils-gpt.js";
import { paths } from "./utils.js";

const USE_LOCAL = true;
// const REQUEST_DELAY = 1000;
const USERAGENT =
  "Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/117.0.0.0 Safari/537.36";
const MHNRootUrl = "https://monsterhunternow.com";
const MHNNewsUrl = `${MHNRootUrl}/news`;

const getHTMLFixture = (file) => {
  const data = readFileSync(resolve(paths.fixtures, file), {
    encoding: "utf8",
    flag: "r",
  });
  return { data };
};

const isValidEvent = async () => {
  const { data: html } = getHTMLFixture("20231001_news-oct-2023.html");
  const document = parse(html);
  const content = document.querySelector("#main article")?.textContent.trim();
  if (!content) {
    console.log("!!! No content");
    return false;
  }
  const question = `Given the content below, identify any in-game events referencing "local time" and specific dates and times. Provide the events in a consolidated JSON structure under the key "events". If no events are identified, return "INVALID". Event format should be:
{
  "summary": "Event Name",
  "description": "Description of the event",
  "dates": [
    {
      "start": "YYYY-MM-DD h:mm AM/PM",
      "end": "YYYY-MM-DD h:mm AM/PM"
    }
  ]
}
Content:
${content}`;
  console.log(question);
  const response = await askGPTChat(question);
  console.log(response);
  return response;
};

isValidEvent();

async function getNewsHTML() {
  const { data: html } = USE_LOCAL
    ? getHTMLFixture("20231002_news-index.html")
    : await axios.get(MHNNewsUrl, {
        headers: {
          "User-Agent": USERAGENT,
        },
        responseType: "document",
      });
  const document = parse(html);
  const links = document.querySelectorAll('#news a[href^="/news/"]');
  console.log(
    "!!! links",
    links.map((link) => `${MHNRootUrl}${link.getAttribute("href")}`),
  );
}

// getNewsHTML();
