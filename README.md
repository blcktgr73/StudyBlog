# StudyBlog Project

A comprehensive platform for sharing knowledge and learning together.

## Project Structure

```
StudyBlog/
├── CLAUDE.md          # Project development guidelines
├── studyhub/          # Main Next.js application
│   ├── src/           # Source code
│   ├── public/        # Static assets
│   └── README.md      # Application-specific docs
└── README.md          # This file
```

## Components

### StudyHub (Main Application)
A modern blog platform built with Next.js 14, TypeScript, and Tailwind CSS.

**Features:**
- 🌓 Dark/Light mode switching
- 📱 Responsive design
- 🎨 Modern UI with shadcn/ui
- ⚡ Fast performance with Turbopack
- 🔐 Authentication system with Supabase
- 🗃️ Database integration with Drizzle ORM
- 🚀 Production-ready deployment

## Development Status

### Phase 1: Core MVP
- [x] **Iteration 1**: Project initialization and basic UI setup ✅
- [x] **Iteration 2**: Database setup and authentication system ✅
- [x] **Iteration 3**: Build system fixes and TypeScript/ESLint resolution ✅
- [ ] **Iteration 4**: Post CRUD functionality
- [ ] **Iteration 5**: Search and category features

### Phase 2: Community Features
- [ ] **Iteration 6**: Comments system
- [ ] **Iteration 7**: Likes and bookmarks
- [ ] **Iteration 8**: User profiles and following

### Phase 3: Learning Tools
- [ ] **Iteration 9**: Personal dashboard
- [ ] **Iteration 10**: Study groups
- [ ] **Iteration 11**: Learning progress tracking

## Getting Started

1. Navigate to the studyhub directory:
```bash
cd studyhub
```

2. Install dependencies:
```bash
npm install
```

3. Start development server:
```bash
npm run dev
```

4. Open [http://localhost:3000](http://localhost:3000)

## Tech Stack

- **Frontend**: Next.js 14, TypeScript, Tailwind CSS
- **UI Components**: shadcn/ui
- **Theme**: next-themes
- **Database**: Supabase with Drizzle ORM
- **Authentication**: Supabase Auth
- **Deployment**: Vercel

## Development Guidelines

See `CLAUDE.md` for detailed development guidelines and coding standards.

## License

MIT License