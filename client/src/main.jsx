import React from "react";
import { createRoot } from "react-dom/client";
import { BrowserRouter } from "react-router-dom";
import App from "./App.jsx";
import "./index.css";
import { AuthProvider } from "./auth/AuthContext";  // ⬅️ tilføj

createRoot(document.getElementById("root")).render(
  <React.StrictMode>
    <BrowserRouter>
      <AuthProvider>    {/* ⬅️ wrap app */}
        <App />
      </AuthProvider>
    </BrowserRouter>
  </React.StrictMode>
);
