import { renderer_getCurrentRenderer } from "../display/rendererManager";
import User from "../models/user";
import { preferences_getCurrentAltUser, preferences_getUserSelectionMode, preferences_setCurrentAltUserAsync, preferences_setUserSelectionModeAsync, UserSelectionMode } from "../persistancy/preferences";

let currentWebsite: string | null = null;
let buttons: UserSelectionButton[];

interface UserSelectionButton
{
    element: HTMLButtonElement;
    user: User;
    isMainUser: boolean;
}

export async function userSelection_initAsync() {
    document.getElementById("user-type-selection-select").addEventListener("change", async e => {
        await preferences_setUserSelectionModeAsync(parseInt((e.target as HTMLInputElement).value));

        await updateProfileDisplayAsync();
    });

    document.getElementById("toggle-profile").addEventListener("click", async _ => {
        const website = renderer_getCurrentRenderer().network.website;
        await updateDisplayAsync(website, renderer_getCurrentRenderer().getInfoFromIdList(renderer_getCurrentRenderer().possibleUsers), renderer_getCurrentRenderer().mainUser);
    });
}

export async function updateProfileDisplayAsync() {
    if (currentWebsite === null) {
        console.error("currentWebsite wasn't set");
        return;
    }

    let displayMode = preferences_getUserSelectionMode();

    let currUsers = preferences_getCurrentAltUser(currentWebsite);
    if (displayMode === UserSelectionMode.Single)
    {
        if (currUsers.length > 1) // If we are at null we don't care cause we keep our default user
        {
            await preferences_setCurrentAltUserAsync(currentWebsite, [ currUsers[0] ]);
        }
        for (let u of buttons)
        {
            if (currUsers.length === 0 && u.isMainUser) {
                // No user specified, we take the "main" account
                u.element.disabled = true;
                u.element.classList.add("is-primary");
            } else if (currUsers.length > 0 && u.user.id === currUsers[0]) {
                // This user is the one currently selected
                u.element.disabled = true;
                u.element.classList.add("is-primary");
            } else {
                u.element.disabled = false;
                u.element.classList.remove("is-primary");
            }
        }
    }
    else if (displayMode === UserSelectionMode.Multiple)
    {
        for (let u of buttons)
        {
            if (currUsers.length === 0 && u.isMainUser) {
                // No user specified, we take the "main" account
                u.element.disabled = true;
                u.element.classList.add("is-primary");
            } else if (currUsers.includes(u.user.id)) {
                if (currUsers.length === 1) {
                     // This element is currently selected and it's the last one that is, we can't unselected it else we would have no current user
                    u.element.disabled = true;
                } else {
                    u.element.disabled = false;
                }
                u.element.classList.add("is-primary");
            } else {
                u.element.disabled = false;
                u.element.classList.remove("is-primary");
            }
        }
    }
}

async function updateDisplayAsync(website: string, possibleUsers: User[], mainUser: number) {
    currentWebsite = website;
    buttons = [];
    const container = document.getElementById("profile-selection");
    const template = document.getElementById("profile-template") as HTMLTemplateElement;
    container.innerHTML = "";

    for (const u of possibleUsers) {
        // Update profile selection
        const instance = template.content.cloneNode(true) as HTMLElement;
    
        const persoBtn = instance.querySelector("button");
    
        persoBtn.addEventListener("click", async _ => {
            const selectionMode = preferences_getUserSelectionMode();
    
            if (selectionMode === UserSelectionMode.Single) { // We can only select one at a time
                await preferences_setCurrentAltUserAsync(website, [ u.id ]);
            } else if (selectionMode === UserSelectionMode.Multiple) { // We can select many users
                let curr = preferences_getCurrentAltUser(website);
                const isActive = preferences_getCurrentAltUser(website).includes(u.id);
                
                if (isActive) { // We need to unselect
                    curr = curr.filter(x => x != u.id);
                    if (curr.length === 0) // Not supposed to happen!
                    {
                        console.error("User tried to unset last profile");
                    }
                    else
                    {
                        await preferences_setCurrentAltUserAsync(website, curr);
                    }
                } else { // We need to select it
                    if (curr.length === 0) // Array was empty, this mean default user was selected
                    {
                        curr.push(mainUser);
                    }
    
                    curr.push(u.id);
                    await preferences_setCurrentAltUserAsync(website, curr);
                }
            }
            await updateProfileDisplayAsync();
        });
    
        const pfp = instance.querySelector("div");
        pfp.style = `background: rgb(${u.color.r}, ${u.color.g}, ${u.color.b});`;
        pfp.innerHTML = u.character;
    
        const name = instance.querySelector("p");
        name.innerHTML =  u.username;
        container.appendChild(instance);

        buttons.push({
            element: container.lastElementChild as HTMLButtonElement,
            user: u,
            isMainUser: u.id === mainUser
        });
    }
    await updateProfileDisplayAsync();
}