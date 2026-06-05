import React from "react";
import ReactDOM from "react-dom/client";
import { MantineProvider, localStorageColorSchemeManager } from "@mantine/core";
import "@mantine/core/styles.css";
import "./index.css";
import App from "./App";

const colorSchemeManager = localStorageColorSchemeManager({ key: "privacy-first-scheme" });

ReactDOM.createRoot(document.getElementById("root")!).render(
  <React.StrictMode>
    <MantineProvider colorSchemeManager={colorSchemeManager} defaultColorScheme="light">
      <App />
    </MantineProvider>
  </React.StrictMode>
);
