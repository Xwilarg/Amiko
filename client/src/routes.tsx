import * as React from "react";

import { Routes, Route, HashRouter, Navigate } from "react-router";
import { createRoot } from 'react-dom/client';
import LoginForm from "./form/login/LoginForm.js";
import NewUserForm from "./form/login/NewUserForm.js";
import AppForm from "./form/AppForm.js";

function MainRoute() {
    const [tokens, setTokens] = React.useState<Record<string, string> | null>(null);
    
    React.useEffect(() => {
        // @ts-ignore
        filesystem.readTokenAsync().then(setTokens);
    }, []);

    if (tokens === null) {
        return <div className="container">Loading...</div>
    }

    if (Object.keys(tokens).length == 0) {
        return <Navigate to='/login' />
    }
    return <AppForm />;
}

// @ts-ignore
filesystem.readTokenAsync().then((tokens) => {
    const root = createRoot(document.getElementById("root")!);
    root.render(
        <HashRouter>
            <Routes>
                <Route path="/" element={<MainRoute />} />
                <Route path="/join" element={<NewUserForm />} />
                <Route path="/login" element={<LoginForm />} />
            </Routes>
    </HashRouter>
    );
});