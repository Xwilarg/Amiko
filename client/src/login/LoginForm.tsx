import { useEffect, useState, type ReactNode } from 'react'
import type Metadata from '../model/Metadata';

export default function LoginForm() {
    // @ts-ignore
    const [instance, setInstance] = useState<string>(`${configuration.baseUrl() ?? ""}`);
    const [metadata, setMetadata] = useState<Metadata | null>(null);
    const [adminToken, setAdminToken] = useState("");
    const [error, setError] = useState('');

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
                setError("There is no Amiko instance found at this address");
            }
            else
            {
                setError("Failed to connect to Amiko");
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

        if (metadata === null) {
            checkInstance();
        } else {
            if (metadata.isInit) {

            } else {
                fetch(`${instance}/api/invitation/create`,
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
                    window.location.replace(`/join?token=${text}&instance=${encodeURI(instance)}`);
                })
                .catch((_) => {
                    setError("Invalid admin password");
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
                    <label className="label">Username</label>
                    <div className="control">
                        <input className="input" name="username" type="text" />
                    </div>
                </div>
                <div className="field">
                    <label className="label">Password</label>
                    <div className="control">
                        <input className="input" name="password" type="password" />
                    </div>
                </div>
            </>
        }
        else
        {
            instanceLoginForm = 
                <div className="field">
                    <label className="label">Enter your admin password (config.json at your backend root)</label>
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
                <label className="label">Website</label>
                <div className="control">
                    <input className="input" name="instance" type="text" disabled={instance != ""}
                        value={instance} onChange={(e) => setInstance(e.target.value)}
                    />
                </div>
            </div>
            {instanceLoginForm}
            <p className={"help is-danger" + (error ? "" : " is-hidden")}>{error}</p>
            <div className="field pt-3">
                <input className="input is-primary" type="submit" onClick={onLogin} />
            </div>
        </div>
    </div>
    )
}