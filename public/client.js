const socket = io();

let player = null;
let players = [];
let collectibles = [];

// Tamaño del canvas y contexto
const canvas = document.getElementById('gameCanvas');
const ctx = canvas.getContext('2d');
canvas.width = 600;
canvas.height = 400;

// Colores y tamaños
const playerRadius = 15;
const collectibleRadius = 10;

// Función para dibujar un jugador
function drawPlayer(p) {
  ctx.beginPath();
  ctx.arc(p.x, p.y, playerRadius, 0, Math.PI * 2);
  ctx.fillStyle = p.id === player.id ? 'blue' : 'red';
  ctx.fill();
  ctx.closePath();

  // Mostrar score
  ctx.fillStyle = 'black';
  ctx.font = '12px Arial';
  ctx.fillText(`Score: ${p.score}`, p.x - 15, p.y - 20);
}

// Función para dibujar collectibles
function drawCollectible(c) {
  ctx.beginPath();
  ctx.arc(c.x, c.y, collectibleRadius, 0, Math.PI * 2);
  ctx.fillStyle = 'gold';
  ctx.fill();
  ctx.closePath();
}

// Dibujar todo
function draw() {
  console.log('Dibujando canvas...');
  ctx.clearRect(0, 0, canvas.width, canvas.height);

  collectibles.forEach(drawCollectible);
  players.forEach(drawPlayer);
}

// Recibir estado inicial
socket.on('init', (data) => {
  player = data.player;
  players = data.players;
  collectibles = data.collectibles;
  draw();
});

// Actualizar jugadores
socket.on('playersUpdate', (updatedPlayers) => {
  players = updatedPlayers;
  draw();
});

// Actualizar collectibles
socket.on('collectiblesUpdate', (updatedCollectibles) => {
  collectibles = updatedCollectibles;
  draw();
});

// Nuevo collectible
socket.on('newCollectible', (newCollectible) => {
  collectibles.push(newCollectible);
  draw();
});

// Control de teclado para movimiento
document.addEventListener('keydown', (e) => {
  let direction = null;
  switch (e.key) {
    case 'ArrowUp':
    case 'w':
    case 'W':
      direction = 'up';
      break;
    case 'ArrowDown':
    case 's':
    case 'S':
      direction = 'down';
      break;
    case 'ArrowLeft':
    case 'a':
    case 'A':
      direction = 'left';
      break;
    case 'ArrowRight':
    case 'd':
    case 'D':
      direction = 'right';
      break;
  }
  if (direction) {
    socket.emit('move', { direction, pixels: 10 });
  }
});
