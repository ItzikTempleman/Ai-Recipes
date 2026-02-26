import { useState } from "react";
import type { MouseEvent } from "react";
import { ToggleButton, ToggleButtonGroup } from "@mui/material";
import { useTranslation } from "react-i18next";
import { DietaryRestrictions, GlutenRestrictions, LactoseRestrictions, SugarRestriction } from "../Models/RecipeModel";


type Option<T extends string> = {
    value: T;
    label: string;
};

type SingleToggleProps<T extends string> = {
    value: T;
    options: Option<T>[];
    onChange: (next: T) => void;
    className?: string;
    groupClassName?: string;
    buttonClassName?: string;
};

function SingleToggleGroup<T extends string>({
    value,
    options,
    onChange,
    className,
    groupClassName,
    buttonClassName,
}: SingleToggleProps<T>) {
    function handleChange(_: MouseEvent<HTMLElement>, selected: T | null) {
        if (!selected) return;
        onChange(selected);
    }

    return (
        <div className={className}>
            <ToggleButtonGroup
                value={value}
                exclusive
                onChange={handleChange}
                className={groupClassName}
            >
                {options.map((o) => (
                    <ToggleButton key={o.value} value={o.value} className={buttonClassName}>
                        {o.label}
                    </ToggleButton>
                ))}
            </ToggleButtonGroup>
        </div>
    );
}



type DietTypeProp = {
    onDietSelect: (dietType: DietaryRestrictions) => void;
};

type DietMode = "Regular" | "Vegan" | "Kosher";

export function DietaryFilter({ onDietSelect }: DietTypeProp) {
    const { t } = useTranslation();
    const [dietMode, setDietMode] = useState<DietMode>("Regular");

    function toDietRestriction(mode: DietMode): DietaryRestrictions {
        switch (mode) {
            case "Vegan":
                return DietaryRestrictions.VEGAN;
            case "Kosher":
                return DietaryRestrictions.KOSHER;
            default:
                return DietaryRestrictions.DEFAULT;
        }
    }

    return (
        <SingleToggleGroup<DietMode>
            value={dietMode}
            onChange={(next) => {
                setDietMode(next);
                onDietSelect(toDietRestriction(next));
            }}
            options={[
                { value: "Regular", label: t("filters.diet.none") },
                { value: "Vegan", label: t("filters.diet.vegan") },
                { value: "Kosher", label: t("filters.diet.kosher") },
            ]}
        />
    );
}



type GlutenProp = {
    onChange: (containsGluten: GlutenRestrictions) => void;
};

type GlutenMode = "Regular Gluten" | "No Gluten";

export function GlutenFilter({ onChange }: GlutenProp) {
    const { t } = useTranslation();
    const [glutenMode, setGlutenMode] = useState<GlutenMode>("Regular Gluten");

    return (
        <SingleToggleGroup<GlutenMode>
            value={glutenMode}
            onChange={(next) => {
                setGlutenMode(next);
                onChange(next === "No Gluten" ? GlutenRestrictions.NONE : GlutenRestrictions.DEFAULT);
            }}
            options={[
                { value: "Regular Gluten", label: t("filters.gluten.regular") },
                { value: "No Gluten", label: t("filters.gluten.none") },
            ]}
        />
    );
}



type LactoseProp = {
    onChange: (containsLactose: LactoseRestrictions) => void;
};

type LactoseMode = "Regular milk" | "No Lactose";

export function LactoseFilter({ onChange }: LactoseProp) {
    const { t } = useTranslation();
    const [lactoseMode, setLactoseMode] = useState<LactoseMode>("Regular milk");

    return (
        <SingleToggleGroup<LactoseMode>
            value={lactoseMode}
            onChange={(next) => {
                setLactoseMode(next);
                onChange(next === "No Lactose" ? LactoseRestrictions.NONE : LactoseRestrictions.DEFAULT);
            }}
            options={[
                { value: "Regular milk", label: t("filters.lactose.regular") },
                { value: "No Lactose", label: t("filters.lactose.none") },
            ]}
        />
    );
}



type SugarLevelProp = {
    onSugarLevelSelect: (sugarLevel: SugarRestriction) => void;
};

type SugarMode = "Regular sugar" | "Low sugar" | "No sugar";

export function SugarFilter({ onSugarLevelSelect }: SugarLevelProp) {
    const { t } = useTranslation();
    const [sugarMode, setSugarMode] = useState<SugarMode>("Regular sugar");

    function toSugarRestriction(mode: SugarMode): SugarRestriction {
        switch (mode) {
            case "Low sugar":
                return SugarRestriction.LOW;
            case "No sugar":
                return SugarRestriction.NONE;
            default:
                return SugarRestriction.DEFAULT;
        }
    }

    return (
        <SingleToggleGroup<SugarMode>
            value={sugarMode}
            className="SugarFilter"
            groupClassName="FilterToggleGroup"
            buttonClassName="ToggleBtn"
            onChange={(next) => {
                setSugarMode(next);
                onSugarLevelSelect(toSugarRestriction(next));
            }}
            options={[
                { value: "Regular sugar", label: t("filters.sugar.regular") },
                { value: "Low sugar", label: t("filters.sugar.low") },
                { value: "No sugar", label: t("filters.sugar.none") },
            ]}
        />
    );
}