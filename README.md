# Prateek Singh - Portfolio

**Tech stack:** React • TypeScript • Vite • GSAP • Three.js • WebGL

## Live Demo 🚀

View the live deployment here: https://prateek-portfolio-tau.vercel.app/

## Local AI chat (optional)

Create `.env.local` in the project root:

```
GROQ_API_KEY=your_groq_api_key_here
```

Then run `npm run dev`.

The local API listens on port 8787. If that port is taken, add `DEV_API_PORT=8788` (any free port) to `.env.local`; both the API server and the Vite proxy read it.

## Quick Start

1. Clone the repo:

```
git clone https://github.com/Prateekiiitg56/Prateek-Portfolio.git
cd Prateek-Portfolio
```

2. Install dependencies and run development server:

```powershell
npm install
npm run dev
```

3. Build for production:

```powershell
npm run build
```

## Scripts

| Command | What it does |
| --- | --- |
| `npm run dev` | Starts the site (Vite) and the local chat API together |
| `npm run dev:web` | Starts only the site, when you don't need the chat |
| `npm run dev:api` | Starts only the local chat API (`server/dev-api.cjs`) |
| `npm run build` | Type checks and builds the production site into `dist` |
| `npm run preview` | Serves the production build locally |
| `npm run lint` | Runs ESLint |

## Deployment

This project is deployed on Vercel. Build command: `npm run build`, Output directory: `dist`.

If you prefer GitHub Pages, you can build and publish the `dist` folder to Pages or keep using Vercel for serverless APIs.

## Contributing

If you see any issues or want to contribute, open a PR or an issue on GitHub.

## License

This project is open source and available under the [MIT License](LICENSE).
