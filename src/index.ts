import { Server } from './server.ts';
import dotenv from 'dotenv';
dotenv.config();

const server = new Server();

server.start();

process.on('SIGTERM', () => server.shutdown('SIGTERM')); // Sent by orchestrators (ECS/Kubernetes)
process.on('SIGINT', () => server.shutdown('SIGINT'));   // sent by terminal