# Shamba-Smart

Shamba-Smart is a crop monitoring dashboard with a React interface and a Flask API. Accounts, crop profiles, and irrigation events are stored in a database. The dashboard uses public weather data and modeled soil-moisture estimates; it does not connect to physical farm sensors.

## What is included

- Email and password registration with hashed passwords and signed access tokens
- Crop records scoped to the signed-in account
- Crop profile editing and saved irrigation history
- SQLite for a local setup, with PostgreSQL supported through `DATABASE_URL`
- A warm field-journal interface with clear labels instead of arrow-based flow diagrams

## Requirements

- Node.js 20.19 or later, or 22.12 or later
- Python 3.10 or later

## Start the backend

Open a terminal in `src/backend` and create a virtual environment:

```bash
python -m venv .venv
source .venv/bin/activate
pip install -r requirements.txt
cp .env.example .env
```

On Windows PowerShell, activate with `.venv\Scripts\Activate.ps1` and copy the example with `Copy-Item .env.example .env`.

Generate a signing key and enter it as the `JWT_SECRET_KEY` value in `.env`. One way on Linux or macOS is:

```bash
python -c "import secrets; print(secrets.token_hex(32))"
```

Then apply the database migrations and start Flask:

```bash
flask --app wsgi db upgrade
flask --app wsgi run --host 127.0.0.1 --port 5000
```

The local database is created under `src/backend/instance`. Existing crops from an older database have no owner and are intentionally hidden from user accounts; add them again after signing in.

## Start the frontend

In a second terminal at the project root:

```bash
npm install
npm run dev
```

Open the Vite URL shown in the terminal. The development server forwards `/api` requests to Flask on port 5000. Create an account to save crops to the backend.

## Production notes

Set `JWT_SECRET_KEY`, `DATABASE_URL`, and `CORS_ORIGINS` in the hosting environment. Use HTTPS, restrict CORS to the deployed frontend origin, and run `flask --app wsgi db upgrade` as part of deployment. The development server is not intended for production hosting.
