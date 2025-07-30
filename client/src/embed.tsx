import * as React from "react";

import { createRoot } from 'react-dom/client';
import EmbedForm from "./form/EmbedForm.js";
import { BrowserRouter, Route, Routes } from "react-router";

// @ts-ignore
filesystem.readTokenAsync().then((tokens) => {
    const root = createRoot(document.getElementById("root")!);
    root.render(
    <BrowserRouter>
        <Routes>
            <Route path="*" element={<EmbedForm/>}/>
        </Routes>
    </BrowserRouter>);
});