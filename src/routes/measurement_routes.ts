import { Router } from "express";
import { getTemperatureMeasurements, createTemperatureMeasurement } from "../controllers/temperature_controller";
import { getNoiseMeasurements, createNoiseMeasurement } from "../controllers/noise_controller";
import { getHumidityMeasurements, createHumidityMeasurement } from "../controllers/humidity_controller";

const router = Router();

router.get("/temperature-measurement", getTemperatureMeasurements);
router.post("/temperature-measurement", createTemperatureMeasurement);

router.get("/noise-measurement", getNoiseMeasurements);
router.post("/noise-measurement", createNoiseMeasurement);

router.get("/humidity-measurement", getHumidityMeasurements);
router.post("/humidity-measurement", createHumidityMeasurement);

export default router;