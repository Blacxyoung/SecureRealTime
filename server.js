import dotenv from 'dotenv';
dotenv.config();

import express from 'express';
import bodyParser from 'body-parser';
import cors from 'cors';
import helmet from 'helmet';
import http from 'http';
import socketioPkg from 'socket.io';
import path from 'path';
import { fileURLToPath } from 'url';

const Server = socketioPkg.Server ?? socketioPkg;

// Crear require para CommonJS
import { createRequire } from 'module';
const require = createRequire(import.meta.url);

const fcctestingRoutes = require('./routes/fcctesting.cjs');

import { Player } from './public/Player.mjs';
import Collectible from './public/Collectible.mjs';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const app = express();

app.use('/public', express.static(path.join(__dirname, '/public')));
app.use('/assets', express.static(path.join(__dirname, '/assets')));

app.use(bodyParser.json());
app.use(bodyParser.urlencoded({ extended: true }));

app.use(cors({ origin: '*' }));

app.use(
  helmet({
    contentSecurityPolicy: false,
  })
);
app.use(helmet.noSniff());

app.use((req, res, next) => {
  res.set('Cache-Control', 'no-store, no-cache, must-revalidate, proxy-revalidate');
  res.set('Pragma', 'no-cache');
  res.set('Expires', '0');
  res.set('Surrogate-Control', 'no-store');
  next();
});

app.use((req, res, next) => {
  res.setHeader('X-Powered-By', 'PHP 7.4.3');
  next();
});

app.route('/').get((req, res) => {
  res.sendFile(path.join(__dirname, '/views/index.html'));
});

fcctestingRoutes(app);

app.use((req, res, next) => {
  res.status(404).type('text').send('Not Found');
});

const server = http.createServer(app);
const io = new Server(server);

const players = new Map();
const collectibles = new Map();

function createCollectible() {
  const id = Date.now().toString() + Math.random().toString(36).slice(2);
  const value = 1;
  const x = Math.floor(Math.random() * 500);
  const y = Math.floor(Math.random() * 500);
  const collectible = new Collectible(id, value, x, y);
  collectibles.set(id, collectible);
  return collectible;
}

for (let i = 0; i < 5; i++) {
  createCollectible();
}

io.on('connection', (socket) => {
  console.log(`Jugador conectado: ${socket.id}`);

  const player = new Player(socket.id, Math.floor(Math.random() * 500), Math.floor(Math.random() * 500));
  players.set(socket.id, player);

  socket.emit('init', {
    player,
    players: Array.from(players.values()),
    collectibles: Array.from(collectibles.values()),
  });

  io.emit('playersUpdate', Array.from(players.values()).map(p => ({
    ...p,
    rank: p.calculateRank(Array.from(players.values()))
  })));

  socket.on('move', ({ direction, pixels }) => {
    const p = players.get(socket.id);
    if (p) {
      p.movePlayer(direction, pixels);

      for (const [id, collectible] of collectibles) {
        if (p.collision(collectible)) {
          p.score += collectible.value;
          collectibles.delete(id);
          const newCollectible = createCollectible();
          io.emit('newCollectible', newCollectible);
        }
      }

      io.emit('playersUpdate', Array.from(players.values()).map(p => ({
        ...p,
        rank: p.calculateRank(Array.from(players.values()))
      })));
      io.emit('collectiblesUpdate', Array.from(collectibles.values()));
    }
  });

  socket.on('disconnect', () => {
    console.log(`Jugador desconectado: ${socket.id}`);
    players.delete(socket.id);
    io.emit('playersUpdate', Array.from(players.values()).map(p => ({
      ...p,
      rank: p.calculateRank(Array.from(players.values()))
    })));
  });
});

const portNum = process.env.PORT || 3000;

server.listen(portNum, () => {
  console.log(`Listening on port ${portNum}`);
  if (process.env.NODE_ENV === 'test') {
    console.log('Running Tests...');
    setTimeout(() => {
      try {
        // Aquí asumo que test-runner es CommonJS también y usarás require igual que fcctesting.js
        const runner = require('./test-runner.cjs');
        runner.run();
      } catch (error) {
        console.error('Tests are not valid:', error);
      }
    }, 1500);
  }
});

export default app;