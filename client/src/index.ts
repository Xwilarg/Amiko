import { login_initAsync } from "./components/login";
import { sidebar_initAsync } from "./components/sidebar";
import { preferences_initAsync } from "./models/preferences";

window.addEventListener('DOMContentLoaded', async () => {
    const inits = [
        preferences_initAsync, // Need to be called first since the rest might depends of user preferences
        sidebar_initAsync,
        login_initAsync
    ];

    for (let i of inits) {
        try
        {
            await i();
        }
        catch (e) {
            console.warn(`Failed to init a startup component`);
            console.error(e);
        }
    }
});