import React from "react";
import ReactDOM from "react-dom/client";
import App from "./App.jsx";
import "./index.css";
import { Provider } from "react-redux";
import { store, persistor } from "./redux/store";
import { PersistGate } from "redux-persist/integration/react";
import { Toaster } from "react-hot-toast";
import { GoogleOAuthProvider } from "@react-oauth/google";
import { SocketProvider } from "./context/SocketContext";

const GOOGLE_CLIENT_ID = import.meta.env.VITE_GOOGLE_CLIENT_ID;

console.log("DEBUG: main.jsx starting...");
console.log("DEBUG: Google Client ID exists:", !!GOOGLE_CLIENT_ID);

if (!GOOGLE_CLIENT_ID) {
  console.warn("WARNING: VITE_GOOGLE_CLIENT_ID is missing from .env file!");
}

const rootElement = document.getElementById("root");
if (!rootElement) {
  console.error("FATAL: Root element not found!");
} else {
  console.log("DEBUG: Root element found, mounting app...");
  ReactDOM.createRoot(rootElement).render(
    <React.StrictMode>
      {GOOGLE_CLIENT_ID ? (
        <GoogleOAuthProvider clientId={GOOGLE_CLIENT_ID}>
          <Provider store={store}>
            <PersistGate loading={null} persistor={persistor}>
              <SocketProvider>
                <App />
                <Toaster position="bottom-center" duration={500} />
              </SocketProvider>
            </PersistGate>
          </Provider>
        </GoogleOAuthProvider>
      ) : (
        <Provider store={store}>
          <PersistGate loading={null} persistor={persistor}>
            <SocketProvider>
              <App />
              <Toaster position="bottom-center" duration={500} />
            </SocketProvider>
          </PersistGate>
        </Provider>
      )}
    </React.StrictMode>
  );
}
