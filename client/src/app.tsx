import * as React from "react";

import { createRoot } from 'react-dom/client';
import LoginForm from "./login/LoginForm";

import "./platform/browser.js";

const root = createRoot(document.getElementById("root")!);
root.render(
    <LoginForm/>
);