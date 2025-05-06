# Firebase Firestore Client

A web-based client for exploring and managing Firebase Firestore databases and Authentication users.

## Features

- View and manage multiple Firestore databases
- Browse collections and documents
- Filter and search documents
- Edit and create documents
- View and manage Firebase Authentication users
- Support for multiple tenants

## Getting Started

### Prerequisites

- Node.js 20 or later
- Firebase project with Firestore and Authentication enabled
- Firebase Admin SDK service account key

### Installation

1. Clone the repository
2. Install dependencies:
   \`\`\`bash
   npm install
   \`\`\`
3. Create a `.env.local` file with your Firebase service account:
   \`\`\`
   FIREBASE_SERVICE_ACCOUNT={"type":"service_account","project_id":"..."}
   \`\`\`
4. Start the development server:
   \`\`\`bash
   npm run dev
   \`\`\`

## Deployment

This project can be deployed to Vercel:

1. Push your code to a Git repository
2. Import the project in Vercel
3. Add the `FIREBASE_SERVICE_ACCOUNT` environment variable
4. Deploy

## License

MIT
\`\`\`

```gitignore file=".gitignore"
# See https://help.github.com/articles/ignoring-files/ for more about ignoring files.

# dependencies
/node_modules
/.pnp
.pnp.js

# testing
/coverage

# next.js
/.next/
/out/

# production
/build

# misc
.DS_Store
*.pem

# debug
npm-debug.log*
yarn-debug.log*
yarn-error.log*

# local env files
.env*.local

# vercel
.vercel

# typescript
*.tsbuildinfo
next-env.d.ts
