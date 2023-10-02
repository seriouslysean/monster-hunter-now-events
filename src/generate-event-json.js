import got from 'got';

const MHNNewsUrl = 'https://monsterhunternow.com/news';

async function getNewsHTML() {
    const { body: html } = await got(MHNNewsUrl);
    console.log(html);
}

getNewsHTML();
