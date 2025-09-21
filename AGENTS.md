# Agents Helper File

## Backend Commands

### Development
- `npm start` - Start the backend server in development mode with nodemon
- `npm run dev` - Same as npm start (if configured)

### Testing/Validation
- `npm list --depth=0` - Check installed packages
- `node -c server.js` - Syntax check for server.js

### Directory: `/d:/SHANTHI GROUPS/SHANTHI ONLINE GOLD/SOG WEBSITE/shanthi-online-gold/backend`

## Frontend Commands

### Development
- `npm run dev` - Start the frontend development server
- `npm run build` - Build for production
- `npm run preview` - Preview production build

### Directory: `/d:/SHANTHI GROUPS/SHANTHI ONLINE GOLD/SOG WEBSITE/shanthi-online-gold/frontend`

## Project Structure

### Backend
- **Models**: `/backend/models/` - MongoDB schemas
- **Routes**: `/backend/routes/` - API endpoints
- **Middleware**: `/backend/middleware/` - Authentication and utilities
- **Config**: `/backend/config/` - Database and Firebase configuration

### API Endpoints

#### Cart API (`/api/cart`)
- `GET /api/cart` - Get user's cart items
- `POST /api/cart` - Add item to cart
- `PUT /api/cart/:itemId` - Update cart item quantity
- `DELETE /api/cart/:itemId` - Remove item from cart
- `DELETE /api/cart` - Clear entire cart
- `POST /api/cart/checkout` - Process checkout (create order and clear cart)
- `GET /api/cart/count` - Get cart items count

All cart endpoints require authentication via Firebase token or JWT.

### Authentication
- Uses Firebase Authentication and local JWT
- Middleware: `verifyAuthFlexible` - Accepts both Firebase ID tokens and local JWTs
- User identification works with both Firebase UID and local user IDs

### Database
- MongoDB with Mongoose ODM
- Connection configured in `/backend/config/db.js`
- Models use timestamps and proper validation

## Code Style Conventions

- Use camelCase for variables and functions
- Use PascalCase for models and schemas
- Include proper error handling with try-catch blocks
- Return consistent JSON responses with success/error flags
- Use async/await instead of promises
- Include descriptive error messages
- Follow RESTful API patterns
