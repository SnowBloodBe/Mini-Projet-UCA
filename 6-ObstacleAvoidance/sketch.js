let pursuer1, pursuer2;
let target;
let leader;
let obstacles = [];
let vehicules = [];
let wanderers = [];
let bullets = [];
let enemyBullets = []; // Tableau pour stocker les balles des ennemis
let snakeMode = false;
let leaderMode = false;
let enemies = []; // Tableau des ennemis
let enemyImage; // Image de l'ennemi
let debugCheckbox, snakeCheckbox, leaderCheckbox, maxSpeedSlider, maxForceSlider;
let wandererImage;
let spaceBackground;

function setup() {
  createCanvas(1500, 1200);
  pursuer1 = new Vehicle(100, 100,true);
  pursuer2 = new Vehicle(random(width), random(height));


  
  vehicules.push(pursuer1);
  // vehicules.push(pursuer2);
   // Initialisation des véhicules
  
  // Créer les sliders pour ajuster les propriétés des véhicules
  creerSlidersPourProprietesVehicules();

  // On cree un obstacle au milieu de l'écran
  obstacles.push(new Obstacle(width / 2, height / 2, 100));
}

function draw() {
  // Changer le dernier param (< 100) pour effets de trainée
  background(0);
  image(spaceBackground, 0, 0, width, height); // Affiche le fond spatial
  target = createVector(mouseX, mouseY);

  // Dessin de la cible qui suit la souris
  push();
imageMode(CENTER); // Centrer l'image
image(xwingImage, target.x, target.y, 50, 50); // Taille ajustée
pop();

  // Dessin des obstacles
  obstacles.forEach(o => o.show());

// Gestion des véhicules normaux
vehicules.forEach((v, index) => {
  if (snakeMode) {
    // Mode Snake : Suivre en chaîne
    if (index === 0) {
      v.applyBehaviors(target, obstacles, vehicules); // Le premier véhicule suit la souris
    } else {
      let followForce = v.follow(vehicules[index - 1].pos, 50); // Suivre le précédent
      let avoidForce = v.avoid(obstacles); // Éviter les obstacles
      avoidForce.mult(3.0);
      v.applyForce(followForce);
      v.applyForce(avoidForce);
    }
  } else if (leaderMode) {
    // Mode Leader : Tous les véhicules suivent le leader
    if (v === leader) {
      v.applyBehaviors(target, obstacles, vehicules); // Le leader suit la souris
    } else {
      let followForce = v.follow(leader.pos, 100); // Suivre le leader
      let avoidForce = v.avoid(obstacles); // Éviter les obstacles
      let separateForce = v.separate(vehicules); // Espacement entre véhicules
  
      // Pondérer les forces
      //followForce.mult(1.0);
      avoidForce.mult(3.0);
      separateForce.mult(0.8);
  
      // Appliquer les forces
      v.applyForce(followForce);
      v.applyForce(avoidForce);
      v.applyForce(separateForce);
    }
  
  } else {
    // Mode normal : Tous les véhicules suivent la souris
    v.applyBehaviors(target, obstacles, vehicules);
  }

  v.update(); // Mise à jour de la position
  v.show();  // Affichage
});

// Gestion des Wanderers
wanderers.forEach(w => {
  w.applyBehaviors(obstacles); // Appliquer les comportements spécifiques
  w.update(); // Mise à jour de la position
  w.show();  // Dessin avec la couleur unique
});

enemies.forEach(enemy => {
  enemy.update(); // Déplacer l'ennemi
  enemy.show();   // Afficher l'ennemi
});

if (leaderMode && enemies.length > 0) {
  if (vehicules.length > 3) {
    // Formation circulaire
    let radius = 100;
    let angleStep = TWO_PI / (vehicules.length - 1);
    vehicules.forEach((v, index) => {
      if (v !== leader) {
        let angle = index * angleStep;
        let targetPos = createVector(
          leader.pos.x + cos(angle) * radius,
          leader.pos.y + sin(angle) * radius
        );
        let protectForce = v.seek(targetPos);
        v.applyForce(protectForce);
      }
    });
  } else {
    // Formation en ligne
    let offset = 50;
    vehicules.forEach((v, index) => {
      if (v !== leader) {
        let targetPos = createVector(leader.pos.x - offset * index, leader.pos.y);
        let protectForce = v.seek(targetPos);
        v.applyForce(protectForce);
      }
    });
  }
}
enemies = enemies.filter(enemy => {
  let isSafe = true;
  vehicules.forEach(v => {
    if (v.pos.dist(enemy.pos) < 10) {
      console.log("Ennemi détruit !");
      isSafe = false;
    }
  });
  return isSafe;
});

bullets.forEach((bullet, index) => {
  bullet.update();
  bullet.show();

  enemies = enemies.filter(enemy => {
    if (dist(bullet.pos.x, bullet.pos.y, enemy.pos.x, enemy.pos.y) < enemy.size / 2) {
      bullets.splice(index, 1);
      console.log("Ennemi touché !");
      return false;
    }
    return true;
  });

  if (bullet.isOutOfBounds()) {
    bullets.splice(index, 1);
  }
});

enemies.forEach(enemy => {
  // Condition pour tirer toutes les 100 frames (par exemple)
  if (frameCount % 100 === 0) {
    // Choisir un véhicule comme cible (par exemple, le leader ou un véhicule aléatoire)
    let target = leader || vehicules[floor(random(vehicules.length))];

    // Calculer la direction vers la cible
    let direction = p5.Vector.sub(target.pos, enemy.pos);

    // Ajouter une balle ennemie
    enemyBullets.push(new EnemyBullet(enemy.pos, direction));
  }
});

enemyBullets.forEach((bullet, index) => {
  bullet.update();
  bullet.show();

  vehicules = vehicules.filter(vehicle => {
    if (dist(bullet.pos.x, bullet.pos.y, vehicle.pos.x, vehicle.pos.y) < vehicle.r_pourDessin) {
      console.log("Véhicule touché !");
      enemyBullets.splice(index, 1);
      return false;
    }
    return true;
  });

  // Supprimer les balles hors de l'écran
  if (bullet.isOutOfBounds()) {
    enemyBullets.splice(index, 1);
  }
});

}

