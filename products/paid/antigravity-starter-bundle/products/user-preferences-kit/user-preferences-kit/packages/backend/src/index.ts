
import express from 'express';
import cors from 'cors';
import http from 'http';
import { Server } from 'socket.io';
import dotenv from 'dotenv';
import { initDb } from './db';
import { createPreferenceRouter } from './routes/preferences';

dotenv.config();

const app = express();
const server = http.createServer(app);
const io = new Server(server, {
  cors: {
    origin: '*', // Configure this for production
    methods: ['GET', 'POST', 'PATCH', 'PUT']
  }
});

const PORT = process.env.PORT || 3001;

// Middleware
app.use(cors());
app.use(express.json());

// Socket.io connection handling
io.on('connection', (socket) => {
  console.log('Client connected:', socket.id);

  // Join user to a room based on userId for targeted updates
  socket.on('join', (userId: string) => {
    console.log(`Socket ${socket.id} joined room ${userId}`);
    socket.join(userId);
  });

  socket.on('disconnect', () => {
    console.log('Client disconnected:', socket.id);
  });
});

// Routes
app.use('/api/preferences', createPreferenceRouter(io));

// Health check
app.get('/health', (req, res) => {
  res.json({ status: 'ok' });
});

// Start server
const start = async () => {
  try {
    // Initialize DB (create tables if not exist)
    // Note: In production, migrations should be handled separately
    await initDb();

    server.listen(PORT, () => {
      console.log(`Server running on port ${PORT}`);
    });
  } catch (error) {
    console.error('Failed to start server:', error);
    process.exit(1);
  }
};

start();
