import { createRoot } from "react-dom/client";
import App from "./App.tsx";
import "./globals.css";
import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import reportWebVitals from './reportWebVitals';

createRoot(document.getElementById("root")!).render(
  <>
    <App />
    <Toaster />
    <Sonner />
  </>
);

// Funzione per loggare i Web Vitals nella console
const logVitals = ({ name, value, delta }: { name: string; value: number; delta: number }) => {
  console.log(`[Web Vitals] ${name}:`, {
    value: value.toFixed(2),
    delta: delta.toFixed(2),
  });
};

reportWebVitals(logVitals);