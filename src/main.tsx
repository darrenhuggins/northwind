import { createRoot } from "react-dom/client";
import { HashRouter } from "react-router-dom";
import App from "./App";
import { UserProvider } from "./user";
import "./styles.css";

// Boot Novus once with an anonymous visitor. The signed-in persona is identified in UserProvider.
pendo.initialize({ visitor: { id: "" } });

createRoot(document.getElementById("root")!).render(
  <HashRouter><UserProvider><App /></UserProvider></HashRouter>
);
