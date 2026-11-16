import { createRoot } from "react-dom/client";
import { HashRouter } from "react-router-dom";
import App from "./App";
import { UserProvider } from "./user";
import { VerticalProvider } from "./vertical";
import "./styles.css";

createRoot(document.getElementById("root")!).render(
  <HashRouter><VerticalProvider><UserProvider><App /></UserProvider></VerticalProvider></HashRouter>
);
