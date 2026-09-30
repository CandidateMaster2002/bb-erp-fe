# BoltBlazers ERP Frontend (bb-erp-fe)

A modular, mobile-first React application for managing personal leads and interactions. Built with Vite, React 18, TypeScript, Tailwind CSS, React Router, TanStack Query, and more.

## Getting Started

1. Copy `.env.example` to `.env` and set `VITE_API_URL`.
2. Run `npm install`.
3. Run `npm run dev`.

## Project Structure

This project follows a feature-based modular monolith structure:
- `src/app/`: Core app configurations (router, layouts, providers).
- `src/shared/`: Reusable components, hooks, utils, and the API client.
- `src/modules/`: Feature-specific modules (e.g., `auth`, `leads`). Each module should be self-contained.

Future modules (accounts, staffing) can be easily added to `src/modules/`.
