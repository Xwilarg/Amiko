import { useContext } from "react"
import { SessionRenderingContextProvider } from "./AppForm";

export default function NavbarForm() {
    let ctx = useContext(SessionRenderingContextProvider);
    let adminSettings =
        ctx.amIAdmin()
        ? <>
            <button className="navbar-item">
                <span className="material-symbols-outlined">person_add</span>
            </button>
            <button className="navbar-item">
                <span className="material-symbols-outlined">admin_panel_settings</span>
            </button>
        </>
        : <></>

    return (
        <nav className="navbar">
            <div className="navbar-brand">
                {adminSettings}
                <button className="navbar-item">
                    <span className="material-symbols-outlined">settings</span>
                </button>
            </div>
        </nav>
    )
}