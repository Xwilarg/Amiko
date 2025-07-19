import { useState } from 'react'
export default function NewUserForm() {
    const [error, setError] = useState('');
    const [username, setUsername] = useState("");
    const [password, setPassword] = useState("");
    const [instance, setInstance] = useState<string>(() => {
        const url = new URL(window.location.href);
        var i = url.searchParams.get("instance");
        if (i) return decodeURI(i);
        // @ts-ignore
        return configuration.baseUrl() ?? ""
    });

    function onSubmit(e: React.MouseEvent<HTMLInputElement>) {
        setError("");

        if (!username) {
            setError("Please enter an username");
            return;
        }

        if (!password) {
            setError("Please enter a password");
            return;
        }

        fetch(`${instance}/api/invitation/createUser`, {
            method: "POST",
            headers: {
                "Content-Type": "application/json"
            },
            body: JSON.stringify({
                invitation: new URL(window.location.href).searchParams.get("token"),
                username: username,
                password: password
            })
        })
        .then(resp => resp.ok ? resp.text() : Promise.reject(`${resp.status}`))
        .then(_ => {
            window.location.replace(`/`);
        })
        .catch((_) => {
            setError("Invalid invitation link");
        });
    }
    
    return (
    <div className="modal is-active">
        <div className="modal-background"></div>
        <div className="modal-content">
            <h2 className="title">Welcome in Amiko!</h2>
            <h3 className="subtitle">Let's create your account!</h3>
            <div className="field pb-6 mt-6">
                <label className="label">Website</label>
                <div className="control">
                    <input className="input" name="instance" type="text" disabled={instance != ""}
                        value={instance} onChange={(e) => setInstance(e.target.value)}
                    />
                </div>
            </div>
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
            <p className={"help is-danger" + (error ? "" : " is-hidden")}>{error}</p>
            <div className="field pt-3">
                <input className="input is-primary" type="submit" onClick={onSubmit} />
            </div>
        </div>
    </div>
    )
}