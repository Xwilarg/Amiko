import { useEffect, useState, type ReactNode } from 'react'
import type Metadata from '../../model/Metadata';

export default function LoginForm() {
    // @ts-ignore
    const [instance, setInstance] = useState<string>(`${configuration.baseUrl() ?? ""}`);
    const [metadata, setMetadata] = useState<Metadata | null>(null);
    const [adminToken, setAdminToken] = useState("");
    const [username, setUsername] = useState("");
    const [password, setPassword] = useState("");
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

        if (metadata === null) { // Metadata not set, we need to connect to a backend
            if (!instance) {
                setError("Please enter your Amiko server");
                return;
            }

            checkInstance();
        } else {
            if (metadata.isInit) { // Metadata are set and the instance already have an admin user
                if (!username) {
                    setError("Please enter an username");
                    return;
                }

                if (!password) {
                    setError("Please enter a password");
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
                    window.location.replace(`/`);
                })
                .catch((_) => {
                    setError("Invalid username/password combination");
                });

            } else { // No admin user, we need to create one
                if (!adminToken) {
                    setError("Please enter your admin token");
                    return;
                }

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
                    // We generated an invitation token, we redirect to the join page so the admon can create his account
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
                    <input className="input" name="username" type="text"
                        value={username} onChange={(e) => setUsername(e.target.value)}
                    />
                </div>
            </div>
            <div className="field">
                <label className="label">Password</label>
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