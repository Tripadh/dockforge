<p align="center">
  <img src="https://img.shields.io/badge/Docker-2496ED?style=for-the-badge&logo=docker&logoColor=white" alt="Docker"/>
  <img src="https://img.shields.io/badge/Node.js-339933?style=for-the-badge&logo=nodedotjs&logoColor=white" alt="Node.js"/>
  <img src="https://img.shields.io/badge/Redis-DC382D?style=for-the-badge&logo=redis&logoColor=white" alt="Redis"/>
  <img src="https://img.shields.io/badge/MySQL-4479A1?style=for-the-badge&logo=mysql&logoColor=white" alt="MySQL"/>
  <img src="https://img.shields.io/badge/NGINX-009639?style=for-the-badge&logo=nginx&logoColor=white" alt="NGINX"/>
  <img src="https://img.shields.io/badge/Python-3776AB?style=for-the-badge&logo=python&logoColor=white" alt="Python"/>
</p>

<h1 align="center">🚀 Local AI DevLab</h1>

<p align="center">
  <strong>A self-hosted, containerized code execution platform for safe, isolated, and scalable development environments.</strong>
</p>

<p align="center">
  <a href="#-quick-start">Quick Start</a> •
  <a href="#-architecture">Architecture</a> •
  <a href="#-features">Features</a> •
  <a href="#-installation">Installation</a> •
  <a href="#-usage">Usage</a> •
  <a href="#-contributing">Contributing</a>
</p>

<p align="center">
  <img src="https://img.shields.io/github/license/Tripadh/dockforge?style=flat-square" alt="License"/>
  <img src="https://img.shields.io/github/stars/Tripadh/dockforge?style=flat-square" alt="Stars"/>
  <img src="https://img.shields.io/github/forks/Tripadh/dockforge?style=flat-square" alt="Forks"/>
  <img src="https://img.shields.io/badge/PRs-welcome-brightgreen.svg?style=flat-square" alt="PRs Welcome"/>
</p>

<!-- Placeholder for animated header/demo GIF -->
<!-- ![Demo Animation](docs/images/demo.gif) -->

---

## 📖 Project Overview

### The Problem

Running untrusted or experimental code on a local machine poses significant security risks. Traditional sandboxes are complex to set up, and cloud-based solutions introduce latency, cost, and privacy concerns.

### The Solution

**Local AI DevLab** provides a fully self-hosted, Docker-based code execution platform. Users can submit code through a clean web interface, which gets executed in completely isolated containers with strict resource limits — all running on your own infrastructure.

### Real-World Inspiration

- **LeetCode / HackerRank** — Online judges that execute user-submitted code
- **Jupyter Notebooks** — Interactive code execution environments
- **GitHub Codespaces** — Cloud-based development environments
- **Replit** — Browser-based IDE with instant code execution

This project brings similar capabilities to your local machine or private server, with full control over security, data, and infrastructure.

---

## 🏗 Architecture

### System Flow

```
┌─────────────────────────────────────────────────────────────────────────────┐
│                              LOCAL AI DEVLAB                                │
├─────────────────────────────────────────────────────────────────────────────┤
│                                                                             │
│    ┌──────────┐      ┌──────────┐      ┌──────────┐      ┌──────────┐      │
│    │          │      │          │      │          │      │          │      │
│    │  NGINX   │─────▶│ BACKEND  │─────▶│  REDIS   │─────▶│  WORKER  │      │
│    │  :8080   │      │  :3000   │      │  :6379   │      │          │      │
│    │          │      │          │      │          │      │          │      │
│    └──────────┘      └────┬─────┘      └──────────┘      └────┬─────┘      │
│         │                 │                                    │            │
│         │                 │            ┌──────────┐            │            │
│         │                 └───────────▶│  MySQL   │◀───────────┘            │
│    ┌────┴─────┐                        │  :3306   │                         │
│    │ Frontend │                        └──────────┘     ┌──────────────┐    │
│    │  Static  │                                         │   Sandbox    │    │
│    │  Files   │                                         │  Container   │    │
│    └──────────┘                                         │  (Isolated)  │    │
│                                                         └──────────────┘    │
└─────────────────────────────────────────────────────────────────────────────┘
```

