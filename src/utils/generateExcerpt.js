import * as cheerio from "cheerio";

export function generateExcerpt(html) {
    const $ = cheerio.load(html);

    const firstParagraph = $('p').first().text().trim();

    if (!firstParagraph) return null;

    const sentences = firstParagraph.split(/(?<=[.?!])\s+/);

    const excerpt = sentences.slice(0, 2).join("");
    return excerpt;
}