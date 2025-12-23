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

### Local Development

See individual README files in each directory:
- [Backend README](./divination_api/README.md)
- [Frontend README](./divination_engine/README.md)

## Configuration

1. Copy `.env.example` to `.env`
2. Update values for your environment
3. Frontend-specific config is in `divination_engine/.env.example`

## Warning

**Contains images (~34MB)** - may be slow on slower connections.
Images are public domain, not for commercial use.

## Original Repositories

This monorepo consolidates:
- Backend: [Original API repo link]
- Frontend: [Original engine repo link]