<!-- Placeholder for architecture diagram image -->
<!-- ![Architecture Diagram](docs/images/architecture.png) -->

### Component Breakdown

| Component | Role | Technology |
|-----------|------|------------|
| **NGINX** | Reverse proxy, serves frontend static files, routes API requests | NGINX Alpine |
| **Backend** | REST API server, handles job submission and result retrieval | Node.js + Express |
| **Redis** | Message queue for job distribution using BRPOP blocking | Redis 7 Alpine |
| **Worker** | Listens to queue, executes code in sandbox containers | Node.js + Docker CLI |
| **MySQL** | Persistent storage for execution metadata and results | MySQL 8.0 |
| **Sandbox** | Isolated Docker containers with strict resource limits | Python/Node Alpine |

---

## 💻 Tech Stack

| Layer | Technology | Purpose |
|-------|------------|---------|
| **Frontend** | HTML5, CSS3, Vanilla JS | Clean, lightweight web dashboard |
| **Backend** | Node.js, Express.js | RESTful API server |
| **Database** | MySQL 8.0 | Execution metadata storage |
| **Queue** | Redis 7 | Job queue with blocking pop |
| **Container Runtime** | Docker | Isolated code execution |
| **Reverse Proxy** | NGINX | Traffic routing, static file serving |
| **Orchestration** | Docker Compose | Multi-container management |

---

## ✨ Features

### Core Capabilities

- ✅ **Multi-language Support** — Execute Python and Node.js code
- ✅ **Sandboxed Execution** — Each job runs in an isolated container
- ✅ **Resource Limits** — Memory (128MB), CPU (0.5 cores), PIDs (64)
- ✅ **Network Isolation** — Sandbox containers have no network access
- ✅ **Execution Timeout** — Prevents infinite loops (configurable)
- ✅ **Real-time Polling** — Live status updates in the UI

### Production-Ready Features

- ✅ **Atomic Job Claiming** — Prevents duplicate processing in multi-worker setups
- ✅ **Stuck Job Recovery** — Background monitor recovers failed jobs
- ✅ **Graceful Shutdown** — Clean termination on SIGTERM/SIGINT
- ✅ **Structured Logging** — Timestamped logs with severity levels
- ✅ **Health Checks** — `/health` endpoint for monitoring
- ✅ **UUID-based Job IDs** — Globally unique identifiers

### Security Hardening

- ✅ **No Privileged Containers** — All capabilities dropped
- ✅ **Read-only Execution** — Code passed via stdin, no file system writes
- ✅ **No Network Access** — `--network none` for sandbox containers
- ✅ **Security Options** — `--security-opt no-new-privileges`

---

## 🔄 How It Works

### Execution Flow

```
┌─────────────────────────────────────────────────────────────────────┐
│                        EXECUTION PIPELINE                           │
└─────────────────────────────────────────────────────────────────────┘

  Step 1          Step 2          Step 3          Step 4          Step 5
    │               │               │               │               │
    ▼               ▼               ▼               ▼               ▼
┌────────┐    ┌──────────┐    ┌──────────┐    ┌──────────┐    ┌────────┐
│  User  │───▶│ Backend  │───▶│  Redis   │───▶│  Worker  │───▶│ Result │
│ Submit │    │  API     │    │  Queue   │    │ Process  │    │ Shown  │
│  Code  │    │          │    │          │    │          │    │        │
└────────┘    └────┬─────┘    └──────────┘    └────┬─────┘    └────────┘
                   │                               │
                   │         ┌──────────┐          │
                   └────────▶│  MySQL   │◀─────────┘
                             │  Store   │
                             └──────────┘
```

### Step-by-Step Breakdown

