

<img width="938" height="431" alt="image" src="https://github.com/user-attachments/assets/06158a9a-4331-4622-b24d-c10296064479" />


# SupportAI 🤖

**SupportAI** is a modern AI-powered customer support platform built with the **MERN stack**. It combines AI-assisted conversations, human-agent escalation, support tickets, customer profiles, real-time messaging, and account management into a single support experience.

The platform is designed to provide customers with fast AI assistance while allowing support agents and administrators to manage conversations and tickets efficiently.

---

## 🚀 Features

### 👤 Authentication & Authorization

* Customer registration
* Customer login
* JWT-based authentication
* Protected routes
* Role-based authorization
* Customer, Agent, and Admin roles
* Account status validation
* Last-seen tracking
* Persistent authentication after page refresh
* Secure password hashing using bcrypt

### 💬 AI Support Chat

* AI-powered customer conversations
* Real-time messaging architecture
* Conversation history
* AI-first support
* Human-agent escalation
* AI confidence-based escalation
* Conversation status management
* Message history
* Customer support context

### 🎫 Support Tickets

* Create support tickets
* View customer tickets
* Ticket status tracking
* Ticket priority
* Ticket categories
* Ticket updates
* Ticket resolution workflow
* Conversation-to-ticket support flow

### 👨‍💼 Customer Dashboard

Customers can manage:

* Conversations
* Support tickets
* Profile
* Account settings
* Security
* Notifications
* Support preferences
* Account activity

### 🧑 Profile Management

Customers can update:

* Full name
* Email
* Phone number
* Company
* Language
* Timezone
* Profile picture/avatar

Profile pictures are uploaded to the backend and served from the server's `avatars` directory.

### 🔐 Security

* Password hashing
* JWT authentication
* Protected API endpoints
* Role-based middleware
* Account status validation
* Password change functionality
* Input validation
* CORS configuration
* Secure API architecture

### 🔔 Notification Preferences

Customers can control:

* Email notifications
* Conversation notifications
* Ticket notifications
* Product and marketing notifications

### ⚙️ Support Preferences

Customers can configure:

* AI-first support
* Automatic escalation
* Conversation feedback

---

# 🏗️ Technology Stack

## Frontend

* React
* React Router
* Tailwind CSS
* Axios
* Lucide React
* JavaScript / JSX
* Vite

## Backend

* Node.js
* Express.js
* MongoDB
* Mongoose
* JWT
* bcryptjs
* Multer
* Cookie Parser
* CORS

## AI / Infrastructure

The architecture can be extended with:

* OpenAI
* Redis
* Pinecone
* Socket.IO
* Docker
* AWS
* Vector search
* Retrieval-Augmented Generation (RAG)

---

# 📁 Project Structure

```text
SupportAI/
│
├── client/
│   │
│   ├── src/
│   │   ├── components/
│   │   ├── pages/
│   │   │   ├── customer/
│   │   │   ├── auth/
│   │   │   └── ...
│   │   │
│   │   ├── context/
│   │   │   └── AuthContext.jsx
│   │   │
│   │   ├── services/
│   │   │   └── api.js
│   │   │
│   │   ├── App.jsx
│   │   └── main.jsx
│   │
│   ├── public/
│   ├── package.json
│   └── vite.config.js
│
├── server/
│   │
│   ├── src/
│   │   ├── config/
│   │   │   └── db.js
│   │   │
│   │   ├── controllers/
│   │   │   ├── authController.js
│   │   │   ├── customerController.js
│   │   │   ├── conversationController.js
│   │   │   ├── messageController.js
│   │   │   └── ticketController.js
│   │   │
│   │   ├── middleware/
│   │   │   ├── authMiddleware.js
│   │   │   ├── roleMiddleware.js
│   │   │   └── uploadMiddleware.js
│   │   │
│   │   ├── models/
│   │   │   ├── User.js
│   │   │   ├── Conversation.js
│   │   │   ├── Message.js
│   │   │   └── Ticket.js
│   │   │
│   │   ├── routes/
│   │   │   ├── authRoutes.js
│   │   │   ├── customerRoutes.js
│   │   │   ├── conversationRoutes.js
│   │   │   ├── messageRoutes.js
│   │   │   └── ticketRoutes.js
│   │   │
│   │   ├── utils/
│   │   │   └── generateToken.js
│   │   │
│   │   ├── avatars/
│   │   │   └── .gitkeep
│   │   │
│   │   ├── app.js
│   │   └── server.js
│   │
│   ├── .env
│   └── package.json
│
├── .gitignore
└── README.md
```

