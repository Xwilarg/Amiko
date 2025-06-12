// Used to preview medias

export async function preview_initAsync() {
    document.getElementById("close-preview").addEventListener("click", _ => {
        document.getElementById("modal-preview").classList.remove("is-active");
    });
}


function showImage(link: string) {
    document.getElementById("modal-preview").classList.add("is-active");
    (document.getElementById("image-preview") as HTMLImageElement).src = link;
}

export function preview_createRichPreview(link: string, parent: HTMLElement, behavior: string, mimetype: string) {
    const div = document.createElement("div");

    if (mimetype.startsWith("image/"))
    {
        const img = document.createElement("img");
        parent.classList.remove("is-hidden");
        if (behavior) img.classList.add(behavior);
        img.src = link;
        img.addEventListener("click", _ => showImage(link));
        div.appendChild(img);
    }
    else if (mimetype.startsWith("video/"))
    {
        const video = document.createElement("video");
        video.setAttribute("controls", "controls");
        parent.classList.remove("is-hidden");
        if (behavior) video.classList.add(behavior);
        video.src = link;
        div.appendChild(video);
    }
    else
    {
        console.warn(`Unknown mimetype ${mimetype}`);
        return;
    }

    parent.appendChild(div);
}