1. **User Submits Code**
   - User writes code in the web dashboard
   - Selects language (Python or Node.js)
   - Clicks "Run Code"

2. **Backend Processes Request**
   - Validates input (language, code size)
   - Generates UUID for the job
   - Inserts job record into MySQL (status: `pending`)
   - Pushes job ID to Redis queue
   - Returns job ID to frontend

3. **Worker Picks Up Job**
   - Worker uses `BRPOP` to block-wait on Redis queue
   - Receives job ID from queue
   - Atomically claims job (UPDATE with WHERE status='pending')

4. **Sandboxed Execution**
   - Worker spawns Docker container with security restrictions
   - Code is base64-encoded and piped to interpreter
   - Captures stdout and stderr
   - Enforces timeout limits

5. **Results Stored & Displayed**
   - Worker updates MySQL with results (stdout, stderr, execution time)
   - Frontend polls `/api/result/:jobId` every second
   - UI displays output when status is `completed` or `failed`

---

## 📁 Folder Structure

```
dockforge/
├── backend/                    # Express.js API server
│   ├── Dockerfile
│   ├── package.json
│   └── src/
│       ├── server.js           # Main entry point
│       ├── config/
│       │   ├── db.js           # MySQL connection pool
│       │   └── redis.js        # Redis client
│       ├── controllers/
│       │   └── execution.controller.js
│       ├── routes/
│       │   └── execution.routes.js
│       └── services/
│           └── execution.service.js
│
├── worker/                     # Job processing worker
│   ├── Dockerfile
│   ├── package.json
│   └── src/
│       ├── worker.js           # Main worker loop
│       └── config/
│           ├── db.js           # MySQL connection
│           └── redis.js        # Redis client
│
├── frontend/                   # Static web dashboard
│   ├── index.html
│   ├── style.css
│   └── script.js
│
├── nginx/                      # Reverse proxy configuration
│   ├── Dockerfile
│   └── nginx.conf
│
├── mysql/                      # Database initialization
│   └── init.sql                # Schema definition
│
├── scripts/                    # Utility scripts
│   └── wait-for-db.sh
│
├── docker-compose.yml          # Container orchestration
├── .env                        # Environment variables
├── .gitignore
└── README.md
```

---

## 🚀 Installation

### Prerequisites

| Requirement | Version | Purpose |
|-------------|---------|---------|
| **Docker** | 20.10+ | Container runtime |
| **Docker Compose** | 2.0+ | Multi-container orchestration |
| **Git** | Any | Clone repository |

### Quick Start

```bash
# Clone the repository
git clone https://github.com/Tripadh/dockforge.git
cd dockforge

# Start all services
docker-compose up -d

# Verify containers are running
docker-compose ps

# Access the dashboard
# Open http://localhost:8080 in your browser
```

### First-Time Setup

```bash
# Pull required Docker images (speeds up first execution)
docker pull python:3.11-alpine
docker pull node:20-alpine

# Build and start services
docker-compose up -d --build

# Check logs
docker-compose logs -f backend worker
```

---

## 📖 Usage

### Web Dashboard

1. Navigate to `http://localhost:8080`
2. Write your code in the editor
3. Select language (Python or Node.js)
4. Click **Run Code** (or press `Ctrl+Enter`)
5. View results in the output panels

### API Endpoints

| Method | Endpoint | Description |
|--------|----------|-------------|
| `POST` | `/api/execute` | Submit code for execution |
| `GET` | `/api/result/:jobId` | Retrieve execution result |
| `GET` | `/health` | Health check endpoint |

### Example API Usage

```bash
# Submit Python code
curl -X POST http://localhost:8080/api/execute \
  -H "Content-Type: application/json" \
  -d '{"code": "print(\"Hello, World!\")", "language": "python"}'

# Response: {"jobId": "abc123-uuid", "status": "pending"}

# Get result
curl http://localhost:8080/api/result/abc123-uuid

# Response: {"jobId": "...", "status": "completed", "stdout": "Hello, World!\n", "stderr": "", "executionMs": 150}
```