---

# 🔑 User Roles

SupportAI uses role-based access control.

| Role     | Permissions                                       |
| -------- | ------------------------------------------------- |
| Customer | Manage own profile, conversations and tickets     |
| Agent    | Manage assigned conversations and support tickets |
| Admin    | Full system management                            |

### Customer

Customers can:

* Start conversations
* Communicate with AI
* Request human assistance
* Create tickets
* View ticket history
* Update their profile
* Upload an avatar
* Change password
* Configure notifications
* Configure support preferences

### Agent

Agents can:

* View assigned conversations
* Respond to customers
* Manage tickets
* Escalate conversations
* Resolve support requests

### Admin

Administrators can:

* Manage users
* Manage agents
* Manage customers
* Manage tickets
* Monitor conversations
* Manage system settings
* Access administrative dashboards

---

# 🔐 Authentication Flow

The authentication system uses JWT.

```text
Customer
   │
   ▼
Register / Login
   │
   ▼
Express API
   │
   ▼
Validate Credentials
   │
   ▼
Generate JWT
   │
   ▼
React AuthContext
   │
   ▼
Store Token
   │
   ▼
Protected Requests
```

The frontend sends the token with protected API requests:

```text
Authorization: Bearer <token>
```

The backend authentication middleware validates the token before allowing access.

---

# 👤 Profile Management

Profile data is stored in MongoDB.

Example user document:

```json
{
  "_id": "user_id",
  "name": "Muhammad Bilal",
  "email": "customer@example.com",
  "phone": "+92 300 0000000",
  "company": "Personal Account",
  "avatar": "/avatars/profile-123456.jpg",
  "role": "customer",
  "status": "active"
}
```

The profile API returns the current user:

```http
GET /api/auth/profile
```

The authentication middleware identifies the user from the JWT.

---

# 🖼️ Avatar Upload

SupportAI uses **Multer** for profile image uploads.

The upload flow is:

```text
Select Image
     │
     ▼
React Profile Page
     │
     ▼
FormData
     │
     ▼
POST /api/customer/profile/avatar
     │
     ▼
Multer
     │
     ▼
server/avatars/
     │
     ▼
MongoDB avatar path
     │
     ▼
Profile API
     │
     ▼
React displays avatar
```

Example stored path:

```text
/avatars/68b123-profile.jpg
```

The server exposes the avatar directory as static content.

```js
app.use("/avatars", express.static("avatars"));
```

The frontend can then display:

```jsx
<img
  src={`http://localhost:8000${profile.avatar}`}
  alt={profile.name}
/>
```

---

# 💬 Conversation Architecture

A typical conversation follows this flow:

```text
Customer
   │
   ▼
Start Conversation
   │
   ▼
AI Assistant
   │
   ├── High confidence
   │       │
   │       ▼
   │    AI Response
   │
   └── Low confidence
           │
           ▼
      Human Escalation
           │
           ▼
        Agent
```

This allows SupportAI to automatically resolve simple questions while sending complex issues to human support.

---

# 🎫 Ticket Workflow

Tickets can follow a lifecycle such as:

```text
Open
  │
  ▼
In Progress
  │
  ▼
Waiting for Customer
  │
  ▼
Resolved
  │
  ▼
Closed
```

Possible ticket priorities:

```text
Low
Medium
High
Urgent
```

Possible categories:

```text
Technical
Billing
Account
Product
General
Other
```

---

# 🌐 API Structure

Base API:

```text
http://localhost:8000/api
```

## Health Check

```http
GET /api/health
```

Example response:

```json
{
  "success": true,
  "message": "SupportAI API is running."
}
```

---

## Authentication

### Register

```http
POST /api/auth/register
```

Request:

```json
{
  "name": "Muhammad Bilal",
  "email": "customer@example.com",
  "password": "Password123!"
}
```

### Login

```http
POST /api/auth/login
```

Request:

```json
{
  "email": "customer@example.com",
  "password": "Password123!"
}
```

### Get Profile

```http
GET /api/auth/profile
```

Requires authentication.

---

# 👤 Customer API

Customer-related endpoints are grouped under:

```text
/api/customer
```

Typical endpoints include:

```http
GET    /api/customer/profile
PUT    /api/customer/profile
POST   /api/customer/profile/avatar
DELETE /api/customer/profile/avatar
PUT    /api/customer/password
```

---

# 💬 Conversation API

```text
/api/conversations
```

Example operations:

```http
GET    /api/conversations
GET    /api/conversations/:id
POST   /api/conversations
PUT    /api/conversations/:id
DELETE /api/conversations/:id
```

---

# 💌 Message API

```text
/api/messages
```

Example operations:

```http
GET  /api/messages/:conversationId
POST /api/messages
```

---

# 🎫 Ticket API

```text
/api/tickets
```

Example operations:

```http
GET  /api/tickets
GET  /api/tickets/:id
POST /api/tickets
PUT  /api/tickets/:id
```

---

# ⚙️ Environment Variables

Create a `.env` file inside the server directory.

```env
PORT=8000

