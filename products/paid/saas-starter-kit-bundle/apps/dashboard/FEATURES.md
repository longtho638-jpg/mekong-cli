# Features Documentation

## 1. Real-Time Analytics Dashboard

The dashboard provides a live overview of your application's health and performance.

- **WebSocket Integration**: Connects to `NEXT_PUBLIC_WS_URL` to receive live updates for active users, revenue, and system status.
- **Live Charts**: Built with Recharts, these charts animate when new data points arrive without requiring a page refresh.
- **Time Ranges**: Filter data by Today, Week, Month, or Year.

## 2. User Management

A comprehensive system for managing application users.

- **Data Table**: Displays users with sortable columns and advanced filtering.
- **CRUD Operations**:
  - **Create**: Add new users via a modal form with Zod validation.
  - **Read**: View user details and profile.
  - **Update**: Edit user information and roles.
  - **Delete**: Remove users (soft delete supported).
- **Bulk Actions**: Select multiple users to delete or change status/roles in bulk.

## 3. Audit Logs

Track every action within your system for security and compliance.

- **Granular Tracking**: Records User ID, Action, Resource, Timestamp, and IP Address.
- **Filtering**: Search logs by user, action type, date range, or specific keywords.
- **Export**: Download filtered logs in CSV or JSON format for external analysis.

## 4. Notification Center

Keep administrators informed of critical events.

- **Inbox**: A dedicated page to view all notifications history.
- **Real-time Alerts**: Toast notifications appear instantly when important events occur.
- **Preferences**: Users can toggle specific notification types (e.g., enable System Alerts but disable Marketing).

## 5. File Manager

A robust interface for managing digital assets.

- **Upload**: Drag-and-drop zone supporting multi-file uploads.
- **File Browser**: Grid and List views with folder navigation.
- **Preview**: Built-in previewers for images and PDFs.
- **Management**: Rename, move, delete, and download files.
- **Quota**: Visual indicator of storage usage vs. limit.

## 6. Advanced Data Tables

The core component powering list views throughout the app.

- **Performance**: Optimized for large datasets with server-side pagination.
- **Export**: One-click export to CSV, Excel (.xlsx), and PDF.
- **Customization**: Toggle column visibility to focus on relevant data.
- **Selection**: Checkbox selection for individual rows or all visible rows.
