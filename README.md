<p align="center">
  <picture>
    <source media="(prefers-color-scheme: dark)" srcset="zoku-logo-dither-dark.png" />
    <img alt="Zoku logo" src="zoku-logo-dither-light.png" width="188" />
  </picture>
</p>

<p align="center">
  <img src="https://img.shields.io/badge/license-MIT-blue.svg" alt="MIT License">
  <img src="https://img.shields.io/badge/built%20with-Bun-f9f1e1?logo=bun&logoColor=white" alt="Bun">
  <img src="https://img.shields.io/badge/TypeScript-3178c6?logo=typescript&logoColor=white" alt="TypeScript">
</p>

# Zoku

> A clan of AI agents that work with your team — self-hosted, multi-tenant, open source.

Zoku is a self-hosted AI agent platform built as a small Bun + TypeScript monorepo. One server, many orgs — each with its own profiles, sessions, member invites, and roles.

Inspired by [OpenClaw](https://github.com/openclaw/openclaw) and [Hermes Agent](https://github.com/nousresearch/hermes-agent), but **multi-tenant by design**: instead of one operator on one machine, Zoku runs a whole team of agents — each profile an agent with its own role, soul, tools, and memory.

## Features

- **Multi-tenant** — organizations, member invites, roles, isolated profiles and sessions
- **Profiles as agents** — role, soul, tools, and memory per profile
- **Channels** — Web dashboard, terminal CLI, Telegram, WhatsApp, Discord
- **Automations** — scheduled and event-driven agent runs
- **Integrations** — MCP servers, skills, Composio (SaaS app connections)
- **Backup & restore** — one-command export/import of your data root

## Quick start

Requires [Bun](https://bun.sh).

```bash
# Install dependencies
bun install

# Start the web dashboard (starts the server automatically if needed)
bun run dev:web
```

Visit the web dashboard: http://localhost:3000

Or run the server on its own:

```bash
bun run dev:server
```

On first run, the server prompts for a provider and API key if none is configured. Settings are saved to `~/.zoku/config.ini`.

### Docker

```bash
# Pull and run the latest image
docker pull ghcr.io/isnaenihidayat/zoku:latest
docker run -d -p 4310:4310 -v zoku-data:/zoku/data --name zoku ghcr.io/isnaenihidayat/zoku:latest
```

**Build from source:**

```bash
./scripts/docker-build-run.sh
```

**Fresh start:**

```bash
./scripts/docker-destroy.sh
./scripts/docker-build-run.sh
```

The dashboard will be available at http://localhost:4310. Interactive API docs: http://127.0.0.1:4310/docs.

### Integrations

Zoku integrates with **Telegram**, **WhatsApp**, and **Composio**. Enable them in the web app under **Integrations** — Composio key is stored at `~/.zoku/composio/config.ini`, org admins connect OAuth apps and assign toolkits per profile.

## Project layout

```
apps/
  server/    Hono HTTP + SSE server (SQLite)
  web/       React + Vite web dashboard
  cli/       terminal client
  platform/  channel bridges (Telegram, WhatsApp, Discord, Automation)
packages/
  agent/     agent core logic
  core/      shared types & utilities
  db/        SQLite schema & queries
  client/    server API client
docs/
  website/   documentation site
```

## Documentation

Full guide: [isnaenihidayat.github.io/zoku](https://isnaenihidayat.github.io/zoku) · System design: [ARCHITECTURE.md](./ARCHITECTURE.md)

## License

MIT — see [LICENSE](./LICENSE).
