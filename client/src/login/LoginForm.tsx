import { useEffect, useState } from 'react'

export default function LoginForm() {
    // @ts-ignore
    const [instance, setInstance] = useState<string | null>(`${configuration.baseUrl()}`);
    const [metadata, setMetadata] = useState<any | null>(null);
    const [password, setPassword] = useState('');

    useEffect(() => {
        if (instance !== null)
        {
            fetch(`${instance}/api/`)
            .then(resp => resp.ok ? resp.json() : Promise.reject(`${resp.status}`))
            .then(json => {
                setMetadata(json);
            })
            .catch((err) => {
                console.error(`Failed to GET ${instance}/api/`);
                setInstance(null);
            });
        }
    }, []);

    let instanceLoginForm =
    metadata === null ? <></> :
    <>
        <div className="field">
            <label className="label">Username</label>
            <div className="control">
                <input className="input" name="username" type="text" />
            </div>
        </div>
    </>

    return (
    <div className="modal is-active">
        <div className="modal-background"></div>
        <div className="modal-content">
            <div className="field">
                <label className="label">Name</label>
                <div className="control">
                    <input className="input" name="instance" type="text" disabled={instance != null} value={instance ?? ""} />
                </div>
            </div>
            {instanceLoginForm}
        </div>
    </div>
    )
}