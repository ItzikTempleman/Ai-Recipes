import { IconButton, TextField, CircularProgress, InputAdornment, Box } from "@mui/material";
import SearchIcon from '@mui/icons-material/Search';
import { useForm } from "react-hook-form";
import "./HomeScreen.css";
import { useState } from "react";
import { useDispatch, useSelector } from "react-redux";
import CloseIcon from '@mui/icons-material/Close';
import { InputModel, RecipeState } from "../../../Models/RecipeModel";
import { useTitle } from "../../../Utils/Utils";
import { recipeService } from "../../../Services/RecipeService";
import { notify } from "../../../Utils/Notify";
import { ImageSwitch } from "../../UtilComponents/ImageSwitch/ImageSwitch";
import { resetGenerated } from "../../../Redux/RecipeSlice";
import { RecipeCard } from "../../RecipeCard/RecipeCard";

import img1 from "../../../Assets/images/img1.jpg";
import img2 from "../../../Assets/images/img2.jpg";
import img3 from "../../../Assets/images/img3.jpg";
import img4 from "../../../Assets/images/img4.jpg";
import img5 from "../../../Assets/images/img5.jpg";

const images = [img1, img2, img3, img4, img5];
type RecipeStateType = {
  recipes: RecipeState
};

export function HomeScreen() {
  useTitle("Home");

  const dispatch = useDispatch();

  const { register, handleSubmit, reset } = useForm<InputModel>();
  const [initialQuantity, setQuantity] = useState(1);
  const [hasImage, setHasImage] = useState(false);

  const { loading, current, error } = useSelector((s: RecipeStateType) => s.recipes);
  const recipe = current;

  async function send(recipeTitle: InputModel) {
    try {
      if (loading) return;
      await recipeService.generateRecipe(recipeTitle, hasImage, initialQuantity);
      reset();
    } catch (err: unknown) {
      notify.error(err);
    }
  }

  return (
    <div className="HomeScreen">

                <div className="WallpaperContainer">
        <div className="TopImg"><img src={images[0]}/></div>

        <div className="MidRow">
            <div className="LeftImg"><img src={images[1]}/></div>
            <div className="MidImg"><img src={images[2]}/></div>
            <div className="RightImg"><img src={images[3]}/></div>
        </div>

        <div className="BottomImg"><img src={images[4]}/></div>
    </div>

  
      <div className="SearchContainer">
        <ImageSwitch onChange={setHasImage} />
        <form onSubmit={handleSubmit(send)}>
          <div className="InputData">
            <TextField
              className="SearchTF"
              variant="outlined"
              size="small"
              fullWidth
              label="Generate recipe"
              placeholder="Generate recipe"
              {...register("query",
                {
                  required:
                    "title is required"
                })}
              disabled={loading}
              InputProps={{
                endAdornment: (
                  <InputAdornment position="end">
                    {loading ? (
                      <IconButton className="RoundedBtn" edge="end" disabled>
                        <Box><CircularProgress /></Box>
                      </IconButton>
                    ) : recipe ? (
                      <IconButton
                        className="RoundedBtn"
                        type="button"
                        edge="end"
                        aria-label="clear"
                        onClick={() => {
                          reset();
                          dispatch(resetGenerated());
                        }}
                      >
                        <CloseIcon />
                      </IconButton>
                    ) : (
                      <IconButton
                        className="RoundedBtn"
                        type="submit"
                        edge="end"
                        aria-label="search"
                        disabled={loading}
                      >
                        <SearchIcon />
                      </IconButton>
                    )}
                  </InputAdornment>
                )
              }}
            />
         
               <p>Servings</p>
            <select className="QuantitySelector" value={initialQuantity}
              onChange={(e) => setQuantity(Number(e.target.value))}
            >
              {
                [...Array(20)].map((_,i) => (
                  <option key={i+1} value={i+1}>{i+1}</option>
                ))
              }
            </select>
          </div>
         
        </form>
        {
          error && <div className="ErrorText">{error}</div>
        }
        {
          loading && (
            hasImage ?
              <h3 className="LoadingWithImage">Generating image, this will take a minute or two...</h3> :
              <h3 className="LoadingWithoutImage">Generating recipe without an image, this will take a few seconds...</h3>
          )
        }
      </div>
      {
        recipe && (
          <div className="CenterRow">
            <RecipeCard recipe={recipe} />
          </div>
        )
      }
    </div>
  );
}

