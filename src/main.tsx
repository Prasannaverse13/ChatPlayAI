import React, { lazy, Suspense } from "react";
import { createRoot } from "react-dom/client";
import "./styles.css";
const Studio = lazy(() =>
  import("./App").then((module) => ({ default: module.App })),
);
const Landing = lazy(() => import("./Landing"));
const isLanding = location.pathname === "/";
createRoot(document.getElementById("root")!).render(
  <React.StrictMode>
    <Suspense fallback={<div className="startup">Opening ChatPlay…</div>}>
      {isLanding ? <Landing /> : <Studio />}
    </Suspense>
  </React.StrictMode>,
);
