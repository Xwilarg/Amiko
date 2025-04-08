const EmojiConvertor = require('emoji-js');
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