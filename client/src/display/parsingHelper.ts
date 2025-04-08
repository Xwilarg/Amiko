const EmojiConvertor = require('emoji-js');
// @ts-ignore
import { marked } from "marked";

const emoji = new EmojiConvertor();
emoji.replace_mode = "unified";
marked.use({
    breaks: true,
    tokenizer: {
      link() {},
      url() {}
    }
});

export function parsingHelper_parseEmojis(str: string): string {
  return emoji.replace_colons(str);
}

export function parsingHelper_parseMarkdown(str: string): string {
  return marked.parse(str);
}