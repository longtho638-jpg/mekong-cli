# Notification Center Kit

A production-ready, self-hosted Notification Center system for modern web applications. It provides a unified API for sending real-time in-app notifications, email alerts, and webhooks, complete with a React UI component.

## Features

- 🔔 **In-App Feed**: Real-time bell widget with unread badge and dropdown list.
- ⚡ **Real-time**: WebSocket integration for instant updates.
- 📧 **Email Notifications**: HTML and plain text email template support.
- 🪝 **Webhooks**: Reliable event delivery with exponential backoff retries.
- 🎨 **Customizable UI**: Headless-friendly React components built with Tailwind CSS.
- 📱 **Push Notifications**: Web Push API integration ready.
- 🛡️ **Type-Safe**: Full TypeScript support and Pydantic validation.

## Architecture

- **Backend**: Python 3.9+, FastAPI, SQLite (Async), WebSockets.
- **Frontend**: React 18+, TypeScript, Tailwind CSS.
- **Communication**: REST API + WebSockets.

## Project Structure

```
notification-center-kit/
├── backend/                # FastAPI application
│   ├── app/
│   │   ├── api/            # API Endpoints
│   │   ├── core/           # Config, WebSockets, Email, Webhooks
│   │   ├── models/         # Database Models
│   │   └── schemas/        # Pydantic Schemas
│   └── email-templates/    # Jinja2 Email Templates
├── frontend/               # React Component Library
│   ├── src/
│   │   ├── components/     # NotificationFeed, etc.
│   │   ├── hooks/          # useNotifications hook
│   │   └── utils/          # Push manager
│   └── public/             # Service Worker
└── docs/                   # Documentation
```

## Quick Start

### Backend

1. Navigate to the backend directory:
   ```bash
   cd backend
   ```

2. Create a virtual environment and install dependencies:
   ```bash
   python -m venv venv
   source venv/bin/activate  # On Windows: venv\Scripts\activate
   pip install -r requirements.txt
   ```

3. Run the server:
   ```bash
   uvicorn app.main:app --reload --port 8000
   ```

### Frontend Integration

1. Copy the `frontend/src` contents to your React project.
2. Install required dependencies:
   ```bash
   npm install lucide-react date-fns clsx tailwind-merge
   ```
3. Import and use the component:
   ```tsx
   import { NotificationFeed } from './components/NotificationFeed';

   function App() {
     return (
       <nav>
         <NotificationFeed userId="user_123" />
       </nav>
     );
   }
   ```

## Configuration

Configure the backend using environment variables or `backend/app/core/config.py`.

## License

Commercial License. See LICENSE file for details.
