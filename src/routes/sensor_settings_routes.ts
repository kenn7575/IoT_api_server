import { Router } from "express";
import { createSensorSettings } from "../controllers/sensor_settings/create_sensor_settings_controller";
import { getSensorSettings } from "../controllers/sensor_settings/get_sensor_settings_controller";
import { updateSensorSettings } from "../controllers/sensor_settings/update_sensor_settings_controller";
import { deleteSensorSettings } from "../controllers/sensor_settings/delete_sensor_settings_controller";

const router = Router();

router.post("/", createSensorSettings);
router.get("/settings/:machine_id", getSensorSettings);
router.patch("/settings/:sensorSettingsId", updateSensorSettings);
router.delete("/settings/:sensorSettingsId", deleteSensorSettings);

export default router;