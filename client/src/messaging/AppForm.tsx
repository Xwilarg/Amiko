import { useState } from 'react'

export default function AppForm() {
    // @ts-ignore
    const [error, setError] = useState('');

    return (
    <div className="modal is-active">
        Welcome inside Amiko!
    </div>
    )
}