---


## 📈 Scaling & Future Improvements

### Horizontal Scaling

```yaml
# Scale workers to handle more concurrent jobs
docker-compose up -d --scale worker=5
```

### Planned Enhancements

| Feature | Status | Description |
|---------|--------|-------------|
| **More Languages** | 🔜 Planned | Go, Rust, Java, C++ support |
| **File Upload** | 🔜 Planned | Multi-file project execution |
| **Persistent Sessions** | 🔜 Planned | Save and share code snippets |
| **Authentication** | 🔜 Planned | User accounts with JWT |
| **Rate Limiting** | 🔜 Planned | Per-user execution quotas |
| **Metrics Dashboard** | 🔜 Planned | Prometheus + Grafana monitoring |
| **WebSocket Updates** | 🔜 Planned | Real-time status without polling |

### Performance Optimizations

- Container image pre-warming
- Connection pooling for MySQL
- Redis cluster for high availability
- Nginx caching for static assets

---

## 🔒 Security Considerations

### Container Isolation

| Security Measure | Implementation |
|------------------|----------------|
| **Network Isolation** | `--network none` — No internet access |
| **Memory Limit** | `--memory 128m` — Prevents memory bombs |
| **CPU Limit** | `--cpus 0.5` — Fair resource sharing |
| **PID Limit** | `--pids-limit 64` — Prevents fork bombs |
| **No Privileges** | `--cap-drop ALL` — All capabilities removed |
| **No Privilege Escalation** | `--security-opt no-new-privileges` |

### Input Validation

- Code size limit: 64KB maximum
- Language whitelist: Only `python` and `node` allowed
- UUID validation on job ID retrieval
- Base64 encoding to prevent shell injection

### Production Recommendations

- [ ] Run behind a firewall
- [ ] Use TLS/HTTPS termination at nginx
- [ ] Implement authentication for public deployments
- [ ] Enable rate limiting
- [ ] Regular security audits
- [ ] Keep Docker images updated

---

## 🤝 Contributing

Contributions are welcome! Here's how you can help:

### Getting Started

```bash
# Fork the repository
# Clone your fork
git clone https://github.com/YOUR_USERNAME/dockforge.git

# Create a feature branch
git checkout -b feature/amazing-feature

# Make your changes
# Commit with descriptive message
git commit -m "feat: add amazing feature"

# Push to your fork
git push origin feature/amazing-feature

# Open a Pull Request
```

### Contribution Guidelines

- Follow existing code style
- Write clear commit messages
- Add tests for new features
- Update documentation as needed
- Be respectful in discussions

### Areas for Contribution

- 🐛 Bug fixes
- ✨ New language support
- 📚 Documentation improvements
- 🧪 Test coverage
- 🔧 Performance optimizations
- 🎨 UI/UX enhancements

---

## 📄 License

This project is licensed under the **MIT License** — see the [LICENSE](LICENSE) file for details.

```
MIT License

Copyright (c) 2026 Tripadh

Permission is hereby granted, free of charge, to any person obtaining a copy
of this software and associated documentation files (the "Software"), to deal
in the Software without restriction, including without limitation the rights
to use, copy, modify, merge, publish, distribute, sublicense, and/or sell
copies of the Software, and to permit persons to whom the Software is
furnished to do so, subject to the following conditions:

The above copyright notice and this permission notice shall be included in all
copies or substantial portions of the Software.
```

---

<p align="center">
  <strong>Built with ❤️ by <a href="https://github.com/Tripadh">Tripadh</a></strong>
</p>

<p align="center">
  <a href="https://github.com/Tripadh/dockforge/issues">Report Bug</a> •
  <a href="https://github.com/Tripadh/dockforge/issues">Request Feature</a> •
  <a href="https://github.com/Tripadh/dockforge/stargazers">⭐ Star this repo</a>
</p>

---

<p align="center">
  <sub>If you found this project useful, please consider giving it a ⭐</sub>
</p>
