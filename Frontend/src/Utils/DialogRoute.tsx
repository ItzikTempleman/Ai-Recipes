import { useEffect } from "react";
import { useDispatch } from "react-redux";
import { useNavigate } from "react-router-dom";
import { resetGenerated } from "../Redux/RecipeSlice";
import { Dialog } from "@mui/material";
import { RecipeInputDialog } from "../Components/recipe-components/RecipeInputDialog/RecipeInputDialog";

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
  <RecipeInputDialog onDone={() => navigate("/home")} />
</Dialog>
    );
}

