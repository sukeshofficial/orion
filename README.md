# Orion

**One system to run plans, subscriptions and recurring billing in one place.**

Orion is a full-stack SaaS billing platform. It gives businesses a single admin dashboard to manage customers, define plans, run subscriptions, track payments and monitor revenue.

**Live demo:** [orion-ashen-seven.vercel.app](https://orion-ashen-seven.vercel.app/)

---

## Features

- **Plans:** create and manage pricing plans
- **Subscriptions:** handle the full subscription lifecycle
- **Recurring billing:** automate billing cycles
- **Customer management:** keep customer records in one place
- **Payment tracking:** monitor payment status and history
- **Analytics dashboard:** revenue insights and key billing metrics
- **Responsive UI:** works on desktop and mobile

> Edit this list to match what is currently implemented.

## Tech Stack

| Layer    | Technologies                                  |
|----------|-----------------------------------------------|
| Frontend | React, Tailwind CSS, shadcn/ui, JavaScript    |
| Backend  | Node.js, Express                              |
| Database | MongoDB                                       |
| Hosting  | Vercel (frontend)                             |

## Repository Structure

```
orion/
├── client/          # React frontend  → see client/README.md
├── server/          # Express backend → see server/README.md
├── package.json     # Root scripts to run both apps together
└── README.md
```

Detailed documentation for each part:

- [Frontend README](./client/README.md)
- [Backend README](./server/README.md)

## Getting Started

### Prerequisites

- [Node.js](https://nodejs.org/) 18 or later
- npm
- A MongoDB database (local or [MongoDB Atlas](https://www.mongodb.com/atlas))

### Installation

1. **Clone the repository**

   ```bash
   git clone https://github.com/sukeshofficial/orion.git
   cd orion
   ```

2. **Install dependencies**

   ```bash
   npm install
   npm install --prefix client
   npm install --prefix server
   ```

3. **Configure environment variables**

   Create a `.env` file in each folder. Example values:

   `server/.env`

   ```env
   PORT=5000
   MONGO_URI=mongodb://localhost:27017/orion
   JWT_SECRET=your_secret_key
   CLIENT_URL=http://localhost:5173
   ```

   `client/.env`

   ```env
   VITE_API_URL=http://localhost:5000/api
   ```

   > Match these names to the variables your code actually uses. Never commit `.env` files.

4. **Start both apps**

   ```bash
   npm run dev
   ```

   This runs the frontend and backend together using `concurrently`.

   - Frontend: `http://localhost:5173`
   - Backend: `http://localhost:5000`

### Run each app separately

```bash
# Frontend
npm run dev --prefix client

# Backend
npm run dev --prefix server
```

## Scripts

| Command                    | Description                                  |
|----------------------------|----------------------------------------------|
| `npm run dev`              | Start frontend and backend together          |
| `npm run dev --prefix client` | Start only the frontend                   |
| `npm run dev --prefix server` | Start only the backend                    |

## Deployment

- **Frontend:** deployed on Vercel with the root directory set to `client`.
- **Backend:** deploy to any Node.js host (Render, Railway, a VPS) and set the environment variables there. Use a hosted MongoDB such as Atlas.
- Set `VITE_API_URL` on the frontend to your deployed backend URL, and `CLIENT_URL` on the backend to your deployed frontend URL.

## Contributing

Contributions are welcome.

1. Fork the repository
2. Create a feature branch (`git checkout -b feature/your-feature`)
3. Commit your changes (`git commit -m "Add your feature"`)
4. Push the branch (`git push origin feature/your-feature`)
5. Open a pull request

## Roadmap

- [ ] Add your planned features here
- [ ] Payment gateway integration
- [ ] Invoice generation
- [ ] Email notifications

## License

Add a license here (for example MIT) and include a `LICENSE` file in the repository.

## Author

**Sukesh**: [@sukeshofficial](https://github.com/sukeshofficial)
