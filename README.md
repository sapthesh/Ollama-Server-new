# Ollama Node Monitor (Architectural Overhaul)

A high-performance, minimalist monitoring dashboard for Ollama nodes, redesigned for speed, utility, and real-time governance.

---

## 🔥 New Architecture: Immediate Pruning

This version introduces a "Fail-Fast" backend discovery model:
- **Real-time Deletion**: If a node returns a failure during health check, it is **instantly deleted** from the Supabase database.
- **Fail-Fast Addition**: New nodes are validated before being saved. If the initial ping fails, the node is rejected.
- **Minimalist Design**: Stripped of all glassmorphism and heavy animations, the UI is built for high-density monitoring using a "Utility-First" dark theme (#0f1117).

---

## 🛠 Technology Stack

- **Framework**: [Next.js 15.1.9](https://nextjs.org/) (Security Patched)
- **Database**: [Supabase](https://supabase.com/) (PostgreSQL)
- **Styling**: Tailwind CSS (Minimalist utility-first)
- **Components**: [Headless UI](https://headlessui.com/) & [Heroicons](https://heroicons.com/)

---

## 🚀 Supabase Integration

The app now uses Supabase for persistent, global node storage.

### Environment Variables

To run this project, you will need to add the following environment variables to your `.env.local` or Vercel Dashboard:

```env
NEXT_PUBLIC_SUPABASE_URL=your-project-url
NEXT_PUBLIC_SUPABASE_ANON_KEY=your-anon-key
```

### Table Schema

Ensure your Supabase project has a `nodes` table with the following structure:

| Column | Type | Default |
| :--- | :--- | :--- |
| `server` | text (unique) | - |
| `models` | text[] | [] |
| `tps` | float8 | 0 |
| `lastUpdate` | timestamptz | now() |
| `status` | text | 'success' |

---

## 📅 Maintenance & Monitoring

- **Status Filters**: Instantly toggle between `All`, `Online`, and `Offline` nodes.
- **Global Stats**: Real-time counter of total nodes vs. online nodes in the top bar.
- **Server Actions**: Discovery and pruning are handled via high-performance server-side interactions.

---

## 🚀 Getting Started

```bash
npm install
npm run dev
```

Visit [http://localhost:3000](http://localhost:3000/) to view the application.

---

## 🛡 Security

Updated to **Next.js 15.1.9** to mitigate **CVE-2025-66478**. Strictly enforced underscore-prefixed unused variables (`_var`) for clean production builds.

## 📄 License

MIT License - see the [LICENSE](LICENSE) file for details.
