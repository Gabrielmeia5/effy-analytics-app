import express from "express";
import path from "path";
import metricsRoutes from "./routes/metricsRoutes";

const app = express();
app.use(express.json({ limit: "10mb" })); // ou até 10mb se necessário

app.use(express.json());

const publicPath = path.join(process.cwd(), "public");
app.use(express.static(publicPath));

app.use("/api/metrics", metricsRoutes);

app.get("/", (req, res) => {
  res.sendFile(path.join(publicPath, "index.html"));
});

export default app;
