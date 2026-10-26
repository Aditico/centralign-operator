# CentrAlign Operator

CentrAlign Operator is an AI-powered autonomous task execution system that uses large language models to plan tasks, execute tool-based actions, maintain execution state, and request human approval when necessary.

The project combines a React frontend with a Node.js and Express backend, Groq-powered LLM interactions, and SQLite for persistent task data.

## Features

- **AI-powered task execution:** Uses an LLM to process user instructions and determine the next actions.
- **Tool-based execution loop:** Supports multi-step task execution through a backend-controlled agent loop.
- **Human-in-the-loop approval:** Allows tasks to pause for human approval and resume execution.
- **Persistent storage:** Uses SQLite to store application data and execution state.
- **REST API:** Exposes backend endpoints for communication between the frontend and backend.
- **Interactive frontend:** Provides a React-based interface for interacting with the operator.

## Tech Stack

| Component | Technology |
|---|---|
| Frontend | React, Vite |
| Backend | Node.js, Express.js |
| AI integration | Groq SDK |
| Language model | `openai/gpt-oss-120b` |
| Database | SQLite |
| Database driver | better-sqlite3 |
| Testing | Vitest, Supertest |

## Architecture

The application follows a client-server architecture.

```text
                 User
                   |
                   v
          React + Vite Frontend
                   |
              REST API
                   |
                   v
          Node.js + Express
                   |
                   v
          Agent Execution Loop
                   |
          +--------+--------+
          |                 |
          v                 v
      Groq LLM         Tool Execution
          |                 |
          +--------+--------+
                   |
                   v
              SQLite DB
```

### How It Works

1. The user submits a task through the React frontend.
2. The frontend sends a request to the Express backend through the REST API.
3. The backend uses the Groq SDK to obtain model-generated decisions.
4. The agent execution loop processes the task step by step and invokes supported tools.
5. When human approval is required, execution can pause until the approval workflow is completed.
6. SQLite stores application data and execution state.
7. The backend returns execution results to the frontend.

## Project Structure

```text
centralign-operator/
├── backend/
│   ├── src/
│   │   ├── db/
│   │   │   └── database.js
│   │   ├── server.js
│   │   └── start.js
│   ├── package.json
│   └── .env
├── frontend/
│   ├── src/
│   ├── public/
│   ├── package.json
│   └── .env.example
├── docs/
├── .gitignore
└── README.md
```

*Note: This is a high-level representation of the project structure. Update it if your repository contains additional files or directories.*

## Prerequisites

- Node.js and npm
- A Groq API key
- Git

## Getting Started

### 1. Clone the Repository

```bash
git clone <YOUR_GITHUB_REPOSITORY_URL>
cd centralign-operator
```

### 2. Set Up the Backend

```bash
cd backend
npm install
```

Create a `.env` file inside the `backend` directory:

```env
PORT=8000
GROQ_API_KEY=your_groq_api_key
GROQ_MODEL=openai/gpt-oss-120b
```

For local development, the SQLite database defaults to:

```text
backend/data/centralign.db
```

You can optionally specify a different database path:

```env
DB_PATH=./data/centralign.db
```

Start the backend:

```bash
npm run dev
```

The backend should be available at:

```text
http://localhost:8000
```

To run it using the production start command:

```bash
npm start
```

### 3. Set Up the Frontend

Open a second terminal:

```bash
cd frontend
npm install
```

Configure the frontend API URL using a `.env` file in the `frontend` directory:

```env
VITE_API_URL=http://localhost:8000/api
```

Start the frontend:

```bash
npm run dev
```

Open the local URL printed by Vite, typically:

```text
http://localhost:5173
```

## Environment Variables

### Backend

| Variable | Description |
|---|---|
| `PORT` | Port on which the backend server runs; defaults to `8000`. |
| `GROQ_API_KEY` | API key used to authenticate with Groq. |
| `GROQ_MODEL` | Model identifier used for LLM requests. |
| `DB_PATH` | Optional path to the SQLite database file. |

### Frontend

| Variable | Description |
|---|---|
| `VITE_API_URL` | Base URL of the backend API, including the `/api` prefix. |

Never commit real API keys or other secrets to version control. Keep `.env` files out of Git and provide example environment files without secret values.

## Testing

The backend includes a test script configured with Vitest:

```bash
cd backend
npm test
```

This runs the test suite using `vitest run`.

## Deployment

The intended deployment setup separates the frontend and backend.

- **Backend:** Deploy the `backend` directory as a Node.js web service on Render.
- **Frontend:** Deploy the `frontend` directory as a Vite application on Vercel.
- **Database:** Configure a persistent disk for SQLite when deploying the backend.

For the Render backend, configure the following environment variables:

```env
GROQ_API_KEY=your_groq_api_key
GROQ_MODEL=openai/gpt-oss-120b
DB_PATH=/var/data/centralign.db
```

Set the persistent disk mount path to `/var/data` so the SQLite database is stored on the mounted disk.

After deployment, configure the frontend's `VITE_API_URL` to use the actual backend URL:

```env
VITE_API_URL=https://<your-render-service-url>/api
```

Ensure the backend CORS configuration allows requests from your deployed frontend origin.

## Design Considerations

- **Separation of concerns:** The frontend handles user interaction, while the backend manages task execution and external AI requests.
- **State persistence:** SQLite provides lightweight local storage, with a persistent disk needed for durable database storage in deployment.
- **Controlled execution:** Human approval provides an additional checkpoint before actions that require user authorization.
- **Configurable deployment:** Environment variables allow service configuration without hardcoding secrets or deployment-specific paths.

## Future Improvements

- Add authentication and role-based access control.
- Expand the available tool integrations.
- Improve execution tracing, logging, and error recovery.
- Add more comprehensive automated tests.
- Introduce stronger task-level permissions and execution limits.

## License

No license has been specified yet. Add a license if you intend to make the project open source.
