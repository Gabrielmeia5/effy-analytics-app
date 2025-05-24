
# Effy Analytics 🌡️📊 – Desafio Técnico Fullstack

[![Node.js](https://img.shields.io/badge/Node.js-18.x-green?logo=node.js)](https://nodejs.org/)
[![TypeScript](https://img.shields.io/badge/TypeScript-4.x-blue?logo=typescript)](https://www.typescriptlang.org/)
[![PostgreSQL](https://img.shields.io/badge/PostgreSQL-16.x-blue?logo=postgresql)](https://www.postgresql.org/)
[![License](https://img.shields.io/badge/license-MIT-lightgrey.svg)](LICENSE)

> Sistema fullstack de monitoramento climático e eficiência operacional, com dashboard interativa, coleta automática de dados, análise histórica e geração de relatórios.

---

## 📑 Sumário

- [🔍 Sobre o Projeto](#-sobre-o-projeto)
- [🚀 Funcionalidades](#-funcionalidades)
- [🧰 Tecnologias Utilizadas](#-tecnologias-utilizadas)
- [📦 Estrutura de Pastas](#-estrutura-de-pastas)
- [📡 API - Endpoints](#-api---endpoints)
- [⚙️ Instalação e Execução](#️-instalação-e-execução)
- [🚀 Melhorias Futuras](#-melhorias-futuras)
- [📝 Licença](#-licença)

---

## 🔍 Sobre o Projeto

**Effy Analytics** é uma aplicação **fullstack** desenvolvida como desafio técnico. Seu objetivo é monitorar a **temperatura ambiente** de uma localidade, calcular a **eficiência de uma máquina** com base nesses dados e disponibilizar essas informações de forma clara e visual através de uma dashboard web.

Este projeto foi desenvolvido com foco em **exceder os requisitos do desafio técnico**, agregando funcionalidades que entregam mais valor ao usuário, robustez e uma experiência profissional tanto no frontend quanto no backend.

---

## 🚀 Funcionalidades

- 🔄 **Coleta automática de dados climáticos** a cada 30 segundos.
- 🌐 **Alteração dinâmica da localização monitorada**
- 📊 **Dashboard interativa**, com:
  - Dados atuais: data, hora, temperatura, eficiência e descrição do clima.
  - Indicadores de tendência (⬆️ Subindo, ➖ Estável, ⬇️ Descendo).
  - Resumo estatístico (média, mínima e máxima).
  - Comparativo histórico de eficiência e temperatura do dia, semana e mês anterior, no mesmo horário.
  - **Gráfico de linha dinâmico** (temperatura vs. eficiência), vinculado ao período selecionado.
- 📅 **Seleção de escopo de análise:** Dia, Semana ou Mês, que impacta:
  - Gráfico
  - Estatísticas
  - Comparativos
  - Exportações
- 📤 **Exportação de dados** no formato:
  - **CSV:** dados completos do escopo selecionado.
  - **PDF:** relatório profissional com dados, estatísticas, gráfico e tabela.
- ⚠️ **Fallback inteligente:** utiliza o último dado salvo caso a API esteja indisponível.
- 🧪 **Geração de dados mock** para testes e demonstrações sem dependência da API externa.

---

## 🧰 Tecnologias Utilizadas

### 🔙 Backend
- **Node.js** + **TypeScript**
- **Express.js**
- **PostgreSQL** (SQL puro, sem ORM)
- **Axios** – API OpenWeather
- **Puppeteer** – Geração de PDF
- **Handlebars** – Templates de PDF
- **csv-writer** – Exportação CSV
- **date-fns** – Manipulação de datas

### 🔥 Frontend
- **HTML5 + CSS3 + JavaScript (ES6)**
- **ApexCharts.js** – Gráficos interativos
- Design responsivo com protótipo no **Figma**

### ☁️ API Externa
- **OpenWeather API** – Dados climáticos

### 🛠️ Configurações e Convenções

- **TypeScript Config (`tsconfig.json`):**
  - Configura paths, aliases e diretórios de saída.
  - Define padrões de compilação, como strict mode, target e module.


---

## 📦 Estrutura de Pastas

```
effy-analytics/
├── server/
│   ├── src/
│   │   ├── controllers/     # Lógica dos endpoints
│   │   ├── routes/          # Rotas da API
│   │   ├── services/        # Regras de negócio
│   │   ├── db/              # Banco de dados e setup
│   │   ├── utils/           # Helpers
│   │   ├── app.ts           # Configuração do servidor
│   │   └── index.ts         # Bootstrap do servidor
│   ├── public/             # Frontend estático
│   │   ├── index.html
│   │   ├── css/
│   │   └── js/
│   ├── .env
│   ├── package.json
│   ├── tsconfig.json
├── README.md
```

---

## 📡 API - Endpoints

## 📚 Endpoints da API

| Método | Rota                  | Descrição                                 | Parâmetros         |
|--------|-----------------------|-------------------------------------------|--------------------|
| GET    | /api/metrics/collect  | Coleta e salva nova métrica               | -                  |
| GET    | /api/metrics/latest   | Retorna última métrica registrada         | -                  |
| GET    | /api/metrics/history  | Histórico por período (`range`)           | ?range=day/week/month |
| GET    | /api/metrics/stats    | Estatísticas por período (`range`)        | ?range=day/week/month |
| GET    | /api/metrics/comparative | Dados comparativos históricos           | -                  |
| GET    | /api/metrics/export   | Exporta dados em CSV                      | ?range=day/week/month |
| POST   | /api/metrics/export/pdf | Exporta relatório em PDF                | body: { chartImage } |
| GET    | /api/metrics/location | Consulta localização monitorada           | -                  |
| POST   | /api/metrics/location | Altera localização monitorada             | body: { location } |

## ⚙️ Instalação e Execução

### ✅ Pré-requisitos

- Node.js >= 18.x
- PostgreSQL >= 16.x
- API Key válida da [OpenWeather](https://openweathermap.org/api)

### 🔧 Variáveis de Ambiente

Crie um arquivo `.env` na raiz do projeto:

```env
PORT=3000
DATABASE_URL=postgresql://usuario:senha@localhost:5432/database
WEATHER_API_KEY=sua_api_key
LOCATION_DEFAULT=Patos de Minas
```

### 🐘 Banco de Dados

Banco é criado automaticamente na primeira execução:

```sql
CREATE TABLE IF NOT EXISTS metric (
  id SERIAL PRIMARY KEY,
  temperature FLOAT NOT NULL,
  efficiency FLOAT NOT NULL,
  location VARCHAR(255) NOT NULL,
  "createdAt" TIMESTAMPTZ DEFAULT NOW()
);
```

### 🚀 Executando o Projeto

```bash
# Instalar dependências
npm install

# Rodar em desenvolvimento
npm run dev

# Para build de produção
npm run build
npm start
```

Acesse em: [http://localhost:3000](http://localhost:3000)

---

## 🚀 Melhorias Futuras

- ☁️ Deploy em nuvem*(Render, Railway, Vercel) com escalabilidade automática.
- 🔐 Autenticação e controle de acesso com níveis de permissão (admin, analista, operador).
- 👥 Suporte a múltiplos usuários monitorando diferentes máquinas/localizações simultaneamente.
- 📊 Novos tipos de gráficos e filtros avançados, incluindo dashboards comparativas entre períodos e localidades.
- 📅 Períodos personalizados: permitir seleção além de Dia, Semana e Mês (ex.: últimos 10 dias, intervalos livres).
- 🔮 Análise preditiva na dashboard:
  - Modelagem para previsão de eficiência futura com base em padrões climáticos e históricos.
  - Uso de Machine Learning básico ou modelos estatísticos.
- 🧠 Insights inteligentes e alertas proativos:
  - Notificações automáticas sobre quedas bruscas de eficiência, tendências fora do padrão ou alterações climáticas críticas.
- 📤 Integração com Google Sheets ou Excel Online: exportação e sincronização automática dos dados.
- 🚀 Algoritmos de eficiência configuráveis:
  - Possibilidade de aplicar diferentes fórmulas de cálculo e validar o modelo mais adequado para diferentes contextos operacionais.
- 🌐 Internacionalização (i18n) com suporte a múltiplos idiomas.
- 🎨 Migração do frontend para frameworks modernos (React) com maior escalabilidade e experiência do usuário.

## 📝 Licença

Este projeto está licenciado sob os termos da licença MIT. Consulte o arquivo [LICENSE](LICENSE) para mais informações.

---

## 🤝 Contato

Desenvolvido como parte de um **desafio técnico**.

- ✉️ **Gabriel Pereira de Lima** – ogabriellima1991@gmail.com 
- 💼 [LinkedIn](https://www.linkedin.com/in/gabriellima12/)  

---


