import * as React from "react";
import "./platform/browser.js";

import { BrowserRouter, Routes, Route } from "react-router";
import { createRoot } from 'react-dom/client';
import LoginForm from "./login/LoginForm.js";
import NewUserForm from "./login/NewUserForm.js";
import AppForm from "./messaging/AppForm.js";

const root = createRoot(document.getElementById("root")!);
root.render(
    <BrowserRouter>
        <Routes>
            <Route path="/" element={
                // @ts-ignore
                Object.keys(await filesystem.readTokenAsync()).length == 0
                ? <LoginForm />
                : <AppForm />
            } />
            <Route path="/join" element={<NewUserForm />} />
        </Routes>
  </BrowserRouter>
);