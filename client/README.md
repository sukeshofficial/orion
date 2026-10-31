# Orion Client (Frontend)

The web interface for **Orion**, a single system to run plans, subscriptions and recurring billing in one place. It provides the admin dashboard where businesses manage customers, plans, subscriptions, payments and revenue analytics.

**Live demo:** [orion-ashen-seven.vercel.app](https://orion-ashen-seven.vercel.app/)

## Tech Stack

- [React](https://react.dev/): UI library
- [Tailwind CSS](https://tailwindcss.com/): utility-first styling
- [shadcn/ui](https://ui.shadcn.com/): accessible, customizable component library
- JavaScript (ES6+)

## Features

- Admin dashboard with an overview of key billing metrics
- Analytics for revenue and recurring billing
- Customer management
- Plan and subscription management
- Payment tracking
- Responsive layout for desktop and mobile

## Prerequisites

- [Node.js](https://nodejs.org/) 18 or later
- npm (comes with Node.js)
- The Orion backend running locally (see [`../server`](../server/README.md))

## Getting Started

1. **Clone the repository**

   ```bash
   git clone https://github.com/sukeshofficial/orion.git
   cd orion/client
   ```

2. **Install dependencies**

   ```bash
   npm install
   ```

3. **Set up environment variables**

   Create a `.env` file in the `client` folder:

   ```env
   VITE_API_URL=http://localhost:5000/api
   ```

   > Adjust the variable name and URL to match your setup. If your project does not use Vite, use the prefix your build tool requires (for example `REACT_APP_`).

4. **Start the development server**

   ```bash
   npm run dev
   ```

   The app will be available at the URL printed in the terminal (typically `http://localhost:5173`).

### Run frontend and backend together

From the **repository root**, one command starts both:

```bash
npm install
npm run dev
```

This uses `concurrently` to run `npm run dev` in both `client` and `server`.

## Available Scripts

| Command           | Description                            |
|-------------------|----------------------------------------|
| `npm run dev`     | Start the development server           |
| `npm run build`   | Create an optimized production build   |
| `npm run preview` | Preview the production build locally   |
| `npm run lint`    | Run the linter                         |

## Project Structure

```
client/
├── public/            # Static assets
├── src/
│   ├── components/    # Reusable UI components (including shadcn/ui)
│   ├── pages/         # Page-level components / routes
│   ├── lib/           # Utilities and helpers
│   ├── App.jsx        # Root component
│   └── main.jsx       # Entry point
├── package.json
└── README.md
```

> Update this tree to match the actual folders in `client/src`.

## Deployment

The frontend is deployed on [Vercel](https://vercel.com/).

1. Import the repository into Vercel.
2. Set the **Root Directory** to `client`.
3. Add the environment variables (such as `VITE_API_URL`) pointing to your deployed backend.
4. Deploy.

## Contributing

1. Fork the repository
2. Create a feature branch (`git checkout -b feature/your-feature`)
3. Commit your changes (`git commit -m "Add your feature"`)
4. Push the branch (`git push origin feature/your-feature`)
5. Open a pull request

## Author

**Sukesh**: [@sukeshofficial](https://github.com/sukeshofficial)
