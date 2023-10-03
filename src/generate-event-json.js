import { readFileSync } from "fs";
import got from "got";
import { parse } from "node-html-parser";
import { resolve } from "path";

import { paths } from "./utils.js";

const MHNNewsUrl = "https://monsterhunternow.com/news";

const getHTMLFixture = () => {
  const data = readFileSync(resolve(paths.fixtures, "news-index.html"), {
    encoding: "utf8",
    flag: "r",
  });
  return data;
};

async function getNewsHTML() {
  const { body } = { body: getHTMLFixture() } ?? (await got(MHNNewsUrl));
  const document = parse(body);
  const links = document.querySelectorAll('#news a[href^="/news/"]');
  console.log("!!! links", links);
}

getNewsHTML();
