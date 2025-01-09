import express, { Express, Request, Response, Application } from "express";
import dotenv from "dotenv";

//For env File
dotenv.config();

const app: Application = express();
const port = process.env.PORT || 3000;

app.get("/", (req: Request, res: Response) => {
  res.send("connection successful");
});
app.get("/test", (req: Request, res: Response) => {
  res.send("im the 2nd version");
});

app.listen(port, () => {
  console.log(`Server is live at http://localhost:${port}`);
});
