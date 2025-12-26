# The Divination Engine

**A cognitive tool for surfacing latent preferences through stochastic scaffolding.**

A full-stack tarot application powered by Spring Boot and React + Vite.  Not fortune-telling - a tool for telling you what you already know.

*Not a prophecy — a mirror with ~4.55 sextillion faces.*

[Skip to Quick-Start](#quick-start)

---

## What is Stochastic Scaffolding?

Stochastic scaffolding uses randomness to surface implicit preferences through somatic-emotional response.

You can't decide whether to go out tonight. You flip a coin: "Heads I go out, tails I stay in." It lands tails. Immediately, you realise you always wanted to go out.

The coin didn't decide for you. It revealed what you already knew.

This is the **oracle effect**: high-entropy randomness forces implicit preferences into conscious awareness through immediate emotional response. Stochastic scaffolding extends this principle into high-dimensional space.



### Why Tarot?

A coin flip is binary. Your mind is not.

A Celtic Cross tarot spread has:
- **10 positions**, each representing a distinct influence (past, present, challenge, hopes, fears, outcome)
- **78 cards**, each drawable upright or reversed
- **~4.55 × 10²¹ unique configurations** (4.55 sextillion)

Tarot is a many-sided coin - one that lets your subconscious mind speak in **gradients**.  

The combinatorial vastness creates stochastic scaffolding - a self-directed, archetypal, somatically-resonant narrative - a high-resolution probe of your internal structure, via the **oracle effect**

### The Mechanism

This operates through three coupled effects:

1. **Entropy Injection** — High-entropy randomness overwhelms low-resolution conscious deliberation - there are more potential configurations than you could ever list

2. **Affective Readout** — The specific configuration provokes immediate emotional response, revealing which preferences carry weight.  More crucially, you engage in deliberate apophenia, connecting the dots the cards provide in ways that surface your underlying assumptions and implicit models

3. **Commitment Simulation** — Revealed outcomes collapse ambiguity without permanently binding action - your gut response to the pattern surfaces what was already there.

This is not prediction. This is **_self-induced oracle analysis_**.

### How to Use

1. **Frame your question** — What are you uncertain about?
2. **Draw the spread** — Let randomness configure the scaffold
3. **Notice your reaction** — What do you feel/think? Let your subconscious populate the structure
4. **That feeling is the answer** — Not the cards. Your response to them; the story you tell to connect the dots the cards provide.


_The spread doesn't tell you what to do. It tells you **what you already want**._

---

## What This Is Not Promising

- ❌ **Not fortune-telling** — The cards don't predict external reality
- ❌ **Not mysticism** — No supernatural or cosmic forces necessary
- ❌ **Not decision automation** — The cards don't make choices for you

## What This Is

- ✅ **Preference revelation** — Making implicit knowledge explicit through narrative projection
- ✅ **Somatic-Narrative Synthesis** — Bypassing analysis paralysis through emotional response
- ✅ **Cognitive Mirror** — Using randomness and pattern-seeking to surface self-knowledge

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

## The Science

building in part on established psychological and neuroscientific concepts:

- **Somatic Marker Hypothesis** (Damasio) — Emotional responses guide decision-making
- **Affective Forecasting** — Understanding preferences through emotional projection
- **Analysis Paralysis** — Deliberative systems get stuck; affective systems break the loop
- **Cleromancy** — Historical use of randomness (casting lots) for preference revelation

Preferences are often implicit, noisy, or underdetermined. The Divination Engine provides an external forcing function that makes those preferences legible through affective response, without claiming external truth.

### A Missing Piece of Decision Theory?

Traditional decision theory focuses on *making* choices through deliberation. Introspection techniques help you *understand* yourself through reflection.

This project sits between them: **using external randomness as an introspective tool**—a principled method for decision crystallization when conscious evaluation alone is insufficient.

---

## FAQ for Skeptics

**Q: So you're saying a tarot spread predicts the future?**  
A: No. tarot doesn't predict external reality. It's a lens for your own internal state; Tarot is a high-resolution forcing function for your subconscious preferences.

**Q: Isn't a coin flip simpler? Why all the tarot complexity?**  
A: A coin flip is binary. But your brain is high-dimensional. A Celtic Cross spread is a ~4.55 sextillion-sided coin. That granularity surfaces subtle, nuanced preferences that a simple yes/no can't reveal.

**Q: Emotional reactions aren't reliable data.**  
A: This project isn't collecting "objective data." It's preference revelation, not prediction. Emotions are the sensor—your gut signals what your deliberative mind was ignoring.

**Q: You're basically saying, "the cards show what I already know." Isn't that obvious?**  
A: Exactly. The genius of the oracle effect is in provoking clarity. Most people don't know what they know until the randomness hits. That's the whole point.

**Q: Can I use this for real decision-making?**  
A: Yes. Use it to clarify, not command. This project is telling you: "Here's your gut talking—listen." Your conscious mind still chooses.

---

## Original Repositories

- Frontend: [[Repo](https://github.com/DayByDayBy/the-divination-engine)]
- Backend: [[Repo](https://github.com/DayByDayBy/the-divination-engine-API)]

## License

This project is licensed under the [Apache License 2.0](./LICENSE).

## Topics

`decision-making` `preference-revelation` `analysis-paralysis` `somatic-marker-hypothesis` `affective-override` `introspection` `randomness` `oracle effect` `tarot` `cognitive-science` `stochastic-scaffolding` `react` `java` `typescript` `spring-boot` `vite`

---

*The Divination Engine is a tool for self-knowledge, not supernatural insight. The cards don't know your future—but they might help you see what you already feel.*