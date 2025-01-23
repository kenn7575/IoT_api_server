import { Router } from "express";
import {
  getTemperatureMeasurements,
  createTemperatureMeasurement,
} from "../controllers/measurements/temperature_controller";
import {
  getNoiseMeasurements,
  createNoiseMeasurement,
} from "../controllers/measurements/noise_controller";
import {
  getHumidityMeasurements,
  createHumidityMeasurement,
} from "../controllers/measurements/humidity_controller";

const router = Router();

router.get("/temperature", getTemperatureMeasurements);
router.post("/temperature", createTemperatureMeasurement);

router.get("/noise", getNoiseMeasurements);
router.post("/noise", createNoiseMeasurement);

router.get("/humidity", getHumidityMeasurements);
router.post("/humidity", createHumidityMeasurement);

export default router;
