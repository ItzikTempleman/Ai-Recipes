import { IconButton, TextField } from "@mui/material";
import { useTitle } from "../../../Utils/UseTitle";
import { RecipeSwitch } from "../../Helpers/RecipeSwitch";
import SearchIcon from '@mui/icons-material/Search';
import { useForm } from "react-hook-form";

import "./Home.css";
import { RecipeTitleModel } from "../../../Models/RecipeModel";
import { notify } from "../../../Utils/Notify";
import { recipeService } from "../../../Services/RecipeService";

export function Home() {
    useTitle("Home");
    const { register, handleSubmit } = useForm<RecipeTitleModel>()



    async function send(recipeTitle: RecipeTitleModel) {
        try {
           const recipe= await recipeService.generateRecipe(recipeTitle, false);
        console.log("Generated:", recipe);
        } catch (err: unknown) {
            notify.error(err)
        }
    }

    return (
        <div className="Home">
            <h2 className="SearchTitle">Generate recipe</h2>
            <h4 className="SearchTitleBottomLine">(any language)</h4>
            <RecipeSwitch />

            <form className="SearchForm" onSubmit={handleSubmit(send)}>
                <TextField
                    label="Search"
                    placeholder="Search"
                    {...register("title", {
                        required: "title is required"
                    })} />
                <IconButton type="submit" >
                    <SearchIcon />
                </IconButton>
            </form>
        </div>
    );
}

