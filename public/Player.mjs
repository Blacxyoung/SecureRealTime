export class Player {
  constructor(id, x, y) {
    this.id = id;
    this.x = x;
    this.y = y;
    this.score = 0;
  }

  movePlayer(direction, pixels) {
    switch (direction) {
      case 'up':
        this.y -= pixels;
        break;
      case 'down':
        this.y += pixels;
        break;
      case 'left':
        this.x -= pixels;
        break;
      case 'right':
        this.x += pixels;
        break;
    }
  }

  collision(collectible) {
    // tu lógica ya implementada
  }

  calculateRank(allPlayers) {
    // Ordenamos los jugadores por puntaje descendente
    const sorted = allPlayers.slice().sort((a, b) => b.score - a.score);
    // Buscamos el índice del jugador actual
    const index = sorted.findIndex(p => p.id === this.id);
    // El ranking es índice+1 (porque array es 0-based) / total jugadores
    return `Rank: ${index + 1}/${sorted.length}`;
  }
}
