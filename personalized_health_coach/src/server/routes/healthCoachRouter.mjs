import express from "express";
import { fetchHealthCoachData } from "../controllers/healthCoachController.mjs";

const HealthCoachRouter = express.Router();
const URI = "/api/healthCoach";
HealthCoachRouter.post(`${URI}/generate`, fetchHealthCoachData);

export default HealthCoachRouter;
