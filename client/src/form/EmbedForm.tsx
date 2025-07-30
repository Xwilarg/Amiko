import React, { useContext, useEffect, useState } from 'react'
import i18n from "i18next";
import MessageContainerForm from './messaging/MessageContainerForm';
import { SessionRenderingContextProvider } from '../context/SessionRenderingContext';
import { initReactI18next, useTranslation } from "react-i18next";

import translationEN from "../../locales/en/translation.json"
import { useSearchParams } from 'react-router';

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
    
    const [searchParams, setSearchParams] = useSearchParams();
    const {t} = useTranslation();

    const msgRef = React.createRef();
    const context = useContext(SessionRenderingContextProvider);
    context.refMsg = msgRef

    function refreshPage() { // Need to clean this
        forceRefresh(r + 1);
    }
    context.refreshGlobalState = refreshPage;

    useEffect(() => {
        let website = searchParams.get("website")
        // @ts-ignore
        let url = website ? `${configuration.baseUrl()}${website}` : configuration.baseUrl();
        context.addInstance(url, "guest", t);
    }, [])

    return (
        <SessionRenderingContextProvider.Provider value={context}>
            <div className="is-flex">
                <MessageContainerForm ref={msgRef} />
            </div>
        </SessionRenderingContextProvider.Provider>
    )
}