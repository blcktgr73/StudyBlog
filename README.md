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

## Development Status

### Phase 1: Core MVP
- [x] **Iteration 1**: Project initialization and basic UI setup ✅
- [ ] **Iteration 2**: Database setup and authentication system
- [ ] **Iteration 3**: Post CRUD functionality
- [ ] **Iteration 4**: Search and category features

### Phase 2: Community Features
- [ ] **Iteration 5**: Comments system
- [ ] **Iteration 6**: Likes and bookmarks
- [ ] **Iteration 7**: User profiles and following

### Phase 3: Learning Tools
- [ ] **Iteration 8**: Personal dashboard
- [ ] **Iteration 9**: Study groups
- [ ] **Iteration 10**: Learning progress tracking

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
- **Database**: Supabase (planned)
- **Authentication**: Supabase Auth (planned)
- **Deployment**: Vercel

## Development Guidelines

See `CLAUDE.md` for detailed development guidelines and coding standards.

## License

MIT License