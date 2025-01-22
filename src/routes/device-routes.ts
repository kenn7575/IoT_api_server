import express from "express";
import { deviceLoginController } from "../controllers/device_login_controller";
import { registerDevice } from "../controllers/register_devices_controller";
import { getSettings } from "../controllers/get_settings_controller";
// import { updateSensorSettings } from "../controllers/update_settings_controller";

const router = express.Router();

router.post("/", registerDevice); //register new device
router.post("/login", deviceLoginController); //login device and return API key

router.get("/:machine_id/settings", getSettings); //register new device
// router.patch("/:machine_id/settings", updateSensorSettings); //login device and return API key

export default router;
