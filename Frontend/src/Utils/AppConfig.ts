const API = import.meta.env.VITE_API_URL ?? "/api";

class AppConfig {
  public readonly generateNoImageRecipeUrl = `${API}/generate-free-recipe-without-image`;
  public readonly generateFullRecipeUrl = `${API}/generate-recipe-with-image`;
  public readonly getAllRecipesUrl = `${API}/recipes/all`;
  public readonly getSingleRecipeUrl = `${API}/recipe/`;
  public readonly registerUrl = `${API}/register/`;
  public readonly loginUrl = `${API}/login/`;
}
export const appConfig = new AppConfig();