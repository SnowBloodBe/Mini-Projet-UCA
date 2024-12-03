class Obstacle {
  constructor(x, y, r, imgPath) {
    this.pos = createVector(x, y);
    this.r = r;
    this.image = loadImage('assets/asteroid.png'); // Charger l'image
  }

  show() {
    push();
    imageMode(CENTER);
    image(this.image, this.pos.x, this.pos.y, this.r * 2, this.r * 2); // Affiche l'obstacle
    pop();
  }
}