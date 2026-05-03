import { FullRecipeModel } from "../models/recipe-model";
import { Server as HttpServer } from "http";
import { Server as SocketServer, Socket } from "socket.io";
import { appConfig } from "../utils/app-config";
import { v4 as uuidv4 } from "uuid";
import { UserModel } from "../models/user-model";
import jwt from "jsonwebtoken";
import { consumeRecipeUsage, refundRecipeUsage, UsageConsumer } from "../utils/recipe-usage-helper";
import { InputModel } from "../models/input-model";
import { recipeService } from "./recipe-service";
import { generateImage } from "./image-service";

export const RecipeSocketEvents = {
    SENDER_IS_FRONTEND: {
        START_GENERATING_RECIPE: "recipe-generation-started",
        WATCH_RECIPE_GENERATION: "recipe-generation-watch"
    },
    SENDER_IS_BACKEND: {
        ACCEPTED_RECIPE_GENERATION: "recipe-generation-accepted",
        UPDATES_RECIPE_GENERATION_STATUS: "recipe-generation-status",
        COMPLETES_RECIPE_GENERATION: "recipe-generation-done",
        FAILS_RECIPE_GENERATION: "recipe-generation-failed"
    }
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

type JobState = {
    status: "running" | "done" | "failed";
    recipe?: FullRecipeModel;
    error?: string;
};

class RecipeGenerationSocketService {
    private recipeSocketServer: SocketServer | null = null;

    /* jobs is a map that stores each recipe generation (job) in memory and links it to a unique ID */
    private jobs = new Map<string, JobState>();

    public init(httpServer: HttpServer): void {
        this.recipeSocketServer = new SocketServer(httpServer, {
            cors: {
                origin: appConfig.frontendBaseUrl, credentials: true
            }
        });

        this.recipeSocketServer.on(
            "connection", (socket: Socket) => {
                socket.on(RecipeSocketEvents.SENDER_IS_FRONTEND.START_GENERATING_RECIPE, async (payload: GeneratePayload) => {
                    const jobId = uuidv4();
                    this.jobs.set(jobId, { status: "running" });
                    socket.join(jobId);

                    socket.emit(RecipeSocketEvents.SENDER_IS_BACKEND.ACCEPTED_RECIPE_GENERATION, { jobId });
                    socket.emit(RecipeSocketEvents.SENDER_IS_BACKEND.UPDATES_RECIPE_GENERATION_STATUS, { jobId, status: "GENERATING_RECIPE" });

                    this.runGenerationJob(jobId, socket, payload);
                });

                socket.on(RecipeSocketEvents.SENDER_IS_FRONTEND.WATCH_RECIPE_GENERATION, ({ jobId }: { jobId: string }) => {
                    if (!jobId) return;
                    socket.join(jobId);

                    const job = this.jobs.get(jobId);
                    if (!job) return;

                    /* If the frontend reconnects and asks about this job, tell it the recipe is still being generated */
                    if (job.status === "running") {
                        socket.emit(RecipeSocketEvents.SENDER_IS_BACKEND.UPDATES_RECIPE_GENERATION_STATUS, { jobId, status: "GENERATING_RECIPE" });
                    };
                    if (job.status === "done") {
                        socket.emit(RecipeSocketEvents.SENDER_IS_BACKEND.COMPLETES_RECIPE_GENERATION, { jobId, recipe: job.recipe, });
                    };
                    if (job.status === "failed") {
                        socket.emit(RecipeSocketEvents.SENDER_IS_BACKEND.FAILS_RECIPE_GENERATION, { jobId, error: job.error });
                    };
                })
            });
    };

    private async runGenerationJob(jobId: string, socket: Socket, payload: GeneratePayload): Promise<void> {
        let consumed: UsageConsumer = "none";
        const user = this.getUserFromSocket(socket);
        const visitorId = payload.visitorId || socket.handshake.auth?.visitorId || socket.id;


        try {
            const quantity = payload.quantity || 1;

     const inputModel = new InputModel({
        query: payload.query,
        quantity,
        sugarRestriction: payload.sugarRestriction,
        lactoseRestrictions: payload.lactoseRestriction,
        glutenRestrictions: payload.glutenRestriction,
        dietaryRestrictions: payload.dietaryRestriction,
        caloryRestrictions: payload.caloryRestrictions,
        queryRestrictions: payload.queryRestrictions ?? [],
      } as InputModel);

consumed = await consumeRecipeUsage(user, visitorId);

     this.recipeSocketServer?.to(jobId).emit(RecipeSocketEvents.SENDER_IS_BACKEND.UPDATES_RECIPE_GENERATION_STATUS, {
        jobId,
         status: "GENERATING_RECIPE"
      });

      const data = await recipeService.generateInstructions(inputModel, payload.hasImage);

      let imageUrl: string | undefined = undefined;
      let imageName: string | undefined = undefined;

      if (payload.hasImage) {
        this.recipeSocketServer?.to(jobId).emit(RecipeSocketEvents.SENDER_IS_BACKEND.UPDATES_RECIPE_GENERATION_STATUS, {
          jobId,
          status: "GENERATING_IMAGE"
        });

        const image = await generateImage({
          query: inputModel.query,
          quantity,
          sugarRestriction: inputModel.sugarRestriction,
          lactoseRestrictions: inputModel.lactoseRestrictions,
          glutenRestrictions: inputModel.glutenRestrictions,
          dietaryRestrictions: inputModel.dietaryRestrictions,
          caloryRestrictions: inputModel.caloryRestrictions,
          queryRestrictions: inputModel.queryRestrictions,
          title: data.title,
          description: data.description,
          ingredients: data.ingredients,
          instructions: data.instructions,
          categories: data.categories,
        });

        imageUrl = image.url;
        imageName = image.fileName;
      }

      const recipe = new FullRecipeModel({
        title: data.title,
        amountOfServings: quantity,
        description: data.description,
        popularity: data.popularity,
        data: {
          ingredients: data.ingredients,
          instructions: data.instructions,
          categories: data.categories,
        },
        totalSugar: data.totalSugar,
        totalProtein: data.totalProtein,
        healthLevel: data.healthLevel,
        calories: data.calories,
        sugarRestriction: data.sugarRestriction,
        lactoseRestrictions: data.lactoseRestrictions,
        glutenRestrictions: data.glutenRestrictions,
        dietaryRestrictions: data.dietaryRestrictions,
        caloryRestrictions: data.caloryRestrictions,
        queryRestrictions: data.queryRestrictions,
        prepTime: data.prepTime,
        difficultyLevel: data.difficultyLevel,
        countryOfOrigin: data.countryOfOrigin,
        image: undefined,
        imageUrl,
        imageName,
        userId: user?.id,
        categories: data.categories,
      } as FullRecipeModel);

      const finalRecipe = user?.id
        ? await recipeService.saveRecipe(recipe, user.id)
        : recipe;

      this.jobs.set(jobId, {
        status: "done",
        recipe: finalRecipe,
      });

      this.recipeSocketServer?.to(jobId).emit(RecipeSocketEvents.SENDER_IS_BACKEND.COMPLETES_RECIPE_GENERATION, {
        jobId,
        recipe: finalRecipe,
      });
    
        }
        catch (err: any) {
            try {
                await refundRecipeUsage(consumed, user, visitorId);
            } catch {};

           const error = "RECIPE_GENERATION_FAILED";

            this.jobs.set(jobId, {
                status: "failed",
                error
            });

            this.recipeSocketServer?.to(jobId).emit(RecipeSocketEvents.SENDER_IS_BACKEND.FAILS_RECIPE_GENERATION, {
                jobId,
                error,
            });
        }
    }

    private getUserFromSocket(socket: Socket): UserModel | undefined {
        try {
            const token = socket.handshake.auth?.token as string | undefined;
            if (!token) return undefined;

            const payload = jwt.verify(token, appConfig.jwtSecretKey) as { user: UserModel };
            return payload.user;
        } catch {
            return undefined;
        }
    }
};

export const recipeGenerationSocketService = new RecipeGenerationSocketService();