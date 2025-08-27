import { forwardRef, useImperativeHandle, useState } from "react";
import ServerSettingsForm from "./ServerSettingsForm";
import { useTranslation } from "react-i18next";
import UserSettingsForm from "./UserSettingsForm";
import GeneralSettingsForm from "./GeneralSettingsForm";

const SettingsContainerForm = forwardRef((
    {},
    settingsRef
) => {
    const [openSettings, setOpenSettings] = useState<OpenedSettings>("None");

    useImperativeHandle(settingsRef, () => ({
        openServerSettings() {
            setOpenSettings(openSettings === "Server" ? "None" : "Server");
        },
        openUserSettings() {
            setOpenSettings(openSettings == "User" ? "None" : "User");
        },
        openGeneralSettings() {
            setOpenSettings(openSettings == "General" ? "None" : "General");
        }
    }));
    let { t } = useTranslation();

    let title: string;
    let node: React.ReactNode;

    if (openSettings === "Server") {
        title = t("settings.server.title");
        node = <ServerSettingsForm />
    }
    else if (openSettings === "User") {
        title = t("settings.user.title");
        node = <UserSettingsForm />
    }
    else if (openSettings === "General") {
        title = t("settings.general.title");
        node = <GeneralSettingsForm />
    }
    else return <></>


    return (
        <div id="settings" className="has-text-centered pt-5">
            <h2 className="subtitle">{title}</h2>
            {node}
            <button className="modal-close is-large" aria-label="close" onClick={
                () => { setOpenSettings("None"); }
            }></button>
        </div>
    )
});

type OpenedSettings = 'None' | 'Server' | 'User' | 'General';

export default SettingsContainerForm;