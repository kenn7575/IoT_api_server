import { Router } from "express";
import { getTemperatureMeasurements, createTemperatureMeasurement } from "../controllers/temperature_controller";
import { getNoiseMeasurements, createNoiseMeasurement } from "../controllers/noise_controller";
import { getHumidityMeasurements, createHumidityMeasurement } from "../controllers/humidity_controller";

const router = Router();

router.get("/get-temperature-measurement", getTemperatureMeasurements);
router.post("/post-temperature-measurement", createTemperatureMeasurement);

router.get("/get-noise-measurement", getNoiseMeasurements);
router.post("/post-noise-measurement", createNoiseMeasurement);

router.get("/get-humidity-measurement", getHumidityMeasurements);
router.post("/post-humidity-measurement", createHumidityMeasurement);

export default router;