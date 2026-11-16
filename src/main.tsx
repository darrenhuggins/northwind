import { createRoot } from "react-dom/client";
import { HashRouter } from "react-router-dom";
import App from "./App";
import { UserProvider } from "./user";
import "./styles.css";

createRoot(document.getElementById("root")!).render(
  <HashRouter><UserProvider><App /></UserProvider></HashRouter>
);
