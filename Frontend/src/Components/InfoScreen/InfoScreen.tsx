
import { useParams } from "react-router-dom";
import { useTitle } from "../../Utils/UseTitle";
import "./InfoScreen.css";

export function InfoScreen() {
   useTitle("Info");
  const params = useParams();
  const recipeId = Number(params.id);


    return (
        <div className="InfoScreen">

        </div>
    );
}

