import { useTranslation } from "react-i18next";
import { DietaryRestrictions, GlutenRestrictions, LactoseRestrictions, SugarRestriction } from "../Models/RecipeModel";

type Filters = {
  sugarLevel: SugarRestriction;
  hasLactose: LactoseRestrictions;
  hasGluten: GlutenRestrictions;
  dietType: DietaryRestrictions;
};

export function FilterBadges({ filters, isRTL }: { filters?: Filters; isRTL: boolean }) {
  const { t } = useTranslation();
  if (!filters) return null;

  const sugarText: Record<number, string> = {
    [SugarRestriction.DEFAULT]: t("filters.sugar.regular"),
    [SugarRestriction.LOW]: t("filters.sugar.low"),
    [SugarRestriction.NONE]: t("filters.sugar.none"),
  };
  const lactoseText: Record<number, string> = {
    [LactoseRestrictions.DEFAULT]: t("filters.lactose.regular"),
    [LactoseRestrictions.NONE]: t("filters.lactose.none"),
  };
  const glutenText: Record<number, string> = {
    [GlutenRestrictions.DEFAULT]: t("filters.gluten.regular"),
    [GlutenRestrictions.NONE]: t("filters.gluten.none"),
  };
  const dietText: Record<number, string> = {
    [DietaryRestrictions.DEFAULT]: t("filters.diet.none"),
    [DietaryRestrictions.VEGAN]: t("filters.diet.vegan"),
    [DietaryRestrictions.KOSHER]: t("filters.diet.kosher"),
    [DietaryRestrictions.HALAL]: t("filters.diet.halal"),
  };

  const sugar = Number(filters.sugarLevel);
  const lactose = Number(filters.hasLactose);
  const gluten = Number(filters.hasGluten);
  const diet = Number(filters.dietType);

  const filterBadges: string[] = [];

  if (sugar === SugarRestriction.LOW || sugar === SugarRestriction.NONE) {
    filterBadges.push(sugarText[sugar]);
  }

  if (lactose === LactoseRestrictions.NONE) {
    filterBadges.push(lactoseText[lactose]);
  }

  if (gluten === GlutenRestrictions.NONE) {
    filterBadges.push(glutenText[gluten]);
  }

  if (
    diet === DietaryRestrictions.VEGAN ||
    diet === DietaryRestrictions.KOSHER ||
    diet === DietaryRestrictions.HALAL
  ) {
    filterBadges.push(dietText[diet]);
  }

  if (filterBadges.length === 0) return null;

  return (
    <div className="FiltersRow" dir={isRTL ? "rtl" : "ltr"}>
      {filterBadges.map((label) => (
        <span key={label} className="FilterBadge">{label}</span>
      ))}
    </div>
  );
}
