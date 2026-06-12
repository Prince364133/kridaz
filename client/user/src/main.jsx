import React from "react";
import ReactDOM from "react-dom/client";
import { Provider } from "react-redux";
import { PersistGate } from "redux-persist/integration/react";
import { store, persistor } from "./redux/store";
import { GoogleOAuthProvider } from "@react-oauth/google";
import { markRestored } from "./redux/slices/authSlice";
import { HelmetProvider } from "react-helmet-async";
import App from "./app/App";
import { ObservabilityProvider } from "./app/ObservabilityProvider";
import "./index.css";
import * as Sentry from "@sentry/react";
import { setupProductionGuards } from "./utils/productionGuards";

setupProductionGuards();

if (import.meta.env.VITE_SENTRY_DSN) {
  Sentry.init({
    dsn: import.meta.env.VITE_SENTRY_DSN,
    integrations: [
      Sentry.browserTracingIntegration(),
      Sentry.replayIntegration(),
    ],
    // Performance Monitoring
    tracesSampleRate: 0.1, 
    // Session Replay
    replaysSessionSampleRate: 0.1,
    replaysOnErrorSampleRate: 1.0,
    environment: import.meta.env.MODE,
  });
}

const GOOGLE_CLIENT_ID = import.meta.env.VITE_GOOGLE_CLIENT_ID;

import { AuthModalProvider } from "./context/AuthModalContext";


ReactDOM.createRoot(document.getElementById("root")).render(
  <React.StrictMode>
    <GoogleOAuthProvider clientId={GOOGLE_CLIENT_ID}>
      <Provider store={store}>
        <PersistGate 
          loading={null} 
          persistor={persistor}
          onBeforeLift={() => store.dispatch(markRestored())}
        >
          <HelmetProvider>
            <AuthModalProvider>
              <ObservabilityProvider>
                <App />
              </ObservabilityProvider>
            </AuthModalProvider>
          </HelmetProvider>
        </PersistGate>
      </Provider>
    </GoogleOAuthProvider>
  </React.StrictMode>
);
