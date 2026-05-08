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

console.log("main.jsx: Initializing React root...");
ReactDOM.createRoot(document.getElementById("root")).render(
  <React.StrictMode>
    <GoogleOAuthProvider clientId={import.meta.env.VITE_GOOGLE_CLIENT_ID}>
      <Provider store={store}>
        <PersistGate 
          loading={
            <div className="fixed inset-0 bg-black flex items-center justify-center">
              <div className="w-8 h-8 border-2 border-[#84CC16] border-t-transparent rounded-full animate-spin"></div>
            </div>
          } 
          persistor={persistor}
        >
          <SocketProvider>
            <App />
            <Toaster position="bottom-center" duration={500} />
          </SocketProvider>
        </PersistGate>
      </Provider>
    </GoogleOAuthProvider>
  </React.StrictMode>
);
