const EmojiConvertor = require('emoji-js');
// @ts-ignore
import { marked } from "marked";
import { preferences_getAccessibilityReadingMode, ReadingMode } from "../persistancy/preferences";

const emoji = new EmojiConvertor();
emoji.replace_mode = "unified";

// Override function
const walkTokens = (token) => {
    // Bold reading check, emphasis the start of each word by putting it in bold
    if ((token.type === "text" || token.type === "paragraph")
        && preferences_getAccessibilityReadingMode() === ReadingMode.BoldReading
        && token.tokens
        && !token.raw.includes('<span class="link">') // Placeholder, TODO: redo link parsing in marked itself
    )
    {
        const finalTokens = [];

        token.tokens.forEach((subToken) => { // Paragraphs may contains lot to tokens
            if (subToken.type === 'text') // We don't emphasis something that is already in italic or other
            {
                const words = subToken.text.split(' ');
                for (let i = 0; i < words.length; i++) // We split by space so we can iterate on each word
                {
                    const word = words[i] + ' ';
                    if (word.length < 3)
                    {
                        finalTokens.push({
                            type: 'strong',
                            tokens: [{ type: 'text', text: word }]
                        });
                    }
                    else
                    {
                        const first = word.substring(0, 3);
                        const rest = word.substring(3);

                        if (first) {
                            finalTokens.push({
                                type: 'strong',
                                tokens: [{ type: 'text', text: first }]
                            });
                        }
                        if (rest) {
                            finalTokens.push({ type: 'text', text: rest });
                        }
                    }
                }
            } else {
                finalTokens.push(subToken);
            }
        });

        token.tokens = finalTokens;
    }
};

marked.use({
    walkTokens,
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