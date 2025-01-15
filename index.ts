import express, { Express, Request, Response, Application } from "express";
import dotenv from "dotenv";
import authRoutes from "./routes/test_route";

//For env File
dotenv.config();

const app: Application = express();
const port = process.env.PORT || 3000;

app.use("/test", authRoutes);

app.listen(port, () => {
  console.log(`Server is live at http://localhost:${port}`);
});
