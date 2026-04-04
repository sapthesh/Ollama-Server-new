# Ollama Node Monitor (Streaming Edition)

A high-performance monitoring dashboard for Ollama nodes, featuring real-time streaming discovery, automatic pruning, and a minimalist Light/Dark UI.

---

## 🔥 New Feature: Real-Time Streaming Discovery

The discovery system has been re-engineered for transparency and speed:
- **Streaming Response**: The `/api/nodes/discover` endpoint now streams progress updates in real-time.
- **Progress Tracking**: Monitor scan progress, success, and pruning status live on the new `/status` dashboard.
- **Privacy Masking**: Node IPs are automatically masked in the activity logs (e.g., `192.168.x.x`) to maintain security.
- **Fail-Fast Performance**: Strict 5-second timeout per IP prevents discovery from hanging on unreachable servers.

---

## ⚡ Immediate Pruning Architecture

This version maintains a high-integrity database:
- **Auto-Deletion**: If a node returns a timeout or non-200 status during discovery, it is **instantly deleted** from the Supabase database.
- **Single Source of Truth**: Only nodes that pass the `/api/tags` handshake are persisted.
- **Ephemeral Logs**: Activity logs are stored in local state and auto-purged after 1 hour or upon session closure.

---

## 🎨 Minimalist UI / Multi-Theme Support

Now featuring a high-density, utility-first theme with full Light/Dark mode support.
- **Light Mode**: Paper-like aesthetic (#f9fafb) for maximum readability in bright environments.
- **Dark Mode**: Midnight theme (#0f1117) with subtle borders for high-focus monitoring.
- **Theme Toggle**: Switch modes instantly using the minimalist toggle in the global status bar.

---

## 🛠 Technology Stack

- **Framework**: Next.js 15.1.9 (Security Patched)
- **Database**: Supabase (PostgreSQL)
- **Styling**: Tailwind CSS (DarkMode: 'class')
- **Icons**: Heroicons

---

## 🚀 Getting Started

```bash
npm install
npm run dev
```

1. Add your Supabase credentials to `.env.local`.
2. Enter your node IPs in the dashboard.
3. Watch the real-time progress on the `/status` page.

---

## 🛡 Security

Updated to **Next.js 15.1.9** to mitigate **CVE-2025-66478**. Strictly enforced underscore-prefixed unused variables for clean production builds.

## 📄 License

MIT License - see the [LICENSE](LICENSE) file for details.
