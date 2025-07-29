import React, { createContext, useContext, useEffect, useState, type ReactElement } from 'react'
import i18n from "i18next";
import NetworkSession from '../instance/NetworkSession';
import ServerSelectionForm from './messaging/ServerSelectionForm';
import MessageContainerForm from './messaging/MessageContainerForm';
import SessionRenderingContext from '../context/SessionRenderingContext';
import NavbarForm from './navbar/NavbarForm';
import SettingsContainerForm from './settings/SettingsContainerForm';
import { initReactI18next, useTranslation } from "react-i18next";

import translationEN from "../../locales/en/translation.json"

export const SessionRenderingContextProvider = createContext<SessionRenderingContext>(new SessionRenderingContext());

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
    const [sessions, setSessions] = useState<Array<NetworkSession>>([]);
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
        // @ts-ignore
        filesystem.readTokenAsync().then((storedSessions: Record<string, string>) => {
            for (let [key, value] of Object.entries(storedSessions)) {
                context.addInstance(key, value, refreshPage, t);
            }
        });
    }, [])


    let serverListDisplay: Array<ReactElement> = []
    let tmpS: Array<NetworkSession> = sessions;
    for (let ns of tmpS) {
        for (let [key, value] of Object.entries(ns.messaging.servers))
        serverListDisplay.push(
            <div key={value.name} className="button profile is-flex is-flex-wrap-wrap is-primary notif-container">
                <div className="pfp" style={{
                    background: `rgb(${value.color.r}, ${value.color.g}, ${value.color.b})`
                }}>{value.character}
                </div>
                <p>{value.name}</p>
            </div>
        )
    }

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