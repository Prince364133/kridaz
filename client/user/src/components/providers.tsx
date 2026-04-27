
"use client";

import { Provider } from "react-redux";
import { store } from "@/lib/store";
import { Toaster } from "sonner";
import { ThemeProvider } from "./theme-provider"; // Import the local ThemeProvider component
import { AuthInitializer } from "./auth/AuthInitializer";

export function Providers({ children }: { children: React.ReactNode }) {
  return (
    <Provider store={store}>
      <AuthInitializer>
        <ThemeProvider attribute="class" defaultTheme="system" enableSystem disableTransitionOnChange>
            {children}
        </ThemeProvider>
      </AuthInitializer>
      <Toaster richColors />
    </Provider>
  );
}


