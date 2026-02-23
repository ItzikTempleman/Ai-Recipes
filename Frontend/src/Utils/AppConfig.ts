const API = import.meta.env.VITE_API_URL ?? "/api";

class AppConfig {
  public readonly generateNoImageRecipeUrl = `${API}/generate-free-recipe-without-image`;
  public readonly generateFullRecipeUrl = `${API}/generate-recipe-with-image`;
  public readonly getAllRecipesUrl = `${API}/recipes/all`;
  public readonly getSingleRecipeUrl = `${API}/recipe/`;

  public readonly generateImageForSavedRecipeUrl = `${API}/recipes/`;
  public readonly generateImagePreviewUrl = `${API}/recipes/generate-image-preview`;

  public readonly registerUrl = `${API}/register/`;
  public readonly loginUrl = `${API}/login/`;
  public readonly userUrl = `${API}/users/`;
  public readonly googleLoginUrl = `${API}/auth/google`;
  
   public readonly setUserPasswordUrl = `${API}/users/set-password`;

  public readonly likeUrl = `${API}/recipes/liked/`;
  public readonly shareTokenUrl = `${API}/recipes/share-token`;
  public readonly sharePdfUrl = `${API}/recipes/share`;
  public readonly forgotPasswordUrl = `${API}/auth/forgot-password`;
  public readonly resetPasswordUrl = `${API}/auth/reset-password`;
  public readonly verifyResetTokenUrl = `${API}/auth/verify-reset-token`;

public readonly askRecipeUrl = `${API}/recipe`;

public readonly dailyRecipesUrl = `${API}/daily-recipes`;

public readonly recipeUsageUrl = `${API}/usage/recipes`;

}

export const appConfig = new AppConfig();