import { useState } from 'react'
import { useTranslation } from 'react-i18next';
import { useNavigate, useSearchParams } from 'react-router';
export default function NewUserForm() {
    const [searchParams, setSearchParams] = useSearchParams();
    const [error, setError] = useState('');
    const [username, setUsername] = useState("");
    const [password, setPassword] = useState("");
    const [passwordConfirm, setPasswordConfirm] = useState("");
    const [instance, setInstance] = useState<string>(() => {
        const url = new URL(window.location.href);
        var i = url.searchParams.get("instance");
        if (i) return decodeURI(i);
        // @ts-ignore
        return configuration.baseUrl() ?? ""
    });
    const [token, setToken] = useState<string>(() => {
        var t = searchParams.get("token");
        return t ?? ""
    });
    
    let navigate = useNavigate();
    let { t } = useTranslation();

    async function onSubmit(e: React.MouseEvent<HTMLInputElement>) {
        setError("");

        if (!username) {
            setError(t("login.missingUsername"));
            return;
        }

        if (!password) {
            setError(t("login.missingPassword"));
            return;
        }

        if (!token) {
            setError(t("login.missingInvitation"));
            return;
        }

        if (password !== passwordConfirm) {
            setError(t("login.passwordDontMatch"))
            return;
        }

        const res = await fetch(`${instance}/api/invitation/createUser`, {
            method: "POST",
            headers: {
                "Content-Type": "application/json"
            },
            body: JSON.stringify({
                invitation: token,
                username: username,
                password: password
            })
        })
        if (res.ok) {
            navigate(`/login`);
        } else {
            setError(t("login.badInvitation"));
        }
    }
    
    return (
    <div className="modal is-active">
        <div className="modal-background"></div>
        <div className="modal-content">
            <h2 className="title">{t("login.welcome")}</h2>
            <h3 className="subtitle">{t("login.catchphrase")}</h3>
            <div className="field pb-6 mt-6">
                <label className="label">{t("login.website")}</label>
                <div className="control">
                    <input className="input" type="text" disabled={instance != ""}
                        value={instance} onChange={(e) => setInstance(e.target.value)}
                    />
                </div>
            </div>
            <div className="field pb-6 mt-6">
                <label className="label">{t("login.invitationToken")}</label>
                <div className="control">
                    <input className="input" type="text" 
                        value={token} onChange={(e) => setToken(e.target.value)}
                    />
                </div>
            </div>
            <div className="field">
                <label className="label">{t("login.username")}</label>
                <div className="control">
                    <input className="input" type="text"
                        value={username} onChange={(e) => setUsername(e.target.value)}
                    />
                </div>
            </div>
            <div className="field">
                <label className="label">{t("login.password")}</label>
                <div className="control">
                    <input className="input" type="password"
                    value={password} onChange={(e) => setPassword(e.target.value)}
                />
                </div>
            </div>
            <div className="field">
                <label className="label">{t("login.passwordConfirm")}</label>
                <div className="control">
                    <input className="input" type="password"
                    value={passwordConfirm} onChange={(e) => setPasswordConfirm(e.target.value)}
                />
                </div>
            </div>
            <p className={"help is-danger" + (error ? "" : " is-hidden")}>{error}</p>
            <div className="field pt-3">
                <input className="input is-primary" type="submit" onClick={onSubmit} />
            </div>
        </div>
    </div>
    )
}