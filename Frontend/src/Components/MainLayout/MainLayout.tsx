import { useLocation } from "react-router-dom";
import { Header } from "../Header/Header";
import { Routing } from "../Routing/Routing";
import "./MainLayout.css";

export function MainLayout() {
  const { pathname } = useLocation();
  const hideHeader = pathname === "/404";

  return (
    <div className="MainLayout">
      {!hideHeader && (
        <header>
          <Header />
        </header>
      )}
      <main>
        <Routing />
      </main>
    </div>
  );
}