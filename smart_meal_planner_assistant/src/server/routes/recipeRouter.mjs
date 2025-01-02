import express from "express";
import { fetchRecipe } from "../controllers/recipeController.mjs";

const RecipeRouter = express.Router();
const URI = "/api/recipe";
RecipeRouter.post(`${URI}/generate`, fetchRecipe);

export default RecipeRouter;
