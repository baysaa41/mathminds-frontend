# MathMinds.club Frontend

A modern educational mathematics platform built with React, featuring social learning, interactive content, and club-based study groups.

## 🚀 Tech Stack

- **Framework**: React 19 with Vite 7
- **UI**: Bootstrap 5 + React Bootstrap
- **State Management**: Context API + TanStack React Query
- **Routing**: React Router DOM v7
- **Math Rendering**: MathJax with custom Mongolian notation
- **Authentication**: OAuth 2.0 PKCE
- **Code Quality**: ESLint + Prettier
- **Testing**: Vitest + React Testing Library
- **TypeScript**: Configuration ready for incremental migration

## 📦 Getting Started

### Prerequisites

- Node.js 18+
- npm or yarn

### Installation

```bash
# Install dependencies
npm install

# Copy environment variables
cp .env.example .env

# Update .env with your configuration
```

### Development

```bash
# Start dev server (http://localhost:5173)
npm run dev

# Run tests in watch mode
npm test

# Run tests once
npm run test:run

# Run linter
npm run lint

# Format code
npm run format

# Check code quality (format + lint)
npm run check

# Fix code issues (format + lint)
npm run fix
```

### Building

```bash
# Build for production
npm run build

# Build with bundle analysis
npm run build:analyze

# Preview production build
npm run preview
```

## 🏗️ Project Structure

```
src/
├── api/              # Axios configuration
├── assets/           # Static assets
├── components/       # React components
│   └── common/       # Reusable components
├── constants/        # App constants
├── context/          # React Context providers
├── hooks/            # Custom React hooks
├── pages/            # Page components
├── routes/           # Route configurations
├── services/         # API services
├── test/             # Test utilities
└── utils/            # Utility functions
```

## 🧪 Testing

This project uses Vitest and React Testing Library for testing.

### Running Tests

```bash
# Watch mode
npm test

# Run once
npm run test:run

# With UI
npm run test:ui

# Coverage report
npm run test:coverage
```

### Example Tests

See example test files:
- `src/components/common/EmptyState.test.jsx` - Component testing
- `src/hooks/useToast.test.js` - Hook testing

## 🌍 Environment Variables

Create a `.env` file based on `.env.example`:

```bash
# API Configuration
VITE_API_BASE_URL=http://127.0.0.1:8000
VITE_BACKEND_URL=http://127.0.0.1:8000

# OAuth Configuration
VITE_MMO_CLIENT_ID=your_client_id
VITE_MMO_AUTH_URL=https://www.mmo.mn/o/authorize/
VITE_MMO_TOKEN_URL=https://www.mmo.mn/o/token/
VITE_MMO_REDIRECT_URI=http://localhost:5173/callback
VITE_MMO_SCOPE=profile
```

## 📝 Code Quality

### Linting

```bash
npm run lint        # Check for issues
npm run lint:fix    # Auto-fix issues
```

### Formatting

```bash
npm run format       # Format all files
npm run format:check # Check formatting
```

### All Checks

```bash
npm run check  # Run format check + lint
npm run fix    # Run format + lint fix
```

## 🎨 Key Features

- **Educational Content**: Articles, Problems, Formulas, Quizzes
- **Social Features**: Posts, Comments, Bookmarks, Following
- **Clubs System**: Teacher-led study groups
- **User Profiles**: Avatars, followers, achievements
- **Virtual Currency**: Coin transfer system
- **Rich Text Editing**: TipTap editor
- **Math Rendering**: Custom MathJax macros
- **Image Galleries**: ViewerJS integration
- **Responsive Design**: Mobile-friendly layout

## 🔒 Authentication

Dual authentication system:
1. **OAuth 2.0 PKCE** - MMO integration
2. **Username/Password** - Traditional login

## 🚢 Deployment

### Production Build

```bash
npm run build
```

The `dist/` folder will contain the production-ready files.

### Environment-Specific Builds

The app uses different `.env` files:
- `.env` - Development (default)
- `.env.production` - Production (used during build)

## 📊 Bundle Analysis

Analyze your bundle size:

```bash
npm run build:analyze
```

This will generate a `dist/stats.html` file with interactive bundle visualization.

## 🔧 TypeScript Migration

TypeScript is configured but not enforced. Migrate files incrementally:

1. Rename `.jsx` to `.tsx`
2. Add type annotations
3. Fix type errors
4. Repeat for next file

The `tsconfig.json` allows both JS and TS files to coexist.

## 🤝 Contributing

1. Follow the existing code style
2. Run `npm run fix` before committing
3. Write tests for new features
4. Update documentation as needed

## 📄 License

Private project - All rights reserved
