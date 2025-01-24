import express from "express";
import { testApi, versionApi } from "../controllers/test_controller";

const router = express.Router();

router.get("/", testApi); //get all
router.get("/v", versionApi); //get all

export default router;
