import { useNavigate, useParams } from "react-router-dom";
import { RecipeModel } from "../../Models/RecipeModel";
import { useEffect, useState } from "react";
import { recipeService } from "../../Services/RecipeService";
import { notify } from "../../Utils/Notify";
import { RecipeData } from "../RecipeData/RecipeData";

export function PdfScreen() {
    const { id } = useParams();
    const recipeId = Number(id);
    const navigate = useNavigate();
    const [recipe, setRecipe] = useState<RecipeModel>();

    useEffect(() => {
        if (!recipeId) {
            navigate("/home");
            return;
        }

        recipeService.getSingleRecipe(recipeId)
            .then((r) => setRecipe(r))
            .catch((err) => notify.error(err))
    }, [recipeId, navigate]);


    useEffect(() => {
        if (!recipe) return;
        const t = setTimeout(() => window.print(), 250);
        return () => clearTimeout(t);
    }, [recipe]);

    useEffect(() => {
        const handler = () => window.close();
        window.addEventListener("afterprint", handler);
        return () => window.removeEventListener("afterprint", handler);
    }, [])

   if(!recipe) return null;
   const imgSrc=(()=>{
    const url = (recipe.imageUrl ?? "").trim();
    return url &&url!=="undefined"? url: "";
   })();


   return(
        <div className="RecipePrintScreen">
      <div className="RecipePrintContainer">
        <RecipeData recipe={recipe} imageSrc={imgSrc} />
      </div>
    </div>
   )
}
