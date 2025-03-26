/*
 * Manage everything related to users
 *
 * Alt users work the following ways
 * User is able to switch given 2 modes:
 * 
 * "Single" (account mode):
 * When the user select an account, it switch to this account
 * 
 * "Multiple" (co-front mode):
 * When the user select an account, it add it to the list of currently active account
 * This allow to send a message with multiple account attached to it
 * If the user click again on an account, it unselect it
 * 
 * Overall it should never be possible to have no account selected!
 * 
 * Along with that, the default value stored in preferences is an empty array
 * When user first connect, this associate to his "default" account
 * For most users, they will never switch account so this is the settings they will have
 * For someone that switched to another account, this value of an empty array shouldn't happen again!
 */

import { getCurrentAltUser, getSelectionMode, setCurrentAltUserAsync, setSelectionModeAsync, USER_SELECTION_MULTIPLE, USER_SELECTION_SINGLE } from "./preferences";

let userInfo = {};
let mainUser = null; // User to which the account belong

export async function initUsersAsync() {
    document.getElementById("user-type-selection-select").addEventListener("change", async e => {
        await setSelectionModeAsync(parseInt(e.target.value));

        await updateProfileDisplayAsync();
    });
}

export async function updateProfileDisplayAsync() {
    let displayMode = getSelectionMode();

    let currUsers = getCurrentAltUser();
    if (displayMode === USER_SELECTION_SINGLE)
    {
        if (currUsers.length > 1) // If we are at null we don't care cause we keep our default user
        {
            await setCurrentAltUserAsync([ currUsers[0] ]);
        }
        for (let p of document.getElementsByClassName("profile"))
        {
            if (currUsers.length === 0 && p.dataset.me === "1") {
                // No user specified, we take the "main" account
                p.disabled = true;
                p.classList.add("selected");
            } else if (currUsers.length > 0 && p.dataset.id === currUsers[0].toString()) {
                // This user is the one currently selected
                p.disabled = true;
                p.classList.add("selected");
            } else {
                p.disabled = false;
                p.classList.remove("selected");
            }
        }
    }
    else if (displayMode === USER_SELECTION_MULTIPLE)
    {
        for (let p of document.getElementsByClassName("profile"))
        {
            if (currUsers.length === 0 && p.dataset.me === "1") {
                // No user specified, we take the "main" account
                p.disabled = true;
                p.classList.add("selected");
            } else if (currUsers.includes(parseInt(p.dataset.id))) {
                if (currUsers.length === 1) {
                     // This element is currently selected and it's the last one that is, we can't unselected it else we would have no current user
                    p.disabled = true;
                } else {
                    p.disabled = false;
                }
                p.classList.add("selected");
            } else {
                p.disabled = false;
                p.classList.remove("selected");
            }
        }
    }
}

export function resetUsers() {
    userInfo = {};
}

export function getActiveUsers() { // TODO
    const active = getCurrentAltUser();
    if (active.length == 0) return [ mainUser ];
    return active;
}

export function getMainUserId() {
    return mainUser.id;
}

export function userIdListToInfo(ids) {
    return ids.map(x => userInfo[x]);
}

export function getInfoFromId(id) {
    if (id in userInfo) {
        return userInfo[id];
    }
    return {
        username: id,
        color: { r: 54, g: 54, b: 54 },
        character: '?'
    };
}

export function updateUserInfo(msg) {
    userInfo[msg.id] = {
        username: msg.username,
        color: msg.color,
        character: msg.character
    };

    if (msg.isMe) {
        mainUser = msg;
    }

    if (msg.isMyGroup) {
        // Update profile selection
        const persoBtn = document.createElement("button");

        persoBtn.dataset.id = msg.id.toString();
        persoBtn.dataset.me = msg.isMe ? "1" : "0";

        persoBtn.classList.add("button");
        persoBtn.classList.add("profile")
        persoBtn.classList.add("is-flex");
        persoBtn.classList.add("is-flex-direction-column");

        persoBtn.addEventListener("click", async (e) => {
            const selectionMode = getSelectionMode();

            if (selectionMode === USER_SELECTION_SINGLE) { // We can only select one at a time
                await setCurrentAltUserAsync([ msg.id ]);
            } else if (selectionMode === USER_SELECTION_MULTIPLE) { // We can select many users
                const isActive = getCurrentAltUser().includes(msg.id);

                let curr = getCurrentAltUser();
                if (isActive) { // We need to unselect
                    curr = curr.filter(x => x != msg.id);
                    if (curr.length === 0) // Not supposed to happen!
                    {
                        console.error("User tried to unset last profile");
                    }
                    else
                    {
                        await setCurrentAltUserAsync(curr);
                    }
                } else { // We need to select it
                    if (curr.length === 0) // Array was empty, this mean default user was selected
                    {
                        curr.push(mainUser.id);
                    }

                    curr.push(msg.id);
                    await setCurrentAltUserAsync(curr);
                }
            }
            await updateProfileDisplayAsync();
        });

        const pfp = document.createElement("div");
        pfp.classList.add("pfp");
        pfp.style = `background: rgb(${msg.color.r}, ${msg.color.g}, ${msg.color.b});`;
        pfp.innerHTML = msg.character;
        persoBtn.appendChild(pfp);

        const name = document.createElement("p");
        name.innerHTML =  msg.username;
        persoBtn.appendChild(name);
        document.getElementById("profile-selection").appendChild(persoBtn);
    }
}