import express from "express";
import path from "node:path";

const app = express();
const PORT = Number(process.env.PORT) || 10000;

app.use(express.json());

app.get("/api/health", (_req, res) => {
  res.json({
    status: "ok",
    game: "Koruny Evropy",
    version: "0.1.0"
  });
});

const clientDist = path.resolve(
  process.cwd(),
  "client",
  "dist"
);

app.use(express.static(clientDist));

app.get("*", (_req, res) => {
  res.sendFile(path.join(clientDist, "index.html"));
});

app.listen(PORT, "0.0.0.0", () => {
  console.log(`Koruny Evropy běží na portu ${PORT}`);
});
