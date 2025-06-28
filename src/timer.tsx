import React from "react";
import ReactDOM from "react-dom/client";
import TimerApp from "./TimerApp";
import "./app.css";

ReactDOM.createRoot(document.getElementById("timer-root") as HTMLElement).render(
  <React.StrictMode>
    <TimerApp />
  </React.StrictMode>,
);