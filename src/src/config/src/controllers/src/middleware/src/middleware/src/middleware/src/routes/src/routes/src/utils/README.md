# Ad Tracking SaaS - Backend

Server-side ad tracking platform for e-commerce orders.

## Features

- **Server-side tracking**: No cookies required (GDPR-friendly)
- **JWT Authentication**: Secure token-based authentication
- **Account Management**: Active/Suspended status handling
- **Production-ready**: Comprehensive logging, error handling, and security

## Tech Stack

- **Runtime**: Node.js
- **Framework**: Express.js
- **Database**: PostgreSQL
- **ORM**: Prisma
- **Authentication**: JWT + bcryptjs
- **Logging**: Winston
- **Security**: Helmet, CORS

## Quick Start

### Prerequisites

- Node.js 16+ 
- PostgreSQL 12+
- npm or yarn

### Installation

1. **Clone the repository**
```bash
git clone <repository-url>
cd adtracking-saas
```

2. **Install dependencies**
```bash
npm install
```

3. **Configure environment**
```bash
cp .env.example .env
```

Edit `.env` with your configuration:
```env
DATABASE_URL="postgresql://user:password@localhost:5432/adtracking_saas"
JWT_SECRET="your-secret-key-minimum-32-characters"
```

4. **Setup database**
```bash
npm run prisma:push
npm run prisma:generate
```

5. **Start server**
```bash
# Development
npm run dev

# Production
npm start
```

Server runs on `http://localhost:3000`

## API Documentation

### Health Check

**GET** `/api/health`

Response:
```json
{
  "success": true,
  "message": "Service healthy",
  "timestamp": "2026-02-03T10:30:45.123Z",
  "uptime": 123.456,
  "environment": "development"
}
```

### Authentication

#### Register

**POST** `/api/auth/register`

Request:
```json
{
  "email": "user@example.com",
  "password": "SecurePass123",
  "firstName": "John",
  "lastName": "Doe"
}
```

Response (201):
```json
{
  "success": true,
  "message": "User registered successfully",
  "data": {
    "user": {
      "id": "clxxx1234567890",
      "email": "user@example.com",
      "firstName": "John",
      "lastName": "Doe",
      "status": "ACTIVE",
      "createdAt": "2026-02-03T10:30:45.123Z"
    },
    "token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9..."
  }
}
```

#### Login

**POST** `/api/auth/login`

Request:
```json
{
  "email": "user@example.com",
  "password": "SecurePass123"
}
```

Response (200):
```json
{
  "success": true,
  "message": "Login successful",
  "data": {
    "user": {
      "id": "clxxx1234567890",
      "email": "user@example.com",
      "firstName": "John",
      "lastName": "Doe",
      "status": "ACTIVE",
      "createdAt": "2026-02-03T10:30:45.123Z"
    },
    "token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9..."
  }
}
```

#### Get Current User

**GET** `/api/auth/me`

Headers:
```
Authorization: Bearer <token>
```

Response (200):
```json
{
  "success": true,
  "data": {
    "user": {
      "id": "clxxx1234567890",
      "email": "user@example.com",
      "firstName": "John",
      "lastName": "Doe",
      "status": "ACTIVE",
      "createdAt": "2026-02-03T10:30:45.123Z"
    }
  }
}
```

#### Refresh Token

**POST** `/api/auth/refresh`

Headers:
```
Authorization: Bearer <token>
```

Response (200):
```json
{
  "success": true,
  "message": "Token refreshed successfully",
  "data": {
    "token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9..."
  }
}
```

## Database Schema

### User

| Field | Type | Description |
|-------|------|-------------|
| id | String (cuid) | Unique identifier |
| email | String (unique) | User email |
| password | String | Hashed password |
| firstName | String? | Optional first name |
| lastName | String? | Optional last name |
| status | AccountStatus | ACTIVE, SUSPENDED, or PENDING |
| createdAt | DateTime | Account creation timestamp |
| updatedAt | DateTime | Last update timestamp |
| lastLoginAt | DateTime? | Last login timestamp |

## Security Features

- **Helmet.js**: Security headers
- **CORS**: Cross-origin protection
- **JWT**: Token-based authentication
- **bcryptjs**: Password hashing (12 rounds)
- **Input validation**: express-validator
- **Error handling**: Centralized error middleware
- **Logging**: Winston with multiple transports

## Password Requirements

- Minimum 8 characters
- At least one uppercase letter
- At least one lowercase letter
- At least one number

## Account Status

- **ACTIVE**: Normal account with full access
- **SUSPENDED**: Account suspended (used for payment failures)
- **PENDING**: Initial state (not currently used)

## Logging

Logs are stored in the `/logs` directory:

- `combined.log`: All logs
- `error.log`: Error logs only
- `exceptions.log`: Uncaught exceptions
- `rejections.log`: Unhandled promise rejections

## Environment Variables

| Variable | Description | Default |
|----------|-------------|---------|
| NODE_ENV | Environment mode | development |
| PORT | Server port | 3000 |
| DATABASE_URL | PostgreSQL connection string | - |
| JWT_SECRET | JWT signing secret | - |
| JWT_EXPIRES_IN | Token expiration | 7d |
| ALLOWED_ORIGINS | CORS allowed origins | http://localhost:3000 |
| LOG_LEVEL | Logging level | info |

## Scripts
```bash
npm run dev          # Start development server with nodemon
npm start            # Start production server
npm run prisma:push  # Push schema to database
npm run prisma:generate  # Generate Prisma client
npm run prisma:migrate   # Create migration
npm run prisma:studio    # Open Prisma Studio
```

## Error Codes

| Code | Description |
|------|-------------|
| 200 | Success |
| 201 | Created |
| 400 | Bad Request / Validation Error |
| 401 | Unauthorized |
| 403 | Forbidden (Account Suspended) |
| 404 | Not Found |
| 409 | Conflict (Duplicate) |
| 500 | Internal Server Error |
| 503 | Service Unavailable |

## Testing

Health check:
```bash
curl http://localhost:3000/api/health
```

Register user:
```bash
curl -X POST http://localhost:3000/api/auth/register \
  -H "Content-Type: application/json" \
  -d '{
    "email": "test@example.com",
    "password": "SecurePass123",
    "firstName": "Test",
    "lastName": "User"
  }'
```

Login:
```bash
curl -X POST http://localhost:3000/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{
    "email": "test@example.com",
    "password": "SecurePass123"
  }'
```

Get current user:
```bash
curl http://localhost:3000/api/auth/me \
  -H "Authorization: Bearer YOUR_TOKEN"
```

## Deployment

### Replit

1. Import repository to Replit
2. Add PostgreSQL database from Tools menu
3. Configure environment variables in Secrets
4. Run `npm run prisma:push`
5. Run `npm start`

### Production Considerations

- Use strong JWT_SECRET (minimum 32 characters)
- Enable HTTPS
- Configure proper CORS origins
- Set up database backups
- Monitor logs
- Set NODE_ENV=production

## Future Modules

- Billing integration (Stripe)
- Marketplace integrations (Shopify, WooCommerce, BigCommerce, Magento)
- Ad platform integrations (Meta, Google, TikTok, Snapchat, Pinterest, Reddit, X)
- Usage tracking
- Admin dashboard

## License

ISC

## Support

For issues and questions, please open a GitHub issue.
