import * as React from "react";
import "./platform/browser.js";

import { BrowserRouter, Routes, Route } from "react-router";
import { createRoot } from 'react-dom/client';
import LoginForm from "./login/LoginForm";
import NewUserForm from "./login/NewUserForm.js";

const root = createRoot(document.getElementById("root")!);
root.render(
    <BrowserRouter>
        <Routes>
            <Route path="/" element={<LoginForm />} />
            <Route path="/join" element={<NewUserForm />} />
        </Routes>
  </BrowserRouter>
);