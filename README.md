# The Divination Engine

A full-stack tarot card reading application with Spring Boot backend and React(.tsx) frontend.

## Project Structure
```
the_divination_engine/
├── divination_api/      # Spring Boot REST API
└── divination_engine/   # React + Vite frontend
```

## Quick Start

### Using Docker Compose (Recommended)
```bash
docker-compose up --build
```

- Frontend: http://localhost:8081
- Backend API: http://localhost:8080/api

## Warning

**Contains images (~34MB)** - may be slow on slower connections.
Images are public domain, not for commercial use.


### Local Development

See individual README files in each directory:
- [Backend README](./divination_api/README.md)
- [Frontend README](./divination_engine/README.md)

## Configuration

### Required Environment Variables

| Variable | Location | Description | Example |
|----------|----------|-------------|---------|
| `DB_URL` | Backend | PostgreSQL connection string | `jdbc:postgresql://localhost:5432/divination` |
| `DB_USERNAME` | Backend | Database username | `postgres` |
| `DB_PASSWORD` | Backend | Database password | `postgres` |
| `VITE_API_URL` | Frontend | Backend API URL | `http://localhost:8080/api` |

### Optional Variables

| Variable | Location | Default | When Needed |
|----------|----------|---------|-------------|
| `SERVER_PORT` | Backend | `8080` | Custom backend port |
| `VITE_WS_URL` | Frontend | `ws://localhost:8080/ws` | WebSocket connections |
| `VITE_ENABLE_AI_INTERPRETATIONS` | Frontend | `false` | AI card interpretations |
| `VITE_ENABLE_USER_AUTH` | Frontend | `false` | User authentication |
| `VITE_APP_TITLE` | Frontend | `Divination Engine` | Custom app title |
| `VITE_GOOGLE_ANALYTICS_ID` | Frontend | - | Analytics tracking |

### Setup Instructions

1. **Backend Variables** (`divination_api/.env`):
   ```bash
   cp divination_api/.env.example divination_api/.env
   # Edit with your database credentials
   ```

2. **Frontend Variables** (`divination_engine/.env`):
   ```bash
   cp divination_engine/.env.example divination_engine/.env
   # Edit with your API endpoints
   ```

### Environment-Specific Differences

**Development vs Docker:**
- **Local Dev**: Backend uses `localhost:5432`, Frontend uses `localhost:8080`
- **Docker**: Services use container names (e.g., `postgres:5432`, `backend:8080`)

**Docker Compose Overrides Example:**
```yaml
services:
  backend:
    environment:
      - DB_URL=jdbc:postgresql://postgres:5432/divination
      - DB_USERNAME=postgres
      - DB_PASSWORD=postgres
  frontend:
    environment:
      - VITE_API_URL=http://backend:8080/api
```

See component-specific READMEs for full details:
- [Backend Configuration](./divination_api/README.md)
- [Frontend Configuration](./divination_engine/README.md)


## Original Repositories

This monorepo consolidates:
- Backend: [[Original backend repo](https://github.com/DayByDayBy/the-divination-engine-API)]
- Frontend: [[Original frontend repo](https://github.com/DayByDayBy/the-divination-engine)]
