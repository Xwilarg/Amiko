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

export function preview_createRichPreviewImage(link: string, parent: HTMLElement, behavior: string) {
    const div = document.createElement("div");
    div.classList.add()

    const img = document.createElement("img");
    parent.classList.remove("is-hidden");
    if (behavior) img.classList.add(behavior);
    img.src = link;
    img.addEventListener("click", _ => showImage(link));
    div.appendChild(img);

    parent.appendChild(div);
}