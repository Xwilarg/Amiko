import React, { useContext, useEffect, useState } from 'react'
import i18n from "i18next";
import MessageContainerForm from './messaging/MessageContainerForm';
import { SessionRenderingContextProvider } from '../context/SessionRenderingContext';
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

export default function EmbedForm() {
    const [r, forceRefresh] = useState(0);
    
    const {t} = useTranslation();

    const msgRef = React.createRef();
    const context = useContext(SessionRenderingContextProvider);
    context.refMsg = msgRef

    function refreshPage() { // Need to clean this
        forceRefresh(r + 1);
    }
    context.refreshGlobalState = refreshPage;

    useEffect(() => {
        // @ts-ignore
        filesystem.readTokenAsync().then((storedSessions: Record<string, string>) => {
            for (let [key, value] of Object.entries(storedSessions)) {
                context.addInstance(key, value, t);
            }
        });
    }, [])

    return (
        <SessionRenderingContextProvider.Provider value={context}>
            <div className="is-flex">
                <MessageContainerForm ref={msgRef} />
            </div>
        </SessionRenderingContextProvider.Provider>
    )
}