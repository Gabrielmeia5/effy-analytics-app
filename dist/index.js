"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const dotenv_1 = __importDefault(require("dotenv"));
const app_1 = __importDefault(require("./app"));
const setup_1 = require("./db/setup");
dotenv_1.default.config();
const PORT = process.env.PORT || 3000;
(0, setup_1.setupDatabase)().then(() => {
    app_1.default.listen(PORT, () => {
        console.log(`Servidor rodando em http://localhost:${PORT}`);
    });
}).catch(err => {
    console.error('Erro ao configurar banco de dados:', err);
});
