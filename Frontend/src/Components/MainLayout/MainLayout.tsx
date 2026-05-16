import { useLocation } from "react-router-dom";
import { Header } from "../Header/Header";
import { Routing } from "../Routing/Routing";
import { useLanguage } from "../../Utils/SetLanguage";
import recipeImage from "../../Assets/images/home-screen-image.png";
import "./MainLayout.css";

export function MainLayout() {
  const { pathname } = useLocation();
  const { isRtl } = useLanguage();

  const hideHeader = pathname === "/404";
  const showHomeImage = pathname === "/home" || pathname === "/";

  return (
    <div className="MainLayout">
      {showHomeImage && (
        <div className={`LayoutHomeImageWrapper ${isRtl ? "rtl" : "ltr"}`}>
          <img className="LayoutHomeImage" src={recipeImage} />
        </div>
      )}

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