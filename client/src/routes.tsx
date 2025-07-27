import * as React from "react";

import { Routes, Route, HashRouter, Navigate } from "react-router";
import { createRoot } from 'react-dom/client';
import LoginForm from "./form/login/LoginForm.js";
import NewUserForm from "./form/login/NewUserForm.js";
import AppForm from "./form/AppForm.js";

// @ts-ignore
filesystem.readTokenAsync().then((tokens) => {
    const root = createRoot(document.getElementById("root")!);
    root.render(
        <HashRouter>
            <Routes>
                <Route path="/" element={
                    Object.keys(tokens).length == 0
                    ? <Navigate to='/login' />
                    : <AppForm />
                } />
                <Route path="/join" element={<NewUserForm />} />
                <Route path="/login" element={<LoginForm />} />
            </Routes>
    </HashRouter>
    );
});