import { forwardRef, useContext, useState } from "react"
import { useTranslation } from "react-i18next";
import { SessionRenderingContextProvider } from "../../context/SessionRenderingContext";

const NavbarForm = forwardRef((
    {},
    settingsRef
) => {
    let ctx = useContext(SessionRenderingContextProvider);
    const [shownInvitation, setShownInvitation] = useState('');

    const [r, forceRefresh] = useState(0);

    function refreshPage() { // Need to clean this
        forceRefresh(r + 1);
    }
    ctx.refreshNavbar = refreshPage;

    let { t } = useTranslation();

    function onInvite(e: React.MouseEvent<HTMLButtonElement>) {
        ctx.getInvitationLink((invite) => {
            setShownInvitation(invite);
        })
    }

    let invitation = 
        shownInvitation ?
        <div className="modal is-active">
            <div className="modal-background"></div>
            <div className="modal-content">
                <button className="modal-close is-large" aria-label="close" onClick={(e) => {setShownInvitation("")}}></button>
                <div className="field has-addons">
                    <div className="control">
                        <button className="button is-info" disabled={true} style={{
                            cursor:"default"
                        }}>{t("invitation.forInstance")}</button>
                    </div>
                    <div className="control">
                        <input className="input"type="text" readOnly={true} value={ctx.getCurrentInstanceName()} />
                    </div>
                </div>
                <div className="field pb-6">
                    <label className="label">{t("invitation.invitationToken")}</label>
                    <div className="control">
                        <input className="input" type="text" readOnly={true} value={shownInvitation} />
                    </div>
                </div>
            </div>
        </div>
        : <></>

    let adminSettings =
        ctx.amIAdmin()
        ? <>
            <button className="navbar-item button" onClick={onInvite}>
                <span className="material-symbols-outlined">person_add</span>
            </button>
            {
                ctx.getCurrentServer() ?
                <button className="navbar-item button" onClick={(e) => {
                    // @ts-ignore
                    settingsRef.current.openServerSettings();
                }}>
                    <span className="material-symbols-outlined">admin_panel_settings</span>
                </button>
                : <></>
            }
        </>
        : <></>

    let nameDisplay : React.ReactElement;
    let notGuest : React.ReactElement;
    if (ctx.sessions.length > 0) {
        let serv = ctx.getCurrentServer();
        if (serv) {
            nameDisplay =
            <div className="level is-mobile">
                <h3 className="subtitle" id="channel-title">{ctx.getCurrentChannelName()}</h3>
                {
                    serv.allowsGuest ?
                    <>
                        <span className="material-symbols-outlined small-icon" title={t("settings.server.allowsGuest")}>face</span>
                    </>
                    : <></>
                }
                {
                    serv.isEphemeral ?
                    <>
                        <span className="material-symbols-outlined small-icon" title={t("settings.server.isEphemeral")}>timer</span>
                    </>
                    : <></>
                }
            </div>;
        } else {
            nameDisplay = <></>;
        }

        notGuest = !ctx.isCurrentUserGuest() ?
            <button className="navbar-item button" onClick={(e) => {
                // @ts-ignore
                settingsRef.current.openUserSettings();
            }}>
                <span className="material-symbols-outlined">account_circle</span>
            </button>
        : <></>
    } else {
        nameDisplay = <></>
        notGuest = <></>
    }

    return (
        <nav className="navbar">
            {invitation}
            <div className="navbar-brand">
                {adminSettings}
                {notGuest}
                <button className="navbar-item button" onClick={(e) => {
                    // @ts-ignore
                    settingsRef.current.openGeneralSettings();
                }}>
                    <span className="material-symbols-outlined">settings</span>
                </button>
                {nameDisplay}
            </div>
        </nav>
    )
});

export default NavbarForm;