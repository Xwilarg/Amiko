import * as React from "react";

import { createRoot } from 'react-dom/client';
import EmbedForm from "./form/EmbedForm.js";

// @ts-ignore
filesystem.readTokenAsync().then((tokens) => {
    const root = createRoot(document.getElementById("root")!);
    root.render(<EmbedForm />);
});