# QueryLab Frontend

Next.js frontend for QueryLab, a zero-install, in-browser PostgreSQL learning application powered by PGlite.

## 🚀 Quick Start

### Prerequisites

- Node.js 18+
- npm or pnpm
- Backend API running (see [Backend README](../Backend/README.md))

### Installation

1. **Clone the repository** (if not already done):
   ```bash
   git clone https://github.com/zamdevio/querylab.git
   cd querylab/Frontend
   ```

2. **Install dependencies**:
   ```bash
   npm install
   ```

3. **Configure API URL**:

   Create `Frontend/.env.local` file (this file is gitignored):
   ```env
   NEXT_PUBLIC_API_URL=http://localhost:8787
   ```

   Or update `src/lib/config.ts`:
   ```typescript
   const DEFAULT_API_URL = 'http://localhost:8787';
   ```

4. **Start development server**:
   ```bash
   npm run dev
   ```

   The frontend will run on `http://localhost:3000`

## 📋 Configuration

### Environment Variables

| Variable | Description | Required |
|----------|-------------|----------|
| `NEXT_PUBLIC_API_URL` | Backend API URL | Yes |

### API Configuration

The API URL can be set in two ways:

1. **Environment variable** (recommended for production):
   ```env
   NEXT_PUBLIC_API_URL=https://your-api.workers.dev
   ```

2. **Config file** (`src/lib/config.ts`):
   ```typescript
   const DEFAULT_API_URL = 'https://your-api.workers.dev';
   ```

   Priority: Environment variable > Config file default

## 🏗️ Architecture

### Tech Stack

- **Next.js 16**: React framework with App Router
- **React 19**: UI library
- **PGlite**: PostgreSQL compiled to WebAssembly for client-side execution
- **Monaco Editor**: VS Code's editor for SQL editing
- **Tailwind CSS**: Utility-first CSS framework
- **IndexedDB**: Browser storage for database persistence
- **Lucide React**: Icon library

### Project Structure

```
Frontend/
├── src/
│   ├── app/
│   │   ├── layout.tsx      # Root layout
│   │   ├── page.tsx         # Main application page
│   │   └── docs/
│   │       └── page.tsx     # Documentation page
│   ├── components/          # React components
│   │   ├── Editor.tsx       # Monaco SQL editor
│   │   ├── ResultTable.tsx  # Query results table
│   │   ├── SchemaExplorer.tsx # Database schema viewer
│   │   ├── AiModal.tsx      # AI query generation
│   │   ├── LoginModal.tsx   # User authentication
│   │   └── ...
│   └── lib/
│       ├── config.ts        # Configuration
│       ├── api.ts           # API client
│       ├── sqlClient.ts     # PGlite database client
│       ├── indexedDb.ts     # IndexedDB persistence
│       └── ...
├── public/                   # Static assets
├── next.config.js           # Next.js configuration
└── package.json
```

### Key Features

- **Client-Side PostgreSQL**: All SQL execution happens in the browser using PGlite
- **AI Integration**: Generate and fix SQL queries using AI
- **Database Persistence**: Databases stored in IndexedDB
- **Import/Export**: Load and save .sql files
- **Schema Explorer**: Visualize database structure
- **Responsive Design**: Mobile-first, works on all devices
- **Dark Mode**: Automatic theme switching

> 📖 **SQL Editor Guide**: See [`../Documentations/sql-editor.md`](../Documentations/sql-editor.md) for detailed SQL editor features and keyboard shortcuts

> 📖 **Database Management**: See [`../Documentations/database-management.md`](../Documentations/database-management.md) for import/export and database operations

> 📖 **AI Features**: See [`../Documentations/ai-features.md`](../Documentations/ai-features.md) for AI-powered SQL generation and error fixing

## 🎨 Development

### Running Locally

```bash
npm run dev
```

Visit `http://localhost:3000`

### Building for Production

```bash
npm run build
```

Output will be in the `out/` directory (static export).

### Linting

```bash
npm run lint
```

## 📦 Deployment

> 📖 **Detailed Deployment Guide**: See [`../Documentations/deployment.md`](../Documentations/deployment.md) for complete step-by-step deployment instructions for all platforms

### Deploy to Cloudflare Pages

1. **Build the project**:
   ```bash
   npm run build
   ```

2. **Deploy using Wrangler**:
   ```bash
   npm run cf:deploy
   ```

   Or manually:
   ```bash
   wrangler pages deploy out --project-name querylab
   ```

3. **Set environment variables** in Cloudflare Pages dashboard:
   - `NEXT_PUBLIC_API_URL`: Your backend Worker URL

### Deploy to Vercel

1. **Connect your GitHub repository** to Vercel

2. **Set environment variables**:
   - `NEXT_PUBLIC_API_URL`: Your backend API URL

3. **Deploy**: Vercel will automatically build and deploy

### Deploy to Netlify

1. **Build command**: `npm run build`
2. **Publish directory**: `out`
3. **Environment variables**:
   - `NEXT_PUBLIC_API_URL`: Your backend API URL

## 🔧 Configuration

### API URL Setup

The frontend needs to know where the backend API is located.

**For local development:**
```env
# .env.local
NEXT_PUBLIC_API_URL=http://localhost:8787
```

**For production:**
Set in your deployment platform's environment variables:
- Cloudflare Pages: Settings > Environment Variables
- Vercel: Project Settings > Environment Variables
- Netlify: Site Settings > Environment Variables

### Customization

- **Theme**: Edit `src/lib/theme.tsx` for theme configuration
- **API Client**: Modify `src/lib/api.ts` for API behavior
- **Database Client**: Update `src/lib/sqlClient.ts` for PGlite configuration

## 🐛 Troubleshooting

### API Connection Issues

- Verify `NEXT_PUBLIC_API_URL` is set correctly
- Check backend is running and accessible
- Check browser console for CORS errors
- Verify backend CORS allows your frontend domain

### Database Not Loading

- Check IndexedDB is enabled in browser
- Clear browser storage and try again
- Check browser console for errors
- Verify PGlite WASM files are loading

### Build Errors

- Ensure all dependencies are installed: `npm install`
- Check Node.js version (18+ required)
- Clear `.next` and `out` directories and rebuild
- Check for TypeScript errors: `npm run lint`

### Authentication Issues

- Verify cookies are enabled in browser
- Check backend authentication endpoints are working
- Ensure CORS credentials are configured correctly
- Check browser console for cookie-related errors

## 📚 Additional Resources

- [Next.js Documentation](https://nextjs.org/docs)
- [PGlite Documentation](https://github.com/electric-sql/pglite)
- [Monaco Editor](https://microsoft.github.io/monaco-editor/)
- [Tailwind CSS](https://tailwindcss.com/docs)

## 🤝 Contributing

See the main [README.md](../README.md) for contribution guidelines.

