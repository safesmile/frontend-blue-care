import { TooltipProvider } from "@/components/ui/tooltip";
import { ThemeProvider } from "@/contexts";
import { StrictMode } from "react";
import { createRoot } from "react-dom/client";
import { HelmetProvider } from "react-helmet-async";
import { BrowserRouter } from "react-router";
import App from "./App.tsx";
import "./index.css";

createRoot(document.getElementById("root")!).render(
  <StrictMode>
    <BrowserRouter>
      <ThemeProvider>
        <HelmetProvider>
          <TooltipProvider>
            <App />
          </TooltipProvider>
        </HelmetProvider>
      </ThemeProvider>
    </BrowserRouter>
  </StrictMode>,
);
