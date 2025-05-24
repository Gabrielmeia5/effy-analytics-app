import dotenv from "dotenv";
import app from "./app";
import { setupDatabase } from "./db/setup";

dotenv.config();

const PORT = process.env.PORT || 3000;

setupDatabase()
  .then(() => {
    app.listen(PORT, () => {
      console.log(`Servidor rodando em http://localhost:${PORT}`);
    });
  })
  .catch((err) => {
    console.error("Erro ao configurar banco de dados:", err);
  });
