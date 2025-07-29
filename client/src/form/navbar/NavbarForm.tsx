import { forwardRef, useContext, useState } from "react"
import { SessionRenderingContextProvider } from "../AppForm";
import { useTranslation } from "react-i18next";

const NavbarForm = forwardRef((
    {},
    settingsRef
) => {
    let ctx = useContext(SessionRenderingContextProvider);
    const [shownInvitation, setShownInvitation] = useState('');
    
    let { t } = useTranslation();

    function onInvite(e: React.MouseEvent<HTMLButtonElement>) {
        ctx.getInvitationLink((invite) => {
            setShownInvitation(invite);
        })
    }

    let adminSettings =
        ctx.amIAdmin()
        ? <>
            <button className="navbar-item" onClick={onInvite}>
                <span className="material-symbols-outlined">person_add</span>
            </button>
            <button className="navbar-item" onClick={(e) => {
                // @ts-ignore
                settingsRef.current.openServerSettings();
            }}>
                <span className="material-symbols-outlined">admin_panel_settings</span>
            </button>
        </>
        : <></>

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
                        <input className="input"type="text" readOnly={true} value={ctx.getCurrentInstance()} />
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

    return (
        <nav className="navbar">
            {invitation}
            <div className="navbar-brand">
                {adminSettings}
                <button className="navbar-item">
                    <span className="material-symbols-outlined">settings</span>
                </button>
            </div>
        </nav>
    )
});

export default NavbarForm;