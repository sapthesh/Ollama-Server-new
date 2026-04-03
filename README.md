# Ollama Service monitoring system

This is a high-performance system for monitoring and detecting the availability of Ollama services. It provides a premium **Glassmorphism** web interface with real-time detection, TPS benchmarking, and automated data governance.

---

## 🔥 New Features

### 💎 Premium Glassmorphism UI
- **Modern Aesthetic**: Built with `backdrop-blur-xl`, `bg-white/5`, and a thin `border-white/10`.
- **Dynamic Status Glows**:
  - 🔴 **Offline Mode**: Servers unreachable display a desaturated red glow and expansion is disabled.
  - 🟢 **Neon Pulse**: Online servers feature a vibrant green "heartbeat" pulse animation.
- **Accordion Model Discovery**: Organized grid of model tags with `hover-lift` internal transitions and header pill-shaped badges.

### 🧹 Daily Automated Pruning
The system includes a built-in data governance service that:
- **Health Checks**: Pings every IP in the master list every 24 hours.
- **Automated Removal**: Automatically removes unreachable or dead IPs from the `public/data.json` and Redis storage.
- **Metadata Sync**: Updates model lists and TPS values for all active servers.

### 🔍 Live Dashboard Discovery
- **Personal Server List**: Add custom IPs directly from the dashboard; they are stored in your browser's `localStorage`.
- **Zero-Backend Dependency**: Manage your own private list of servers while benefiting from the global monitoring tools.

---

## 🛠 Technology Stack

- **Framework**: [Next.js 15.1.9](https://nextjs.org/) (Security Patched)
- **Styling**: [Tailwind CSS 3.4](https://tailwindcss.com/)
- **Components**: [Headless UI](https://headlessui.com/) & [Heroicons](https://heroicons.com/)
- **State**: [React 19](https://react.dev/)
- **Storage**: Browser LocalStorage & [Upstash Redis](https://upstash.com/)

---

## 🚀 Getting Started

### Prerequisites

- Node.js 18.0 or higher
- npm or yarn package manager

### Installation

```bash
git clone https://github.com/forrany/Awesome-Ollama-Server.git
cd Awesome-Ollama-Server
npm install
```

### Development

```bash
npm run dev
```

Visit [http://localhost:3000](http://localhost:3000/) to view the application.

---

## 📅 Configuring Daily Pruning

To enable automated daily cleanup on Vercel:

1. **Environment Variable**: Add `CRON_SECRET` to your Vercel project environment variables.
2. **Endpoint**: Configure a Vercel Cron job to hit `https://your-domain.com/api/cron/prune` every 24 hours.
3. **Manual Trigger**: You can also manually trigger the pruning by calling the `pruneServersAction` from within the admin dashboard (if implemented).

---

## 🎯 Advanced Usage

### Management Actions
- **Copy URL**: One-click copy with visual heartbeat feedback.
* **Benchmark**: Re-test a specific server's TPS and model list instantly.
* **Delete**: Instantly remove a server from your personal and/or master list.

---

## 🛡 Disclaimer

1. This project is for security research and educational purposes only.
2. The author is not responsible for any losses caused by the use of this project.
3. Data is sourced from the internet; users are responsible for compliance with local regulations.

## 📄 License

MIT License - see the [LICENSE](LICENSE) file for details.
