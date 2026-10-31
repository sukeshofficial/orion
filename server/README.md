# Orion Server (Backend)

The REST API powering **Orion**, a single system to run plans, subscriptions and recurring billing in one place. It manages users, customer profiles, role-based access and the data behind the analytics dashboard.

## Tech Stack

- [Node.js](https://nodejs.org/) with ES modules (`import` / `export`)
- [Express](https://expressjs.com/): web framework
- [MongoDB](https://www.mongodb.com/) with [Mongoose](https://mongoosejs.com/): database and schemas
- [dotenv](https://github.com/motdotla/dotenv): environment configuration

## Architecture

The backend follows a layered structure, so each layer has one job:

```
Route  →  Middleware  →  Controller  →  Service  →  Model
```

| Layer          | Responsibility                                                        |
|----------------|-----------------------------------------------------------------------|
| **Routes**     | Define endpoints and attach authentication, role and permission checks |
| **Middleware** | `authenticate`, `requireRole`, `requirePermission`                    |
| **Controllers**| Read the request, call a service, return a consistent JSON response   |
| **Services**   | Business logic, validation and database queries                       |
| **Models**     | Mongoose schemas and safe serialization helpers                       |

All responses use the same shape:

```json
{ "success": true, "message": "...", "customer": { } }
```

Errors return `{ "success": false, "message": "..." }` with the proper status code (400, 404, 409, 500, and so on).

## Features

- JWT-style authentication with role-based and permission-based access control
- Roles: `ADMIN`, `INTERNAL_USER` and regular customers
- Fine-grained permissions such as `customer.read`, `customer.create` and `customer.update`
- Customer profile management linked one-to-one with a user account
- Automatic unique customer number generation (`CUST-0001-1234`) or a custom one
- Pagination, search and active/inactive filtering
- Safe serialization that hides `_id` and `__v` and exposes a clean `id`

## Prerequisites

- [Node.js](https://nodejs.org/) 18 or later
- npm
- A MongoDB database: local install or [MongoDB Atlas](https://www.mongodb.com/atlas)

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

3. **Create a `.env` file** in the `server` folder:

   ```env
   PORT=5000
   MONGO_URI=mongodb://localhost:27017/orion
   JWT_SECRET=your_secret_key
   ADMIN_EMAIL=admin@example.com
   CLIENT_URL=http://localhost:5173
   NODE_ENV=development
   ```

   | Variable      | Description                                          |
   |---------------|------------------------------------------------------|
   | `PORT`        | Port the API listens on                              |
   | `MONGO_URI`   | MongoDB connection string                            |
   | `JWT_SECRET`  | Secret used to sign auth tokens                      |
   | `ADMIN_EMAIL` | Email of the primary admin account                   |
   | `CLIENT_URL`  | Frontend origin allowed by CORS                      |
   | `NODE_ENV`    | `development` or `production`                        |

   > Variable names other than `ADMIN_EMAIL` are assumptions. Match them to what `src/config/db.js` and your auth code actually read. Never commit `.env`.

4. **Start the server**

   ```bash
   npm run dev
   ```

### Run frontend and backend together

From the repository root:

```bash
npm install
npm run dev
```

## Project Structure

```
server/
├── scripts/
│   └── reactivate-admin.js     # Utility to restore admin access
├── src/
│   ├── config/
│   │   ├── db.js               # MongoDB connection
│   │   ├── roles.js            # USER_ROLES and role normalization
│   │   └── permissions.js      # PERMISSIONS constants
│   ├── controllers/
│   │   └── customer.controller.js
│   ├── middleware/
│   │   └── auth.middleware.js  # authenticate, requireRole, requirePermission
│   ├── models/
│   │   ├── user.model.js
│   │   └── customer.model.js
│   ├── routes/
│   │   └── customer.routes.js
│   └── services/
│       └── customer.service.js
├── .env
└── package.json
```

## API Reference

### Customers

Base path: `/api/customers` (adjust to wherever you mount the router)

All routes require authentication and a role of **Admin** or **Internal User**, plus the permission shown below. Regular end-users receive `403 Forbidden`.

| Method | Endpoint | Permission        | Description                    |
|--------|----------|-------------------|--------------------------------|
| GET    | `/`      | `customer.read`   | List customers                 |
| GET    | `/:id`   | `customer.read`   | Get one customer               |
| POST   | `/`      | `customer.create` | Create a customer profile      |
| PATCH  | `/:id`   | `customer.update` | Update a customer profile      |

#### Create a customer

`POST /api/customers`

```json
{
  "userId": "665f1c2e9b1e8a0012a34b56",
  "companyName": "Acme Pvt Ltd",
  "phone": "+91 98765 43210",
  "billingAddress": {
    "street": "12 Main Road",
    "city": "Chennai",
    "state": "Tamil Nadu",
    "country": "India",
    "postalCode": "600001"
  },
  "taxIdentificationNumber": "GSTIN123456",
  "customerNumber": "CUST-0001"
}
```

- `userId` is **required** and must belong to an existing user.
- `customerNumber` is optional. If omitted, one is generated automatically.
- Each user can have only one customer profile.

| Status | Meaning                                           |
|--------|---------------------------------------------------|
| 201    | Customer profile created                          |
| 400    | `userId` missing                                  |
| 404    | Associated user not found                         |
| 409    | Profile or customer number already exists         |

#### List customers

`GET /api/customers?page=1&limit=20&search=acme&status=active`

| Query param | Description                                                      |
|-------------|------------------------------------------------------------------|
| `page`      | Page number (default `1`)                                        |
| `limit`     | Items per page (default `20`, max `100`)                         |
| `search`    | Matches customer number, company, phone, or linked user name/email |
| `isActive`  | `true` or `false`                                                |
| `status`    | `active`, `inactive` or `disabled`                               |

Response:

```json
{
  "success": true,
  "customers": [ ],
  "pagination": { "total": 42, "page": 1, "limit": 20, "totalPages": 3 }
}
```

#### Get a customer

`GET /api/customers/:id`

`:id` can be either the customer profile ID or the linked user ID. Returns `404` if not found.

#### Update a customer

`PATCH /api/customers/:id`

Updatable fields: `companyName`, `phone`, `billingAddress` (merged with the existing address), `taxIdentificationNumber` and `isActive`.
Authentication fields on the user account cannot be changed through this endpoint.

## Data Models

### Customer

| Field                     | Type     | Notes                                       |
|---------------------------|----------|---------------------------------------------|
| `userId`                  | ObjectId | Reference to `User`, required, unique       |
| `customerNumber`          | String   | Required, unique, stored uppercase          |
| `companyName`             | String   | Optional                                    |
| `phone`                   | String   | Defaults to the user's phone if omitted     |
| `billingAddress`          | Object   | `street`, `city`, `state`, `country`, `postalCode` |
| `taxIdentificationNumber` | String   | Optional                                    |
| `isActive`                | Boolean  | Defaults to `true`                          |
| `createdAt` / `updatedAt` | Date     | Added automatically                         |

## Utility Scripts

### Reactivate admin

Restores access if an admin account has been disabled or lost its role.

```bash
node scripts/reactivate-admin.js
```

The script connects to MongoDB, then for the `ADMIN_EMAIL` user **and every user with the admin role** it sets the status to active, the role to admin and the permissions to `["*"]`. It then prints the matching records.

> Use it only for recovery. Make sure `ADMIN_EMAIL` is set in `.env`.

## Deployment

1. Host the API on a Node.js platform such as Render, Railway or a VPS.
2. Add all environment variables in the host's dashboard.
3. Use a hosted database such as MongoDB Atlas for `MONGO_URI`.
4. Set `CLIENT_URL` to your deployed frontend (for example `https://orion-ashen-seven.vercel.app`) so CORS allows it.

## Contributing

1. Fork the repository
2. Create a feature branch (`git checkout -b feature/your-feature`)
3. Commit your changes (`git commit -m "Add your feature"`)
4. Push the branch (`git push origin feature/your-feature`)
5. Open a pull request

## Author

**Sukesh**: [@sukeshofficial](https://github.com/sukeshofficial)
