import express from "express";
import { createAleartController } from "../controllers/create_aleart_controller";

const router = express.Router();

router.post("/", createAleartController);

export default router;
