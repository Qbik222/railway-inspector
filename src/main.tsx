import { StrictMode } from "react";
import { createRoot } from "react-dom/client";
import { Provider } from "react-redux";
import { store } from "@/store";
import { App } from "@/App";
import "@/styles/global.css";

const rootEl = document.getElementById("root");
if (!rootEl) {
  throw new Error("Не знайдено елемент #root у index.html");
}

createRoot(rootEl).render(
  <StrictMode>
    <Provider store={store}>
      <App />
    </Provider>
  </StrictMode>,
);
