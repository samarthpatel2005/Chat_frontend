# Frontend - Web Wizard Chat

This is the frontend client for the Web Wizard real-time chat application built with Next.js.

## Quick Start

1. Install dependencies:
   ```bash
   npm install
   ```

2. Create `.env.local` file:
   ```env
   NEXT_PUBLIC_API_URL=http://localhost:5000
   NEXT_PUBLIC_SOCKET_URL=http://localhost:5000
   ```

3. Start development server:
   ```bash
   npm run dev
   ```

## Scripts

- `npm run dev` - Start development server
- `npm run build` - Build for production
- `npm start` - Start production server
- `npm run lint` - Run ESLint

## Dependencies

- **next** - React framework
- **react** - UI library
- **axios** - HTTP client
- **socket.io-client** - Real-time communication client