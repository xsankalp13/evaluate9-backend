# AI Bot Evaluation Platform (Backend)

The AI Bot Evaluation Platform is a scalable, multi-tenant B2B SaaS solution designed to automate candidate interviews using AI personas and RAG (Retrieval-Augmented Generation). It acts as the orchestrator between the Recruiter (Admin), the Candidate, and an External RAG Pipeline, providing real-time chat interviews, anti-cheat proctoring, and automated scoring.

## 🚀 Features

- **Multi-Tenancy**: Strict data isolation between organizations using Row-Level Security
- **Real-Time Exam Engine**: Low-latency chat via Socket.io
- **RAG Integration**: Ingests PDF Question Banks and generates random question sets via an external Python RAG microservice
- **Anti-Cheat Proctoring**: Detects tab switching and camera violations ("Three Strikes" rule)
- **Crash Recovery**: Redis persistence ensures exam state is saved instantly and can resume after server restarts
- **Optimized Architecture**: Pre-generates question sets to minimize LLM costs

## 🛠️ Tech Stack

| Component | Technology |
|-----------|------------|
| Runtime | Node.js (v20) + Express |
| Language | TypeScript |
| Database | PostgreSQL 16 (via Prisma ORM) |
| Caching/State | Redis |
| Real-Time | Socket.io |
| Containerization | Docker & Docker Compose (Multi-stage builds) |

## ⚙️ Prerequisites

- Docker & Docker Compose (Recommended for production)
- Node.js v18+ (For local development)
- PostgreSQL & Redis (If running locally without Docker)
- **External RAG Service**: You need the Python RAG Microservice running at `RAG_API_URL`

## 📦 Installation & Setup

### Option 1: Docker (Recommended)

#### 1. Clone the repository

```bash
git clone https://github.com/your-repo/ai-eval-backend.git
cd ai-eval-backend
```

#### 2. Configure Environment

Create a `.env` file in the root directory:

```env
PORT=4000
NODE_ENV=production
CLIENT_URL=http://localhost:3000

# Secrets
JWT_SECRET=your_super_secure_secret
OPENAI_API_KEY=sk-...

# RAG Service (Use 'host.docker.internal' if running RAG locally on host)
RAG_API_URL=http://host.docker.internal:8000
```

**Note**: `DATABASE_URL` and `REDIS_URL` are handled automatically in `docker-compose.yml`.

#### 3. Build and Run

```bash
docker-compose up --build -d
```

#### 4. Initialize Database

Since the database is fresh, push the schema:

```bash
docker exec -it ai-eval-backend npx prisma db push
```

The API will be available at `http://localhost:4000`.

### Option 2: Local Development

#### 1. Install Dependencies

```bash
npm install
```

#### 2. Set up `.env`

```env
DATABASE_URL="postgresql://user:pass@localhost:5432/ai_eval_db?schema=public"
REDIS_URL="redis://localhost:6379"
PORT=4000
NODE_ENV=development
CLIENT_URL=http://localhost:3000
JWT_SECRET=your_super_secure_secret
OPENAI_API_KEY=sk-...
RAG_API_URL=http://localhost:8000
```

#### 3. Run Database Migrations

```bash
npx prisma db push
```

#### 4. Start Dev Server

```bash
npm run dev
```

## 🔌 API Reference

### Authentication (Admin)

| Method | Endpoint | Description |
|--------|----------|-------------|
| POST | `/api/v1/auth/register` | Register a new Tenant Organization & Admin |
| POST | `/api/v1/auth/login` | Login to receive a JWT |

### Admin Management

**Requires Authorization**: `Bearer <token>`

| Method | Endpoint | Description |
|--------|----------|-------------|
| POST | `/api/v1/admin/tests` | Create a test, upload PDF, and trigger RAG ingestion |
| GET | `/api/v1/admin/tests` | List all tests for the tenant |
| POST | `/api/v1/admin/candidates` | Add a single candidate to a test |
| POST | `/api/v1/admin/candidates/bulk` | Upload CSV to add multiple candidates |

### Exam Access (Candidate)

| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/api/v1/exam/verify/:accessKey` | Validates magic link & returns Socket Token |

## 📡 Socket.io Events

The exam engine operates over WebSockets for real-time interaction.

### Handshake

Connect using the token received from the `/verify` endpoint:

```javascript
const socket = io("http://localhost:4000", {
  auth: { token: "YOUR_SOCKET_TOKEN" }
});
```

### Client → Server Events

| Event | Payload | Description |
|-------|---------|-------------|
| `start_interview` | `{}` | Signals the backend to start or resume the session |
| `send_message` | `{ message: "..." }` | Sends the candidate's answer to the AI |
| `report_violation` | `{ type: "TAB_SWITCH" }` | Reports a proctoring violation |

### Server → Client Events

| Event | Payload | Description |
|-------|---------|-------------|
| `receive_message` | `{ sender: "AI", message: "..." }` | The AI's question or response |
| `proctor_warning` | `{ message, count, max }` | Warning when a violation is detected |
| `exam_terminated` | `{ reason: "..." }` | Fired when max violations are reached |

## 📂 Project Structure

```
src/
├── config/              # DB (Prisma) & Redis Configuration
├── controllers/         # HTTP Request Handlers
├── middlewares/         # Auth & Tenant Context Logic
├── services/            # Core Business Logic
│   ├── rag.service.ts   # RAG API Communication
│   ├── test.service.ts  # Question Generation & Shuffling
│   └── ...
├── sockets/             # Real-Time Engine
│   ├── manager.ts       # Socket Server Setup
│   ├── handlers/        # Logic for Chat & Proctoring
├── app.ts               # Express App Setup
└── server.ts            # Entry Point
```

## 🔒 Security Features

- **JWT-based Authentication**: Secure token-based authentication for admins
- **Row-Level Security**: Multi-tenant data isolation at the database level
- **Anti-Cheat Mechanisms**: Real-time proctoring with violation tracking
- **Magic Links**: Secure, one-time access keys for candidates

## 🚦 Development Workflow

### Running Tests

```bash
npm test
```

### Building for Production

```bash
npm run build
```

### Database Management

```bash
# Generate Prisma Client
npx prisma generate

# Create a migration
npx prisma migrate dev --name your_migration_name

# Reset database (WARNING: deletes all data)
npx prisma migrate reset
```

## 🐛 Troubleshooting

### Docker Issues

**Problem**: Cannot connect to RAG service
**Solution**: Use `host.docker.internal` instead of `localhost` in `RAG_API_URL`

**Problem**: Database connection refused
**Solution**: Ensure PostgreSQL container is running: `docker-compose ps`

### Local Development Issues

**Problem**: Port already in use
**Solution**: Change `PORT` in `.env` or kill the process using the port

**Problem**: Redis connection timeout
**Solution**: Verify Redis is running: `redis-cli ping`

## 📈 Performance Optimization

- **Redis Caching**: Exam state cached for instant recovery
- **Pre-generated Questions**: Reduces runtime LLM API calls
- **Connection Pooling**: Prisma connection pool for database efficiency
- **Multi-stage Docker Builds**: Smaller production images

## 🤝 Contributing

Contributions are welcome! Please follow these steps:

1. Fork the repository
2. Create a feature branch (`git checkout -b feature/AmazingFeature`)
3. Commit your changes (`git commit -m 'Add some AmazingFeature'`)
4. Push to the branch (`git push origin feature/AmazingFeature`)
5. Open a Pull Request

## 📝 Environment Variables

| Variable | Required | Description |
|----------|----------|-------------|
| `PORT` | Yes | Server port (default: 4000) |
| `NODE_ENV` | Yes | Environment (development/production) |
| `DATABASE_URL` | Yes | PostgreSQL connection string |
| `REDIS_URL` | Yes | Redis connection string |
| `JWT_SECRET` | Yes | Secret for JWT signing |
| `OPENAI_API_KEY` | Yes | OpenAI API key for AI features |
| `RAG_API_URL` | Yes | External RAG microservice URL |
| `CLIENT_URL` | Yes | Frontend application URL (for CORS) |

## 📜 License

MIT License - see the [LICENSE](LICENSE) file for details

## 📞 Support

For issues and questions:
- Open an issue on GitHub
- Contact: support@evaluateix.com

## 🗺️ Roadmap

- [ ] Advanced analytics dashboard
- [ ] Multi-language support
- [ ] Video proctoring integration
- [ ] Custom AI persona configuration
- [ ] Advanced reporting and insights

---

Built with ❤️ using Node.js, TypeScript, and Socket.io