MONGO_URI=mongodb+srv://username:password@cluster.mongodb.net/supportai

JWT_SECRET=your_super_secret_jwt_key

CLIENT_URL=http://localhost:5173
```

If AI functionality is enabled:

```env
OPENAI_API_KEY=your_openai_api_key
```

If Redis is used:

```env
REDIS_URL=redis://localhost:6379
```

---

# 📦 Installation

## 1. Clone the repository

```bash
git clone <your-repository-url>
cd SupportAI
```

---

## 2. Install frontend dependencies

```bash
cd client
npm install
```

---

## 3. Install backend dependencies

Open another terminal:

```bash
cd server
npm install
```

---

# ▶️ Running the Application

## Start Backend

```bash
cd server
npm run dev
```

Backend:

```text
http://localhost:8000
```

Health check:

```text
http://localhost:8000/api/health
```

---

## Start Frontend

```bash
cd client
npm run dev
```

Frontend:

```text
http://localhost:5173
```

---

# 🗄️ MongoDB

SupportAI uses MongoDB for persistent application data.

Main collections include:

```text
users
conversations
messages
tickets
```

Example relationship:

```text
User
 │
 ├── Conversations
 │       │
 │       └── Messages
 │
 └── Tickets
```

MongoDB Atlas can be used for production deployments.

---

# 🔒 Security Recommendations

For production deployment:

* Use a strong JWT secret
* Never commit `.env`
* Use HTTPS
* Restrict CORS origins
* Validate uploaded files
* Limit avatar file sizes
* Validate MIME types
* Sanitize user input
* Rate-limit authentication endpoints
* Hash passwords using bcrypt
* Do not expose sensitive user information
* Use secure cookies where appropriate
* Keep dependencies updated

---

# 🖼️ Avatar Security

Only allow supported image types:

```text
image/jpeg
image/png
image/webp
```

Recommended maximum size:

```text
5 MB
```

Multer should reject unsupported files and oversized uploads.

Never allow arbitrary executable files to be uploaded to the avatar directory.

---

# 🧩 Frontend Authentication Context

The frontend uses an `AuthContext` to maintain authentication state.

Typical state:

```js
{
  user,
  token,
  loading,
  login,
  register,
  logout
}
```

After page refresh, the application should restore the authenticated user by calling:

```http
GET /api/auth/profile
```

This prevents profile information from disappearing after refresh.

---

# 🔄 Profile Update Flow

The recommended profile update flow is:

```text
Profile Page
    │
    ▼
User edits information
    │
    ▼
Save Changes
    │
    ▼
PUT /api/customer/profile
    │
    ▼
Authenticate JWT
    │
    ▼
Find User
    │
    ▼
Update MongoDB
    │
    ▼
Return updated user
    │
    ▼
Update AuthContext
    │
    ▼
UI updates
```

This ensures the changes remain available after refreshing the browser.

---

# 🧠 AI Support Architecture

A future production architecture can use RAG:

```text
Customer
   │
   ▼
SupportAI Chat
   │
   ▼
Intent Detection
   │
   ▼
Knowledge Retrieval
   │
   ├── MongoDB
   ├── Vector Database
   └── Knowledge Base
   │
   ▼
AI Model
   │
   ▼
Confidence Evaluation
   │
   ├── Resolve Automatically
   │
   └── Escalate to Agent
