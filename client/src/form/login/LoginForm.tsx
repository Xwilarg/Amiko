import { useEffect, useState, type ReactNode } from 'react'
import type Metadata from '../../model/Metadata';
import { useNavigate } from 'react-router';
import { useTranslation } from 'react-i18next';

export default function LoginForm() {
    // @ts-ignore
    const [instance, setInstance] = useState<string>(`${configuration.baseUrl() ?? ""}`);
    const [metadata, setMetadata] = useState<Metadata | null>(null);
    const [adminToken, setAdminToken] = useState("");
    const [username, setUsername] = useState("");
    const [password, setPassword] = useState("");
    const [error, setError] = useState('');

    let navigate = useNavigate();
    let { t } = useTranslation();

    function checkInstance()
    {
        fetch(`${instance}/api/`)
        .then(resp => resp.ok ? resp.json() : Promise.reject(`${resp.status}`))
        .then(json => {
            setMetadata(json);
            setError("");
        })
        .catch((_) => {
            // @ts-ignore
            if (configuration.baseUrl() === "")
            {
                setInstance("");
                setError(t("login.noInstance"));
            }
            else
            {
                setError(t("login.genericError"));
            }
        });
    }
    useEffect(() => {
        if (instance !== "")
        {
            checkInstance();
        }
    }, []);

    function onLogin(e: React.MouseEvent<HTMLInputElement>) {
        e.preventDefault();

        setError(""); // Clear error message

        if (metadata === null) { // Metadata not set, we need to connect to a backend
            if (!instance) {
                setError(t("login.missingInstance"));
                return;
            }

            checkInstance();
        } else {
            if (metadata.isInit) { // Metadata are set and the instance already have an admin user
                if (!username) {
                    setError(t("login.missingUsername"));
                    return;
                }

                if (!password) {
                    setError(t("login.missingPassword"));
                    return;
                }

                fetch(`${instance}/api/auth/token`, {
                    method: 'POST',
                    headers: {
                        'Content-Type': 'application/json'
                    },
                    body: JSON.stringify({
                        username: username,
                        password: password
                    })
                })
                .then(resp => resp.ok ? resp.text() : Promise.reject(`${resp.status}`))
                .then(async text => {
                    // We are connected!
                    // @ts-ignore
                    await filesystem.writeTokenAsync(text, instance);
                    navigate(`/`);
                })
                .catch((_) => {
                    setError(t("login.badLogin"));
                });

            } else { // No admin user, we need to create one
                if (!adminToken) {
                    setError(t("login.missingAdminToken"));
                    return;
                }

                fetch(`${instance}/api/invitation/createAdmin`,
                {
                    method: "POST",
                    headers: {
                        "Content-Type": "application/json"
                    },
                    body: JSON.stringify({
                        adminToken: adminToken,
                        isAdmin: true
                    })
                }
                )
                .then(resp => resp.ok ? resp.text() : Promise.reject(`${resp.status}`))
                .then(text => {
                    // We generated an invitation token, we redirect to the join page so the admon can create his account
                    navigate(`/join?token=${text}&instance=${encodeURI(instance)}`);
                })
                .catch((_) => {
                    setError(t("login.badAdminToken"));
                });
            }
        }
    }

    let instanceLoginForm: ReactNode;

    if (metadata === null) instanceLoginForm = <></>;
    else
    {
        if (metadata.isInit) {
            instanceLoginForm =
            <>
            <div className="field">
                <label className="label">{t("login.username")}</label>
                <div className="control">
                    <input className="input" name="username" type="text"
                        value={username} onChange={(e) => setUsername(e.target.value)}
                    />
                </div>
            </div>
            <div className="field">
                <label className="label">{t("login.password")}</label>
                <div className="control">
                    <input className="input" name="password" type="password" 
                    value={password} onChange={(e) => setPassword(e.target.value)}
                />
                </div>
            </div>
            </>
        }
        else
        {
            instanceLoginForm = 
                <div className="field">
                    <label className="label">{t("login.adminToken")}</label>
                    <div className="control">
                        <input className="input" name="password" type="text"
                        value={adminToken} onChange={(e) => setAdminToken(e.target.value)}
                        />
                    </div>
                </div>
        }
    }
    <>
    </>

    return (
    <div className="modal is-active">
        <div className="modal-background"></div>
        <div className="modal-content">
            <div className="field pb-6">
                <label className="label">{t("login.website")}</label>
                <div className="control">
                    <input className="input" name="instance" type="text" disabled={instance != ""}
                        value={instance} onChange={(e) => setInstance(e.target.value)}
                    />
                </div>
            </div>
            {instanceLoginForm}
            <p className={"help is-danger" + (error ? "" : " is-hidden")}>{error}</p>
            <div className="field is-grouped ">
                <p className="control is-expanded">
                    <input className="input is-primary is-fullwidth" type="submit" onClick={onLogin} />
                </p>
                <p className="control is-expanded">
                    <button className="button is-info is-fullwidth"
                        onClick={(e) => { navigate(`/join?instance=${encodeURI(instance)}`); }}
                    >{t("login.joinInvitation")}</button>
                </p>
                {
                    metadata?.allowsGuest ?? false ?
                    <p className="control is-expanded">
                        <button className="button is-fullwidth"
                            onClick={async (e) => {
                                // @ts-ignore
                                await filesystem.writeTokenAsync("guest", instance);
                                navigate("/"); 
                            }}
                        >{t("login.joinGuest")}</button>
                    </p>
                    : <></>
                }
            </div>
        </div>
    </div>
    )
}