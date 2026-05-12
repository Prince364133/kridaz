import React from 'react'
import ReactDOM from 'react-dom/client'
import './index.css'
import { Provider } from 'react-redux'
import {store, persistor} from "./redux/store";
import { PersistGate } from 'redux-persist/integration/react'
import { RouterProvider } from 'react-router-dom'
import router from "./router"
import { Toaster } from 'react-hot-toast'
import App from './App'
import ErrorBoundary from "./components/common/ErrorBoundary";
import { GoogleOAuthProvider } from '@react-oauth/google';


ReactDOM.createRoot(document.getElementById("root")).render(
 <React.StrictMode>
 <GoogleOAuthProvider clientId={import.meta.env.VITE_GOOGLE_CLIENT_ID}>
 <Provider store={store}>
 <PersistGate loading={null} persistor={persistor}>
 <ErrorBoundary>
 <App />
 <Toaster position="bottom-center" duration={500} />
 </ErrorBoundary>
 </PersistGate>
 </Provider>
 </GoogleOAuthProvider>
 </React.StrictMode>
);
