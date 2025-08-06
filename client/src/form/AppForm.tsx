import React, { useContext, useEffect, useState } from 'react'
import i18n from "i18next";
import ServerSelectionForm from './messaging/ServerSelectionForm';
import MessageContainerForm from './messaging/MessageContainerForm';
import { SessionRenderingContextProvider, type DisplayMode } from '../context/SessionRenderingContext';
import NavbarForm from './navbar/NavbarForm';
import SettingsContainerForm from './settings/SettingsContainerForm';
import { initReactI18next, useTranslation } from "react-i18next";

import translationEN from "../../locales/en/translation.json"

i18n
  .use(initReactI18next) // passes i18n down to react-i18next
  .init({
    resources: {
        en: {
            translation: translationEN
        }
    },
    lng: "en",

    interpolation: {
      escapeValue: false
    }
  });

export default function AppForm() {
    const [r, forceRefresh] = useState(0);
    
    const {t} = useTranslation();

    const msgRef = React.createRef();
    const context = useContext(SessionRenderingContextProvider);
    context.refMsg = msgRef

    const settingsRef = React.createRef();

    function refreshPage() { // Need to clean this
        forceRefresh(r + 1);
    }
    context.refreshGlobalState = refreshPage;

    useEffect(() => {
        // We need to get current display mode to know how we render things
        context.getDisplayModeAsync().then((displayMode: DisplayMode) => {
            context.displayMode = displayMode;
            if (context.displayMode === "Default") {
                // @ts-ignore
                import("../../css/options/regular.css");
            } else if (context.displayMode === "Minimalist") {
                // @ts-ignore
                import("../../css/options/minimalist.css");
            }

            // Read token
            // @ts-ignore
            filesystem.readTokenAsync().then((storedSessions: Record<string, string>) => {
                for (let [key, value] of Object.entries(storedSessions)) {
                    context.addInstance(key, value, t);
                }
                for (let s of context.sessions) {
                    s.connect();
                }
            });
        })

    }, [])

    return (
        <SessionRenderingContextProvider.Provider value={context}>
            <NavbarForm ref={settingsRef} />
            <div className="is-flex">
                <ServerSelectionForm />
                <MessageContainerForm ref={msgRef} />
                <SettingsContainerForm ref={settingsRef} />
            </div>
        </SessionRenderingContextProvider.Provider>
    )
}