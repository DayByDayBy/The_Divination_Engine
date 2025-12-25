# The Divination Engine

[Skip to Quick-Start](#quick-start)

**HDPC uses high-entropy randomness to collapse your latent preferences into conscious clarity.**

A full-stack tarot application powered by Spring Boot and React + Vite. Not fortune-telling—a cognitive tool for surfacing what you already know through High-Dimensional Preference Collapse (HDPC).

*Not a prophecy — a mirror with 4.55 sextillion faces.*

---

## What is High-Dimensional Preference Collapse?

You can't decide whether to go out tonight. You flip a coin: "Heads I go out, tails I stay in." It lands tails. Immediately, you realise you always wanted to go out.

The coin didn't decide for you. It revealed what you already knew.

This is **High-Dimensional Preference Collapse** (HDPC): a cognitive phenomenon where high-entropy randomness forces your implicit preferences into conscious awareness through immediate emotional response.

### Why Tarot?

A coin flip is binary. Your mind is not.

A Celtic Cross tarot spread has:
- **10 positions**, each representing a distinct influence (past, present, challenge, hopes, fears, outcome)
- **78 cards**, each drawable upright or reversed
- **~4.55 × 10²¹ unique configurations** (4.55 sextillion)

Tarot is a many-sided coin - one that lets your subconscious mind speak in **gradients**.  The combinatorial vastness creates a high-resolution probe of your internal structure.

### The Mechanism

HDPC operates through three coupled effects:

1. **Entropy Injection** — High-entropy randomness overwhelms low-resolution conscious deliberation 
2. **Affective Readout** — The outcome triggers immediate emotional response, revealing which preferences carry weight. More crucially, you engage in deliberate apophenia—connecting the dots the cards provide in ways that surface your underlying assumptions and implicit models
3. **Commitment Simulation** — Revealed outcomes collapses ambiguity without permanently binding action

This is not prediction. This is **_state-space reduction_**.

### How to Use

1. **Frame your question** — What are you uncertain about?
2. **Draw the spread** — Let randomness generate a configuration
3. **Notice your reaction** — What do you feel/think when you see the cards?
4. **That feeling is the answer** — Not the cards. Your gut response to them; the story you tell to connect the dots the cards provide.


_The spread doesn't tell you what to do. It tells you **what you already want**._

---

## What This Is Not Promising

- ❌ **Not fortune-telling** — The cards don't predict external reality
- ❌ **Not mysticism** — No supernatural or cosmic forces necessary
- ❌ **Not decision automation** — The cards don't make choices for you

## What This Is

- ✅ **Preference revelation** — Making implicit desires explicit
- ✅ **Affective override** — Bypassing analysis paralysis through emotional response
- ✅ **Introspective tool** — Using stochasticity and apophenia to build a mirror for self-knowledge

---

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

- **Frontend**: http://localhost:8081
- **Backend API**: http://localhost:8080/api

⚠️ **Warning**: Contains card images (~34MB); may be slow on slower connections.

### Local Development

See individual READMEs:
- [Backend README](./divination_api/README.md)
- [Frontend README](./divination_engine/README.md)

---

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

### Environment-Specific Differences

**Development vs Docker**:
- **Local Dev**: Backend uses `localhost:5432`, frontend uses `localhost:8080`
- **Docker**: Services communicate via container names (`postgres:5432`, `backend:8080`)

Example Docker Compose overrides:

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

---

## The Science Behind HDPC

HDPC builds on established psychological and neuroscientific concepts:

- **Somatic Marker Hypothesis** (Damasio) — Emotional responses guide decision-making
- **Affective Forecasting** — Understanding preferences through emotional projection
- **Analysis Paralysis** — Deliberative systems get stuck; affective systems break the loop
- **Cleromancy** — Historical use of randomness (casting lots) for preference revelation

Preferences are often implicit, noisy, or underdetermined. HDPC provides an external forcing function that makes those preferences legible through affective response, without claiming external truth.

### A Missing Piece of Decision Theory?

Traditional decision theory focuses on *making* choices through deliberation. Introspection techniques help you *understand* yourself through reflection.

HDPC sits between them: **using external randomness as an introspective tool**—a principled method for decision crystallization when conscious evaluation alone is insufficient.

---

## FAQ for Skeptics

**Q: So you're saying a tarot spread predicts the future?**  
A: No. HDPC doesn't predict external reality. It's a lens for your own internal state. Tarot is a high-resolution forcing function for your subconscious preferences.

**Q: Isn't a coin flip simpler? Why all the tarot complexity?**  
A: A coin flip is binary. But your brain is high-dimensional. A Celtic Cross spread is a ~4.55 sextillion-sided coin. That granularity surfaces subtle, nuanced preferences that a simple yes/no can't reveal.

**Q: Emotional reactions aren't reliable data.**  
A: HDPC isn't collecting "objective data." It's preference revelation, not prediction. Emotions are the sensor—your gut signals what your deliberative mind was ignoring.

**Q: You're basically saying, "the cards show what I already know." Isn't that obvious?**  
A: Exactly. The genius of HDPC is in forcing clarity. Most people don't know what they know until the randomness hits. That's the whole point.

**Q: Can I use this for real decision-making?**  
A: Yes. Use it to clarify, not command. HDPC tells you: "Here's your gut talking—listen." Your conscious mind still chooses.

---

## Original Repositories

- Backend: [Repo]
- Frontend: [Repo]

## License

This project is licensed under the [Apache License 2.0](./LICENSE).

## Topics

`decision-making` `preference-revelation` `analysis-paralysis` `somatic-marker-hypothesis` `affective-override` `introspection` `randomness` `tarot` `cognitive-science` `HDPC` `react` `java` `typescript` `spring-boot` `vite`

---

*The Divination Engine is a tool for self-knowledge, not supernatural insight. The cards don't know your future—but they might help you see what you already feel.*