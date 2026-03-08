import { suggestionsService } from "../services/suggestions-service";

export async function seedSuggestionRecipeIfNeeded(): Promise<void> {
  await suggestionsService.generateOnce();
}