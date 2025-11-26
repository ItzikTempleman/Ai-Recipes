import { Header } from "../../Header/Header";
import { Routing } from "../Routing/Routing";
import "./MainLayout.css";
import img1 from "../../../Assets/images/img1.jpg";
import img2 from "../../../Assets/images/img2.jpg";
import img3 from "../../../Assets/images/img3.jpg";
import img4 from "../../../Assets/images/img4.jpg";
import img5 from "../../../Assets/images/img5.jpg";

const images = [img1, img2, img3, img4, img5];

export function MainLayout() {
    return (

        
        <div className="MainLayout">

                <div className="WallpaperContainer">
        <div className="TopImg"><img src={images[0]}/></div>

        <div className="MidRow">
            <div className="LeftImg"><img src={images[1]}/></div>
            <div className="MidImg"><img src={images[2]}/></div>
            <div className="RightImg"><img src={images[3]}/></div>
        </div>

        <div className="BottomImg"><img src={images[4]}/></div>
    </div>

            <header>
                <Header/>
            </header>
            <main>
                <Routing/>
            </main>
        </div>
    );
}
