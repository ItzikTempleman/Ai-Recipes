import { io, Socket } from "socket.io-client";
import { appConfig } from "../Utils/AppConfig";
import { store } from "../Redux/Store";
import {
    addRecipe,
    setCurrent,
    setError,
    setIsLoading,
} from "../Redux/RecipeSlice";
import { RecipeModel } from "../Models/RecipeModel";
import { usageService } from "./UsageService";

export const RecipeSocketEvents = {
    SENDER_IS_FRONTEND: {
        START_GENERATING_RECIPE: "recipe-generation-started",
        WATCH_RECIPE_GENERATION: "recipe-generation-watch",
        CANCEL_RECIPE_GENERATION: "recipe-generation-cancelled",
    },

    SENDER_IS_BACKEND: {
        ACCEPTED_RECIPE_GENERATION: "recipe-generation-accepted",
        UPDATES_RECIPE_GENERATION_STATUS: "recipe-generation-status",
        COMPLETES_RECIPE_GENERATION: "recipe-generation-done",
        FAILS_RECIPE_GENERATION: "recipe-generation-failed",
    },
};

type GeneratePayload = {
    query: string;
    quantity: number;
    hasImage: boolean;
    sugarRestriction?: number;
    lactoseRestriction?: number;
    glutenRestriction?: number;
    dietaryRestriction?: number;
    caloryRestrictions?: number;
    queryRestrictions?: string[];
    visitorId?: string;
};

class RecipeSocketService {
    private socket: Socket | null = null;

    public connect(): void {
        if (this.socket) return;

        const token = localStorage.getItem("token") ?? "";

        this.socket = io(appConfig.socketUrl, {
            withCredentials: true,
            reconnection: true,
            reconnectionAttempts: Infinity,
            reconnectionDelay: 1000,
            reconnectionDelayMax: 5000,
            auth: {
                token,
                visitorId: localStorage.getItem("recipeVisitorId") ?? "",
            },
        });

        this.socket.on("connect", () => {
            const activeJobId = localStorage.getItem("activeRecipeJobId");

            if (activeJobId) {
                store.dispatch(setIsLoading(true));

                this.socket?.emit(
                    RecipeSocketEvents.SENDER_IS_FRONTEND.WATCH_RECIPE_GENERATION,
                    { jobId: activeJobId }
                );
            }
        });

        this.socket.on(
            RecipeSocketEvents.SENDER_IS_BACKEND.ACCEPTED_RECIPE_GENERATION,
            ({ jobId }: { jobId: string }) => {
                localStorage.setItem("activeRecipeJobId", jobId);
                store.dispatch(setIsLoading(true));
            }
        );

        this.socket.on(
            RecipeSocketEvents.SENDER_IS_BACKEND.UPDATES_RECIPE_GENERATION_STATUS,
            () => {
                store.dispatch(setIsLoading(true));
            }
        );

        this.socket.on(
            RecipeSocketEvents.SENDER_IS_BACKEND.COMPLETES_RECIPE_GENERATION,
            ({ recipe }: { jobId: string; recipe: RecipeModel }) => {
                localStorage.removeItem("activeRecipeJobId");

                store.dispatch(setCurrent(recipe));
                store.dispatch(setIsLoading(false));

                const token = localStorage.getItem("token");

                if (token && recipe?.id) {
                    store.dispatch(addRecipe(recipe));
                }

                usageService.refreshRecipeUsage();
            }
        );

        this.socket.on(
            RecipeSocketEvents.SENDER_IS_BACKEND.FAILS_RECIPE_GENERATION,
            ({ error }: { jobId: string; error: string }) => {
                localStorage.removeItem("activeRecipeJobId");

                if (error !== "RECIPE_GENERATION_CANCELLED") {
                    store.dispatch(setError(error));
                }

                store.dispatch(setIsLoading(false));
            }
        );
    }

    public generateRecipe(payload: GeneratePayload): void {
        this.connect();

        store.dispatch(setIsLoading(true));
        store.dispatch(setError(undefined));

        this.socket?.emit(
            RecipeSocketEvents.SENDER_IS_FRONTEND.START_GENERATING_RECIPE,
            {
                ...payload,
                visitorId: localStorage.getItem("recipeVisitorId") ?? "",
            }
        );
    }

    public cancelRecipeGeneration(): void {
        const activeJobId = localStorage.getItem("activeRecipeJobId");

        if (activeJobId) {
            this.socket?.emit(
                RecipeSocketEvents.SENDER_IS_FRONTEND.CANCEL_RECIPE_GENERATION,
                { jobId: activeJobId }
            );
        }

        localStorage.removeItem("activeRecipeJobId");
        store.dispatch(setIsLoading(false));
        store.dispatch(setError(undefined));
    }

    public reconnectWithLatestAuth(): void {
        this.socket?.disconnect();
        this.socket = null;
        this.connect();
    }

    public disconnect(): void {
        this.socket?.disconnect();
        this.socket = null;
    }
}

export const recipeSocketService = new RecipeSocketService();