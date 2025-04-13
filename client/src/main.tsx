import { createRoot } from "react-dom/client";
import App from "./App";
import "./index.css";
import { createContext } from "react";

export const AuthContext = createContext<{
  isAuthenticated: boolean;
  user: any | null;
  login: (user: any) => void;
  logout: () => void;
}>({
  isAuthenticated: false,
  user: null,
  login: () => {},
  logout: () => {},
});

createRoot(document.getElementById("root")!).render(<App />);