```

Possible vector database:

```text
Pinecone
```

Possible AI model provider:

```text
OpenAI
```

---

# 🚀 Future Features

The project can be extended with:

### AI

* RAG-powered knowledge base
* AI intent classification
* AI sentiment analysis
* AI conversation summaries
* AI suggested responses
* AI ticket classification
* AI priority detection
* AI auto-tagging
* AI multilingual support

### Customer

* Profile avatar
* Customer notification center
* Saved conversations
* Conversation search
* Ticket attachments
* Ticket comments
* Customer satisfaction ratings

### Agent

* Agent dashboard
* Agent availability
* Agent assignment
* Agent workload monitoring
* Internal notes
* Canned responses
* Customer history
* SLA monitoring

### Admin

* User management
* Agent management
* Analytics dashboard
* Ticket analytics
* AI performance analytics
* Customer satisfaction analytics
* System settings

### Real-Time

* Socket.IO
* Typing indicators
* Online/offline status
* Real-time notifications
* Real-time agent assignment
* Live ticket updates

---

# 📊 Suggested Dashboard Metrics

Customer dashboard:

```text
Total Conversations
Open Tickets
Resolved Tickets
Pending Tickets
Average Response Time
AI Resolution Rate
```

Admin dashboard:

```text
Total Customers
Active Agents
Open Tickets
Resolved Tickets
AI Resolution Rate
Escalation Rate
Average Response Time
Customer Satisfaction
```

---

# 🧪 Development Checklist

Before considering a feature complete, verify:

* [ ] Authentication works
* [ ] Registration works
* [ ] Login works
* [ ] JWT is generated
* [ ] Protected routes work
* [ ] Profile loads after refresh
* [ ] Profile updates persist
* [ ] Avatar uploads successfully
* [ ] Avatar path is stored in MongoDB
* [ ] Avatar remains visible after refresh
* [ ] Password change works
* [ ] Conversations load correctly
* [ ] Messages persist
* [ ] Tickets can be created
* [ ] Ticket status can be updated
* [ ] Customer permissions work
* [ ] Agent permissions work
* [ ] Admin permissions work
* [ ] CORS is configured correctly
* [ ] `.env` is excluded from Git

---

# 🐛 Common Problems

## User not found

If the API returns:

```text
User not found.
```

check that:

1. The JWT contains the correct user ID.
2. `req.user.id` is populated by authentication middleware.
3. The ID matches the MongoDB `_id`.
4. The correct authentication token is being sent.
5. The frontend isn't using an old token.

---

## Avatar does not appear after refresh

Check:

```text
1. Avatar uploaded successfully
2. Avatar path saved in MongoDB
3. /avatars is exposed as static content
4. Profile API returns avatar
5. Frontend uses the correct API URL
```

Example:

```js
app.use("/avatars", express.static("avatars"));
```

Frontend:

```jsx
<img
  src={`http://localhost:8000${profile.avatar}`}
  alt={profile.name}
/>
```

---

## CORS error

Verify:

```env
CLIENT_URL=http://localhost:5173
```

And:

```js
app.use(
  cors({
    origin: process.env.CLIENT_URL,
    credentials: true,
  })
);
```

Restart the backend after modifying `.env`.

---

# 📌 Git Workflow

Recommended commit style:

```text
feat: add customer profile management
feat: add avatar upload functionality
feat: add support ticket management
feat: add AI conversation support
fix: persist customer profile updates
fix: resolve avatar loading after refresh
fix: resolve authentication user lookup
refactor: improve customer API architecture
docs: update SupportAI README
```

---

# 🌍 Production Architecture

A production deployment could look like:

```text
                    ┌───────────────┐
                    │   Customer    │
                    └───────┬───────┘
                            │
                            ▼
                    ┌───────────────┐
                    │ React / Vite  │
                    └───────┬───────┘
                            │
                            ▼
                    ┌───────────────┐
                    │ Express API   │
                    └───────┬───────┘
                            │
              ┌─────────────┼─────────────┐
              │             │             │
              ▼             ▼             ▼
          MongoDB        Redis        AI Service
              │                           │
              │                           ▼
              │                    Vector Database
              │
              ▼
          User Data
       Tickets / Messages
       Conversations
```

---

# 📜 License

This project is currently developed as a portfolio and learning project.

Add an appropriate license before distributing the project publicly.

---

# 👨‍💻 Author

**Muhammad Bilal**

Software Engineering | Full-Stack MERN Developer

### Core Technologies

```text
React
Node.js
Express
MongoDB
JavaScript
Tailwind CSS
JWT
REST APIs
AI Integration
```

---

# ⭐ SupportAI

SupportAI aims to bridge the gap between **AI-powered automation** and **human customer support**.

The long-term goal is to create a production-ready customer support platform where AI handles repetitive requests while human agents focus on complex and high-value customer problems.
