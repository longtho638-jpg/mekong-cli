# Feedback Widget Kit

**A lightweight, drop-in React widget for collecting user feedback, bug reports, and screenshots.**

![Status](https://img.shields.io/badge/status-production--ready-green)
![React](https://img.shields.io/badge/react-18-blue)
![FastAPI](https://img.shields.io/badge/fastapi-0.109-green)

## Overview

The **Feedback Widget Kit** is a complete solution for adding feedback capabilities to your web application. It includes:
1.  **Widget**: A polished React component that floats on your site.
2.  **Backend**: A robust FastAPI service to store feedback and images.
3.  **Dashboard**: An admin interface to view and manage feedback.

## Features

- 📸 **Screenshot Capture**: Built-in screenshot functionality using `html2canvas`.
- 🎨 **Headless & Customizable**: Built with Tailwind CSS, easy to style.
- 🚀 **Full Backend**: Production-ready FastAPI backend with SQLite/Postgres support.
- 📊 **Admin Dashboard**: React-based dashboard to manage and view feedback.
- 📱 **Responsive**: Works perfectly on mobile and desktop.
- 🔒 **Type-Safe**: Full TypeScript support.

## Quick Start

### 1. Installation

Clone the repository or download the package.

```bash
cd feedback-widget-kit
```

### 2. Start Backend & DB

Use Docker Compose for an instant setup:

```bash
docker-compose up -d --build
```
The API will be available at `http://localhost:8000`.

### 3. Integrate the Widget

Copy the `widget/src` folder into your React project or build it as a library.

```tsx
import { FeedbackWidget } from './path/to/FeedbackWidget';

function App() {
  return (
    <>
      <YourApp />
      <FeedbackWidget apiEndpoint="http://localhost:8000/api/v1/feedback" />
    </>
  );
}
```

## Documentation

- [Installation Guide](docs/INSTALLATION.md) - Detailed backend & dashboard setup.
- [Widget Integration](docs/WIDGET_INTEGRATION.md) - How to use and customize the widget.
- [API Reference](docs/API_REFERENCE.md) - Backend endpoints documentation.
- [Configuration](docs/CONFIGURATION.md) - Environment variables and options.
- [Security](docs/SECURITY.md) - Best practices for production.

## License

MIT License. See [LICENSE.md](LICENSE.md) for details.
