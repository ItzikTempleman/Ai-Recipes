import NoImage from "../Assets/images/No_Image_Available.jpg";
class AppConfig {
  public readonly generateNoImageRecipeUrl = "http://localhost:4000/api/generate-free-recipe-without-image";
  public readonly generateFullRecipeUrl = "http://localhost:4000/api/generate-recipe-with-image";
  public readonly getAllRecipesUrl = "http://localhost:4000/api/recipes/all";
   public noImage = NoImage;
}

export const appConfig = new AppConfig();