// Ajouter un obstacle de taille aléatoire à la position de la souris
function mousePressed() {
 // obstacles.push(new Obstacle(mouseX, mouseY, random(20, 100), "green"));
}

function creerSlidersPourProprietesVehicules() {
  // Créer un slider pour ajuster la vitesse maximale
  creerUnSlider("Vitesse maxi", 1, 10, 4, 0.1, 10, 20, "maxSpeed");
  
  // Créer un slider pour ajuster la force maximale
  creerUnSlider("Max force", 0.1, 2, 0.25, 0.05, 10, 60, "maxForce");
  
  // Checkbox pour activer/désactiver le mode Debug
  debugCheckbox = createCheckbox('Mode Debug', false);
  debugCheckbox.position(10, 100);
  debugCheckbox.style('color', 'white');
  debugCheckbox.changed(() => {
    Vehicle.debug = debugCheckbox.checked(); // Activer/désactiver le mode Debug
  });

  // Checkbox pour activer/désactiver le mode Snake
  snakeCheckbox = createCheckbox('Mode Snake', false);
  snakeCheckbox.position(10, 130);
  snakeCheckbox.style('color', 'white');
  snakeCheckbox.changed(() => {
    snakeMode = snakeCheckbox.checked(); // Activer/désactiver le mode Snake
  });

  leaderCheckbox = createCheckbox('Mode Leader', false);
  leaderCheckbox.position(10, 160);
  leaderCheckbox.style('color', 'white');
  leaderCheckbox.changed(() => {
    leaderMode = leaderCheckbox.checked(); // Activer/désactiver le mode Snake
  });

}

