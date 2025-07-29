import { forwardRef, useImperativeHandle, useState } from "react";
import ServerSettingsForm from "./ServerSettingsForm";
import { useTranslation } from "react-i18next";

const SettingsContainerForm = forwardRef((
    {},
    settingsRef
) => {
    const [openSettings, setOpenSettings] = useState<OpenedSettings>("None");

     useImperativeHandle(settingsRef, () => ({
        openServerSettings() {
            setOpenSettings(openSettings === "Server" ? "None" : "Server");
        }
    }));
    let { t } = useTranslation();

    let title: string;
    let node: React.ReactNode;

    if (openSettings === "Server") {
        title = t("settings.server.title");
        node = <ServerSettingsForm />
    }
    else return <></>


    return (
        <div id="settings" className="has-text-centered pt-5">
            <h2 className="subtitle">{title}</h2>
            {node}
        </div>
    )
});

type OpenedSettings = 'None' | 'Server';

export default SettingsContainerForm;