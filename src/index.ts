import express, { Express, Request, Response, Application } from "express";
import dotenv from "dotenv";
import testRoutes from "./routes/test_routes";
import devicesRoutes from "./routes/device-routes";
import measurementRoutes from "./routes/measurement_routes";
import alertRoutes from "./routes/alert_routes";
import bodyParser from "body-parser";
import { authMiddleware } from "./middlewares/auth";

//For env File
dotenv.config();

const app: Application = express();
const port = process.env.PORT || 3000;

app.use(bodyParser.json());
app.use("/test", testRoutes);
app.use("/devices", devicesRoutes);
app.use("/measurements", authMiddleware, measurementRoutes);
app.use("/alerts", authMiddleware, alertRoutes);

app.listen(port, () => {
  console.log(`Server is live at http://localhost:${port}`);
});
