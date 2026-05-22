# Global City Insights Map

A full-stack real-time data dashboard displaying weather, AQI, population, and currency data for 10 global cities on an interactive world map.

## 🚀 Quick Start

### Backend
```bash
cd backend
npm install
npm run dev       # development (nodemon)
npm start         # production
```

### Frontend
Open `frontend/index.html` in a browser, or serve with any static server:
```bash
npx serve frontend
```

## 📁 Project Structure
```
global-city-insights/
├── backend/
│   ├── src/
│   │   ├── config/       # DB + cities config
│   │   ├── models/       # Mongoose schemas
│   │   ├── routes/       # REST API endpoints
│   │   ├── services/     # OpenWeatherMap + ExchangeRate APIs
│   │   └── jobs/         # Cron data fetcher
│   ├── .env              # API keys (DO NOT COMMIT)
│   └── render.yaml       # Render.com deploy config
└── frontend/
    ├── index.html
    ├── css/style.css
    ├── js/
    │   ├── config.js     # API URL + constants
    │   ├── api.js        # Backend calls + polling
    │   ├── map.js        # Leaflet map
    │   ├── modal.js      # City detail modal
    │   ├── charts.js     # Chart.js trend charts
    │   ├── gauge.js      # SVG temperature gauge
    │   └── app.js        # App bootstrap
    └── vercel.json       # Vercel deploy config
```

## 🌍 10 Cities Tracked
New York · London · Tokyo · Mumbai · Dubai · Sydney · Paris · São Paulo · Cairo · Singapore

## 🔌 APIs Used
- **OpenWeatherMap** — Weather + AQI (free tier)
- **ExchangeRate-API** — Currency vs INR (free tier)
- **MongoDB Atlas** — Data storage (free tier)

## 📡 API Endpoints
| Endpoint | Description |
|---|---|
| `GET /api/health` | Server health check |
| `GET /api/cities` | All 10 cities (latest snapshot) |
| `GET /api/cities/:id` | Single city latest data |
| `GET /api/cities/:id/history?days=7` | 7–15 day historical data |

## 🚢 Deployment
- **Backend** → [Render.com](https://render.com) (free tier, uses `render.yaml`)
- **Frontend** → [Vercel](https://vercel.com) (free tier, uses `vercel.json`)

After deploying backend, update `PROD_API_URL` in `frontend/js/config.js`.
