export type RecipeUsage = {
  scope: "user" | "visitor";
  used: number;
  limit: number | null;
  remaining: number | null;
  windowEndsAt: string | null;
  unlimited?: boolean;
};
