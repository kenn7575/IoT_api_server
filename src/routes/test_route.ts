import express from "express";
import { testApi } from "../controllers/test_controller";

const router = express.Router();

router.get("/", testApi); //get all

export default router;
