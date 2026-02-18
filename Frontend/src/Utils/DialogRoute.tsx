import { useEffect } from "react";
import { useDispatch } from "react-redux";
import { useNavigate } from "react-router-dom";
import { resetGenerated } from "../Redux/RecipeSlice";
import { Dialog } from "@mui/material";
import { RecipeInputScreen } from "../Components/recipe-components/RecipeInputScreen/RecipeInputScreen";

export function GenerateRoute() {
    const navigate = useNavigate();

    const dispatch = useDispatch();

    useEffect(() => {
        dispatch(resetGenerated());
    }, [dispatch]);

    return (
<Dialog
  open
  onClose={() => navigate("/home")}
  fullWidth
  maxWidth="md"
  PaperProps={{ className: "GenerateDialogPaper" }}
>
  <RecipeInputScreen onDone={() => navigate("/home")} />
</Dialog>
    );
}

