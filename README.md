# tests

To install dependencies:

```bash
bun install
```

To run:

```bash
bun run index.ts
```

This project was created using `bun init` in bun v1.2.13. [Bun](https://bun.sh) is a fast all-in-one JavaScript runtime.
# FluxFinance

A simple financial application with authentication built using TDD (Test-Driven Development) approach.

## Features

- **Authentication**: Sign in functionality with SQLite database
- **Protected Routes**: Access control for protected areas (invoices, dashboard)
- **Responsive Design**: Clean, minimalist interface
- **Test-Driven Development**: Comprehensive test suite with Playwright

## Tech Stack

### Backend
- **Runtime**: Bun
- **Database**: SQLite with Prisma ORM
- **Authentication**: bcrypt for password hashing
- **API**: RESTful endpoints

### Frontend
- **HTML5**: Semantic markup
- **CSS3**: Modern styling with responsive design
- **JavaScript**: ES6+ with async/await
- **Testing**: Playwright for E2E testing


## Getting Started

### Prerequisites

- [Bun](https://bun.sh/) installed on your system
- Node.js (for test dependencies)

### Backend Setup

1. **Navigate to server directory:**
   ```bash
   cd server
   ```

2. **Install dependencies:**
   ```bash
   bun install
   ```

3. **Generate Prisma client:**
   ```bash
   bun run db:generate
   ```

4. **Run database migrations:**
   ```bash
   bun run db:migrate
   ```

5. **Start the server:**
   ```bash
   bun run dev
   ```

Server will start on `http://localhost:3000`

### Test Setup

1. **Navigate to tests directory:**
   ```bash
   cd tests
   ```

2. **Install test dependencies:**
   ```bash
   bun install
   ```

3. **Install Playwright browsers:**
   ```bash
   bunx playwright install
   # or if bunx doesn't work:
   npx playwright install
   ```

4. **Run tests:**
   ```bash
   bun run test
   # or:
   npm run test
   ```

## Available Scripts

### Backend (`server/`)
- `bun run dev` - Start development server
- `bun run db:generate` - Generate Prisma client
- `bun run db:migrate` - Run database migrations
- `bun run db:reset` - Reset database

### Tests (`tests/`)
- `bun run test` - Run all tests
- `bun run test:headed` - Run tests in browser
- `bun run test:ui` - Run tests in interactive UI mode
- `bun run report` - Show test report

## Authentication

The application uses a simple authentication system:

- Users must sign in to access protected routes
- Passwords are hashed using bcrypt
- Authentication state is managed with localStorage
- Protected routes automatically redirect to sign-in overlay

## API Endpoints


## Routes

- `/` - Homepage with sign-in form
- `/dashboard` - Dashboard (protected)
- `/invoices` - Invoices page (protected)
- `/invoices/:id` - Individual invoice (protected)

## Testing


Run tests with:
```bash
cd tests
bun run test
```

## Development Notes

### TDD Approach
This project was built using Test-Driven Development:
1. Tests were written first
2. Code was implemented to pass tests
3. Code was refactored while keeping tests green

### Database
The application uses SQLite for simplicity with Prisma as the ORM. The database schema includes:
- `User` table with email, hashed password, and timestamps

### Frontend Architecture
- Single Page Application (SPA) design
- JavaScript handles authentication state
- CSS uses flexbox and modern layout techniques
- Responsive design principles applied

## Troubleshooting

### Common Issues

1. **Tests timeout**: Make sure the backend server is running on port 3000
2. **Database errors**: Run `bun run db:generate` after schema changes
3. **Login not working**: Check if user exists in database
4. **Styling issues**: Clear browser cache and reload

### Debug Mode

To run tests with debug information:
```bash
cd tests
DEBUG=pw:* bun run test
```

## Contributing

1. Write tests first (TDD approach)
2. Implement minimal code to pass tests
3. Refactor while keeping tests green
4. Ensure all tests pass before submitting

## License

This project is created for educational purposes.