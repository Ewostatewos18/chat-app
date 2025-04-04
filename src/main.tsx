import React from "react";
import ReactDOM from "react-dom/client";
import App from "./components/chat";
import "./index.css"; // Optional if you're using Tailwind CSS

ReactDOM.createRoot(document.getElementById("root")!).render(
  <React.StrictMode>
    <App />
  </React.StrictMode>
);
