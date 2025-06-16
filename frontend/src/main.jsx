import React from "react";
import ReactDOM from "react-dom/client";
import "./index.css"; // ✅ Add this line to apply global styles
import App from "./App";
import { CartProvider } from "./context/CartContext.jsx";

ReactDOM.createRoot(document.getElementById("root")).render(
  <React.StrictMode>
    <CartProvider>
      <App />
    </CartProvider>
  </React.StrictMode>
);
