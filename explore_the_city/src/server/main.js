import express from "express";
import ViteExpress from "vite-express";
import dotenv from "dotenv";
import LocationRouter from "./routes/locationRouter.mjs";

const PORT = process.env.PORT || 3000;

const app = express();
app.use(express.json());
dotenv.config();

app.use(LocationRouter);

app.get("/hello", (req, res) => {
  res.send("Hello Vite + React!");
});

ViteExpress.listen(app, PORT, () =>
  console.log(`Server is listening on port ${PORT}`),
);
