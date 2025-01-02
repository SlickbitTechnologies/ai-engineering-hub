import express from "express";
import { fetchLocationData } from "../controllers/locationController.mjs";

const LocationRouter = express.Router();
const URI = "/api/location-explorer";
LocationRouter.post(`${URI}/generate`, fetchLocationData);

export default LocationRouter;
