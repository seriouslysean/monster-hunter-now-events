import { readFileSync } from "fs";
import axios from "axios";
import { parse } from "node-html-parser";
import { resolve } from "path";

import { paths } from "./utils.js";

const USE_LOCAL = false;
// const REQUEST_DELAY = 1000;
const USERAGENT =
  "Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/117.0.0.0 Safari/537.36";
const MHNRootUrl = "https://monsterhunternow.com";
const MHNNewsUrl = `${MHNRootUrl}/news`;

const getHTMLFixture = () => {
  const data = readFileSync(
    resolve(paths.fixtures, "20231002_news-index.html"),
    {
      encoding: "utf8",
      flag: "r",
    },
  );
  return { data };
};

async function getNewsHTML() {
  const { data: html } = USE_LOCAL
    ? getHTMLFixture()
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

getNewsHTML();
