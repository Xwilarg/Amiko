import Renderer from "../instance/renderer";
import Message from "../models/message";
import UserInfo from "../models/user";
import { parsingHelper_parseEmojis, parsingHelper_parseMarkdown } from "./parsingHelper";
// @ts-ignore
import DOMPurify from 'dompurify';

export default class MessageInstance
{
    element: HTMLElement;

    constructor(
        container: HTMLElement, // Object that will contain the final message object
        m: Message,
        r: Renderer
    ) {
        const template = document.getElementById("message-template") as HTMLTemplateElement;

        const instance = template.content.cloneNode(true) as HTMLElement;
        let msg = instance.querySelector(".message");

        if (m.ackId) { // If we have an acknowledgement id, it mean we didn't get a read confirmation yet from the server
            msg.classList.add("pending");
        } else if (r.wasIMentionned(m.content)) {
            msg.classList.add("mention");
        }

        this.updateMessageAuthor(instance, r.getInfoFromIdList(m.authors));
        instance.querySelector(".date").innerHTML = m.date.toLocaleString();

        this.parseMessage(instance, m.content, m.attachments);

        this.element = container.appendChild(instance);
    }

    // Update the author of a message
    // When there are many authors, we need to merge them all into one
    updateMessageAuthor(message: HTMLElement, infos: UserInfo[]) {
        message.querySelector(".subtitle").innerHTML = infos.map(x => x.username).join(" / ");
        var pfp = message.querySelector(".pfp") as HTMLElement;

        // Merge all users colors by doing their average
        const r = infos.map(x => x.color.r).reduce((a, b) => a + b, 0) / infos.length;
        const g = infos.map(x => x.color.g).reduce((a, b) => a + b, 0) / infos.length;
        const b = infos.map(x => x.color.b).reduce((a, b) => a + b, 0) / infos.length;
        pfp.style = `background: rgb(${r}, ${g}, ${b});`;

        // Update character inside the PFP
        if (infos.length === 1) { // Only one user, just need to take the current one!
            pfp.innerHTML = infos[0].character;
        } else { // There are many users, we do the average of the symbol on their PFP
            let arr = [];
            const characters = infos.map(x => x.character).sort((a, b) => b.length - a.length);
            for (let i = 0; i < characters[0].length; i++)
            {
                arr.push(characters[0].codePointAt(i));
            }
            for (const c of characters.slice(1))
            {
                for (let i = 0; i < c.length; i++)
                {
                    arr[i] += c.codePointAt(i);
                }
            }
            for (let i in arr)
            {
                arr[i] = Math.floor(arr[i] / infos.length);
            }
            pfp.innerHTML = String.fromCodePoint(...arr);
        }
    }

    parseMessage(msg: HTMLElement, text: string, attachments: string[]) {
        msg.querySelector(".rich-preview").innerHTML = "";
        let finalHtml = text;

        // Pattern match urls
        // Optionally at the start we can have <XXX:
        // <> specify special formats (by default hide image)
        // XXX: overrides behaviors

        // Regex explanations:
        // First look for "<" (optional)
        // Then look for behavior specification "XXXXX:" (optional)
        // Then we look for the URL, it matches until it find one of the following strings: '^', ' ', '\n', ')', ',', ';', '>', '[end of line]'
        // We check if we have a ">" at the end (optional)
        const regex = /((<)(([a-zA-Z]+):)?)?(https?:\/\/.+?)(^| |\n|\)|,|;|>|$)(>)?/gm
        const prev = msg.querySelector(".rich-preview");
        let behavior = "";
        finalHtml = finalHtml.replace(regex, function(match, _) {
            let l = [...match.matchAll(regex)][0];
            if (l[2] === "&lt;" && l[6] === "&gt;")
            {
                switch (l[4])
                {
                    case "b":
                        behavior = "blur";
                        break;
    
                    default: // Don't show the image
                    return `<span class="link-indicator">${l[1]}</span><span class="link">${l[5]}</span><span class="link-indicator">${l[6]}</span>`;
                }
            }
    
            const indicatorLeft = behavior === "" ? "" : `<span class="link-indicator">${l[2]}</span>`;
            const indicatorRight = behavior === "" ? "" : `<span class="link-indicator">${l[6]}</span>`;
    
            let m = l[5].match(/(png|jpg|jpeg|gif|webp)$/m);
            if (m) { // Ensure we can't inject code by closing the string
                // createRichPreviewImage(l[5], prev, behavior); // TODO: preview.js
                return `${indicatorLeft}<span class="link link-image">${l[5]}</span>${indicatorRight}`;
            }
    
            // Youtube check
            let yt = l[5].match(/youtube\.com\/watch\?v=([0-9a-zA-Z_]+)/m);
            if (!yt) {
                yt = l[5].match(/youtu\.be\/([0-9a-zA-Z_]+)/m); 
            }
            if (yt) {
                prev.classList.remove("is-hidden");
                if (behavior === "") {
                    prev.innerHTML += `<div class="preview"><iframe type="text/html" width="256" height="256" src="https://www.youtube-nocookie.com/embed/${yt[1]}" frameborder="0"></iframe></div>`;
                } else {
                    prev.innerHTML += `<div class="preview"><img data-yt="${yt[1]}" class="image ${behavior}" src="https://img.youtube.com/vi/${yt[1]}/0.jpg"/></div>`;
                }
            }
    
            return `${indicatorLeft}<span class="link">${l[5]}</span>${indicatorRight}`;
        });


        // When we click on something that have a blur effect, we remove it
        for (let p of prev.getElementsByClassName("preview")) {
            p.addEventListener("click", e => {
                let target = e.target as HTMLElement;
                target.classList.remove("blur");

                if (target.dataset.yt) {
                    (target.parentNode as HTMLElement).innerHTML = `<iframe type="text/html" width="256" height="256" src="https://www.youtube-nocookie.com/embed/${target.dataset.yt}" frameborder="0"></iframe>`;
                }
            });
        }

        finalHtml = parsingHelper_parseEmojis(finalHtml);
        finalHtml = parsingHelper_parseMarkdown(finalHtml);
        finalHtml = DOMPurify.sanitize(finalHtml);

        msg.querySelector(".content").innerHTML = finalHtml;

        for (const link of msg.querySelectorAll(".link")) {
            link.addEventListener("click", (_) => {
                // @ts-ignore
                interaction.open(link.innerHTML);
            });
        }
    }
}