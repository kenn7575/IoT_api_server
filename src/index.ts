import express, { Express, Request, Response, Application } from "express";
import dotenv from "dotenv";
import testRoutes from "./routes/test_routes";
import devicesRoutes from "./routes/test_routes";
import measurementRoutes from "./routes/measurement_routes";

//For env File
dotenv.config();

const app: Application = express();
const port = process.env.PORT || 3000;

app.use("/test", testRoutes);
app.use("/devices", devicesRoutes);
app.use("/measurements", measurementRoutes);

app.listen(port, () => {
  console.log(`Server is live at http://localhost:${port}`);
});
