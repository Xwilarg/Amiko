import { createHttpUrl, openMessageConnection, sendMessageFromInput } from "./network";

let token;

window.addEventListener('DOMContentLoaded', async () => {
    const pwd = document.getElementById("password");
    const fileToken = await filesystem.readAsync();

    if (fileToken) {
        fetch(createHttpUrl("auth/validate"), {
            method: 'POST',
            headers: {
                'Authorization': `Bearer ${fileToken}`
            }
        })
        .then(resp => resp.ok ? resp.text() : Promise.reject(`${resp.status}`))
        .then(_ => {
            token = fileToken;
            pwd.value = "";
            document.getElementById("login-popup").classList.remove("is-active");
            openMessageConnection(token);
        })
        .catch((err) => {});
    }

    document.getElementById("password-submit").addEventListener("click", _ => {

        fetch(createHttpUrl("auth/token"), {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify(pwd.value)
        })
        .then(resp => resp.ok ? resp.text() : Promise.reject(`${resp.status}`))
        .then(async text => {
            token = text;
            await filesystem.writeAsync(token);
            pwd.value = "";
            document.getElementById("login-popup").classList.remove("is-active");
            openMessageConnection(token);
        })
        .catch((err) => {
            alert(`Login failed: ${err}`)
        });
    });

    document.getElementById("send-message").addEventListener("click", e => {
        e.preventDefault();
        const content = document.getElementById("message-field");
        if (content.value) {
            sendMessageFromInput(content.value);
            content.value = "";
        }
    });
});