function creerUnSlider(label, min, max, val, step, posX, posY, propriete) {
  let slider = createSlider(min, max, val, step);

  let labelP = createP(label);
  labelP.position(posX, posY);
  labelP.style('color', 'white');

  slider.position(posX + 150, posY + 17);

  let valueSpan = createSpan(slider.value());
  valueSpan.position(posX + 300, posY + 17);
  valueSpan.style('color', 'white');
  valueSpan.html(slider.value());

  slider.input(() => {
    valueSpan.html(slider.value());
    vehicules.forEach(vehicle => {
      vehicle[propriete] = slider.value(); // Appliquer la nouvelle valeur à la propriété
    });
  });
}
function preload() {
  // Charger l'image (mettez l'image dans un dossier `assets` dans le projet)
  //wandererImage = loadImage('assets/yoda.png');
  enemyImage = loadImage('assets/darkvador2.png'); // Chargez votre image Dark Vador
  spaceBackground = loadImage('assets/space.jpg');
  lukeImage = loadImage('assets/luke.png');
  xwingImage = loadImage('assets/xwing.webp');
  wandererImage = loadImage('assets/yoda.png'); // Image des Wanderers
  enemyImage = loadImage('assets/darkvador2.png');   // Image des ennemis
}


// Gestion des touches pour ajouter des véhicules ou basculer des modes
function keyPressed() {
  if (key === "v"|| key === "V") {
    vehicules.push(new Vehicle(random(width), random(height)));
  }
  if (key === "s"|| key === "S") {
    snakeMode = !snakeMode; // Bascule entre les modes
    if (snakeCheckbox) {
      snakeCheckbox.checked(snakeMode); // Met à jour la checkbox en fonction du mode Leader
    }
  }
  if (key === "O" || key === "o") {
    // Ajout d'un obstacle à la position actuelle de la souris
    obstacles.push(new Obstacle(mouseX, mouseY, random(50, 100))); 
  }
  if (key === "W" || key === "w") {
    let wanderer = new Wanderer(random(width), random(height));
    wanderers.push(wanderer);
  }
  if (key === "L" || key === "l") {
    leaderMode = !leaderMode; // Bascule entre les modes Leader et normal
    if (leaderCheckbox) {
      leaderCheckbox.checked(leaderMode); // Met à jour la checkbox en fonction du mode Leader
    }
    if (leaderMode) {
      leader = vehicules[0]; // Désignez le premier véhicule comme leader
    } 
  }
  if (key === "d" || key === "D") {
    Vehicle.debug = !Vehicle.debug;
    if (debugCheckbox) {
      debugCheckbox.checked(Vehicle.debug); // Met à jour la checkbox en fonction du mode Leader
    }
  } else if (key === "f") {
    for (let i = 0; i < 10; i++) {
      let v = new Vehicle(20, 300);
      v.vel = new p5.Vector(random(1, 5), random(1, 5)); // Vitesse aléatoire
      vehicules.push(v);
    }
  }
  if (key === "E" || key === "e") {
    // Créer un nouvel ennemi
    enemies.push(new Enemy(random(width), random(height))); // Ajouter un ennemi
    console.log("Nouvel ennemi ajouté !");
  }
  if (key === "A" || key === "a") {
    // Mode attaque
    console.log("Mode Attaque activé !");
    vehicules.forEach(v => {
      if (v !== leader) {
        // Chercher l'ennemi le plus proche
        let closestEnemy = enemies.reduce((closest, enemy) => {
          let d = v.pos.dist(enemy.pos);
          return d < closest.d ? { d, enemy } : closest;
        }, { d: Infinity, enemy: null }).enemy;

        if (closestEnemy) {
          let attackForce = v.seek(closestEnemy.pos);
          v.applyForce(attackForce);
        }
      }
    });
  }
  if (key === "K" || key === "k") {
    vehicules.forEach(v => {
      if (v !== leader) {
        let bulletVel = v.vel.copy();
        bullets.push(new Bullet(v.pos, bulletVel));
      }
    });
  }
}

// Variables global
// Fonction preload pour charger les assets


// Fonction keyPressed pour gérer les interactions clavier

