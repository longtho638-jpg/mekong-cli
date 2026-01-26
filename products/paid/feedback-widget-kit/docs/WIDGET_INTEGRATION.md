# Integration Guide

How to add the **Feedback Widget** to your React application.

## Option 1: Source Integration (Recommended)

Since this is a kit, the best way is to copy the source code into your project to have full control over styling and behavior.

1. **Copy Files**:
   Copy `feedback-widget-kit/widget/src` to your project, e.g., `src/features/feedback`.

2. **Install Dependencies**:
   ```bash
   npm install lucide-react framer-motion html2canvas clsx tailwind-merge
   ```

3. **Usage**:

   ```tsx
   import { FeedbackWidget } from './features/feedback/components/FeedbackWidget';

   function App() {
     return (
       <div>
         <YourApp />

         <FeedbackWidget
           apiEndpoint="http://localhost:8000/api/v1/feedback"
           position="bottom-right"
           primaryColor="#2563eb"
         />
       </div>
     );
   }
   ```

## Option 2: Build as Library

If you prefer to keep it separate, you can build it as a package.

1. **Build**:
   ```bash
   cd feedback-widget-kit/widget
   npm install
   npm run build
   ```

2. **Link/Install**:
   You can `npm link` this package or install the tarball.

## Customization

### Styling
The widget uses Tailwind CSS. You can customize the colors in `FeedbackWidget.tsx` or modify the classes directly.

### Backend Endpoint
Ensure your backend is running and reachable. If you encounter CORS issues, configure `allow_origins` in `backend/app/main.py`.

## Authentication
By default, the feedback submission is public. If you want to associate feedback with a user, you can pass metadata:

The hook `useFeedback` automatically captures some metadata, but you can extend `FeedbackWidget` to accept `userId` or `email` props and pass them to the `submitFeedback` function.
