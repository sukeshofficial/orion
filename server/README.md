# Orion Server (Backend)

The REST API powering **Orion**, a single system to run plans, subscriptions and recurring billing in one place. It handles customers, plans, subscriptions, payments and the data behind the analytics dashboard.

## Tech Stack

- [Node.js](https://nodejs.org/): runtime
- [Express](https://expressjs.com/): web framework
- [MongoDB](https://www.mongodb.com/): database (via Mongoose or the native driver)
- JavaScript (ES6+)

## Features

- RESTful API for customers, plans, subscriptions and payments
- Recurring billing and subscription lifecycle management
- Revenue and analytics endpoints for the dashboard
- Authentication and request validation
- Centralized error handling

> Edit this list to match what the API currently implements.

## Prerequisites

- [Node.js](https://nodejs.org/) 18 or later
- npm
- A MongoDB database: local install or a free [MongoDB Atlas](https://www.mongodb.com/atlas) cluster

## Getting Started

1. **Clone the repository**

   ```bash
   git clone https://github.com/sukeshofficial/orion.git
   cd orion/server
   ```

2. **Install dependencies**

   ```bash
   npm install
   ```

3. **Set up environment variables**

   Create a `.env` file in the `server` folder:

   ```env
   PORT=5000
   MONGO_URI=mongodb://localhost:27017/orion
   JWT_SECRET=your_secret_key
   CLIENT_URL=http://localhost:5173
   NODE_ENV=development
   ```

   | Variable     | Description                                   |
   |--------------|-----------------------------------------------|
   | `PORT`       | Port the API listens on                       |
   | `MONGO_URI`  | MongoDB connection string                     |
   | `JWT_SECRET` | Secret used to sign authentication tokens     |
   | `CLIENT_URL` | Frontend origin allowed by CORS               |
   | `NODE_ENV`   | `development` or `production`                 |

   > Match these names to the variables your code actually reads. Never commit your `.env` file; keep it in `.gitignore`.

4. **Start the server**

   ```bash
   npm run dev
   ```

   The API will run at `http://localhost:5000`.

### Run backend and frontend together

From the **repository root**:

```bash
npm install
npm run dev
```

## Available Scripts

| Command         | Description                                |
|-----------------|--------------------------------------------|
| `npm run dev`   | Start the server with auto-reload          |
| `npm start`     | Start the server in production mode        |

## API Overview

Base URL: `http://localhost:5000/api`

| Method | Endpoint                | Description               |
|--------|-------------------------|---------------------------|
| POST   | `/auth/register`        | Register a new user       |
| POST   | `/auth/login`           | Log in and receive a token|
| GET    | `/customers`            | List customers            |
| GET    | `/plans`                | List plans                |
| GET    | `/subscriptions`        | List subscriptions        |
| GET    | `/payments`             | List payments             |
| GET    | `/analytics/revenue`    | Revenue summary           |

> These are example routes. Replace them with your real endpoints.

## Project Structure

```
server/
├── config/         # Database and app configuration
├── controllers/    # Request handlers
├── middleware/     # Auth, validation, error handling
├── models/         # MongoDB schemas
├── routes/         # API route definitions
├── utils/          # Helper functions
├── server.js       # Entry point
├── package.json
└── README.md
```

> Update this tree to match the actual folders in `server/`.

## Deployment

1. Host the API on a Node.js platform such as Render, Railway or a VPS.
2. Set all environment variables in the platform's dashboard.
3. Point `MONGO_URI` to a hosted database such as MongoDB Atlas.
4. Set `CLIENT_URL` to your deployed frontend URL (for example `https://orion-ashen-seven.vercel.app`) so CORS allows it.

## Contributing

1. Fork the repository
2. Create a feature branch (`git checkout -b feature/your-feature`)
3. Commit your changes (`git commit -m "Add your feature"`)
4. Push the branch (`git push origin feature/your-feature`)
5. Open a pull request

## Author

**Sukesh**: [@sukeshofficial](https://github.com/sukeshofficial)
