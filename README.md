# 🎱 Cue Club Manager

A modern desktop application for managing a snooker / cue sports club — built with Electron, React, and SQLite for fast offline-first operations.

---

## 🚀 Tech Stack

- ⚡ Electron (Desktop Runtime)
- ⚛️ React 19 (UI Layer)
- ⚡ Vite (Build Tool)
- 🧠 Zustand (State Management)
- 🗄️ better-sqlite3 (Local Database)
- 🎨 Plain CSS (No UI frameworks)
- 📅 date-fns (Date utilities)
- 🎯 lucide-react (Icons)

---

## 📦 Features

- Player management system
- Match scheduling & tracking
- Score recording system
- Session history (offline-first)
- Lightweight SQLite storage
- Fast desktop performance (no backend dependency)

---

## 🧱 Architecture


Electron Main Process
↳ SQLite Database (better-sqlite3)
↳ IPC Bridge

Renderer (React + Vite)
↳ Zustand Store
↳ UI Components
↳ Local state + DB sync


---

## 🛠️ Installation

```bash
# Install dependencies
npm install
🧪 Development
# Run Electron + Vite dev server
npm run dev
📦 Build
# Production build
npm run build

# Package Electron app
npm run dist
🗃️ Database

Uses SQLite (better-sqlite3) for local persistence.

Fully offline
No external API dependency
Fast read/write operations

Database initializes automatically on first launch.

🧠 State Management

Managed using Zustand:

Lightweight global state
No boilerplate reducers
Direct mutation-based updates
🎨 UI Philosophy
Minimal design
Fast interactions
No heavy UI libraries
Focus on usability over aesthetics complexity
📁 Project Structure

/src
/renderer → React UI
/components → Reusable UI components
/store → Zustand stores
/utils → Helper functions

/main
electron main process
/db SQLite setup

📌 Roadmap
Player ranking system
Tournament module
Analytics dashboard
Payment tracking
Multi-table support
⚠️ Notes
Fully offline desktop application
Designed for low-latency club environments
Optimized for fast CRUD operations
👨‍💻 Developer

Built with focus on performance, simplicity, and real-world club management workflows.

📜 License

MIT