# System Architecture

The Email Marketing Kit is built as a modular, high-performance application designed for scalability and extensibility.

## 🏗️ High-Level Overview

```
[ Client / UI ]
      |
      v
[ Load Balancer / Nginx ]
      |
      v
[ FastAPI Application (API) ]
      |
      +---> [ PostgreSQL Database ] (Data Storage)
      |
      +---> [ Redis ] (Queue & Caching)
      |
      +---> [ Worker Process ] (Background Jobs)
               |
               v
      [ Email Providers ] (SMTP, SES, SendGrid)
```

## 🧩 Components

### 1. API Server (FastAPI)
- Handles all HTTP requests.
- Validates input data using Pydantic schemas.
- Manages business logic (Campaigns, Subscribers, Templates).
- Async I/O for high concurrency.

### 2. Database (PostgreSQL)
- Relational storage for all persistent data.
- **Models:**
    - `Campaign`: Stores campaign metadata and status.
    - `Subscriber`: Stores user info and status.
    - `MailingList`: Groups subscribers.
    - `Template`: Stores MJML/HTML templates.
    - `CampaignEvent`: Stores analytics (opens, clicks).

### 3. Background Workers (Async/Redis)
- Decouples heavy processing from the API.
- **Tasks:**
    - **Dispatch**: Fetches active subscribers for a campaign.
    - **Send**: Renders email and sends via provider.
    - **Retry**: Handles failed deliveries.

### 4. Email Providers
- Abstracted layer to switch between providers easily.
- **Supported:**
    - `SMTP`: Generic support for any mail server.
    - `AWS SES`: High-volume, low-cost sending.
    - `SendGrid`: Feature-rich delivery.

### 5. Template Engine
- **MJML**: Responsive email framework support.
- **Jinja2**: Variable substitution (e.g., `{{ first_name }}`).
- **Fallback**: Generates plain text versions automatically.

## 🔄 Data Flow

### Sending a Campaign
1.  **Trigger**: API request to `/campaigns/{id}/send`.
2.  **Dispatch**:
    - System validates campaign status.
    - `Dispatcher` creates a background job.
    - Worker fetches subscribers associated with the campaign.
3.  **Rendering**:
    - For each subscriber, the worker renders the template with their specific data.
    - Tracking pixels and click-tracking links are injected.
4.  **Delivery**:
    - The email object is passed to the configured Provider.
    - Provider sends the email.
5.  **Tracking**:
    - User opens email -> Request to `/t/o/...` -> Recorded in DB.
    - User clicks link -> Request to `/t/c/...` -> Recorded -> Redirected.

## 📈 Scalability Considerations

- **Database**: Use connection pooling (SQLAlchemy/AsyncPG). Index frequently queried fields (email, lists).
- **Queues**: Scale workers horizontally to handle large lists.
- **Tracking**: For high volume, tracking events can be buffered in Redis before writing to SQL.
