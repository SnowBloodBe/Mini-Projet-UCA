/*
  Calcule la projection orthogonale du point a sur le vecteur b
  a et b sont des vecteurs calculés comme ceci :
  let v1 = p5.Vector.sub(a, pos); soit v1 = pos -> a
  let v2 = p5.Vector.sub(b, pos); soit v2 = pos -> b
  */
  function findProjection(pos, a, b) {
    let v1 = p5.Vector.sub(a, pos);
    let v2 = p5.Vector.sub(b, pos);
    v2.normalize();
    let sp = v1.dot(v2);
    v2.mult(sp);
    v2.add(pos);
    return v2;
  }
  
  class Vehicle {
    static debug = false;
  
    constructor(x, y) {
      // position du véhicule
      this.pos = createVector(x, y);
      // vitesse du véhicule
      this.vel = createVector(0, 0);
      // accélération du véhicule
      this.acc = createVector(0, 0);
      // vitesse maximale du véhicule
      this.maxSpeed = 6;
      // force maximale appliquée au véhicule
      this.maxForce = 0.25;
      this.color = "white";
      // à peu près en secondes
      this.dureeDeVie = 5;
  
      this.r_pourDessin = 16;
      // rayon du véhicule pour l'évitement
      this.r = this.r_pourDessin * 3;
  
      // Pour évitement d'obstacle
      this.largeurZoneEvitementDevantVaisseau = this.r / 2;
  
      // chemin derrière vaisseaux
      this.path = [];
      this.pathMaxLength = 30;
    }
  
    // on fait une méthode applyBehaviors qui applique les comportements
    // seek et avoid
    applyBehaviors(target, obstacles, vehicules) {
      let seekForce = this.arrive(target);
      let avoidForce = this.avoid(obstacles);
      let separateForce = this.separate(vehicules);
    
      seekForce.mult(1.0);
      avoidForce.mult(3.0);
      separateForce.mult(0.3);
    
      // Appliquer les forces
      this.applyForce(seekForce);
      this.applyForce(avoidForce);
      this.applyForce(separateForce);
    
      // Visualiser les forces
      push();
      stroke(255, 0, 0); // Rouge pour Seek Force
      this.drawVector(this.pos, seekForce, color(255, 0, 0));
      stroke(0, 255, 0); // Vert pour Avoid Force
      this.drawVector(this.pos, avoidForce, color(0, 255, 0));
      stroke(0, 0, 255); // Bleu pour Separate Force
      this.drawVector(this.pos, separateForce, color(0, 0, 255));
      pop();
    }


    arrive(target, d = 0) {
      // 2nd argument true enables the arrival behavior
      // 3rd argumlent d is the distance behind the target
      // for "snake" behavior
      return this.seek(target, true, d);
    }

  
    follow(target, distance) {
      if (!target) return; // Si aucune cible n'est définie, ignore
      let desired = p5.Vector.sub(target, this.pos);
      let d = desired.mag();
    
      if (d > distance) {
        desired.setMag(this.maxSpeed);
      } else {
        desired.setMag(this.maxSpeed * 0.5);
      }
      desired.rotate(random(-PI / 32, PI / 32));
    
      let steer = p5.Vector.sub(desired, this.vel);
      steer.limit(this.maxForce);
      this.applyForce(steer);
    }
    
    

    avoid(obstacles) {
      // TODO
      // calcul d'un vecteur ahead devant le véhicule
      // il regarde par exemple 50 frames devant lui
      let ahead = this.vel.copy();
      ahead.mult(50);
      // Calcul de ahead2 situé au milieu de ahead
      let ahead2 = ahead.copy();
      ahead2.mult(0.5);
  
      if(Vehicle.debug) {
      // on le dessine avec ma méthode this.drawVector(pos vecteur, color)
      this.drawVector(this.pos, ahead, "yellow");
      // on dessine le vecteur ahead2 en bleu
      this.drawVector(this.pos, ahead2, "blue");
      }
  
      // Calcul des coordonnées du point au bout de ahead
      let pointAuBoutDeAhead = this.pos.copy().add(ahead);
      // Calcul des coordonnées du point au bout de ahead2
      let pointAuBoutDeAhead2 = this.pos.copy().add(ahead2);
  
  
      // Detection de l'obstacle le plus proche
      let obstacleLePlusProche = this.getObstacleLePlusProche(obstacles);
  
      // Si pas d'obstacle, on renvoie un vecteur nul
      if (obstacleLePlusProche == undefined) {
        return createVector(0, 0);
      }
  
      // On calcule la distance entre l'obstacle le plus proche 
      // et le bout du vecteur ahead
      let distance = pointAuBoutDeAhead.dist(obstacleLePlusProche.pos);
      // idem avec ahead2
      let distance2 = pointAuBoutDeAhead2.dist(obstacleLePlusProche.pos);
      // idem avec la position du véhicule
      let distance3 = this.pos.dist(obstacleLePlusProche.pos);
  
  
      if(Vehicle.debug) {
      // On dessine avec un cercle le point au bout du vecteur ahead pour debugger
      fill(255, 0, 0);
      circle(pointAuBoutDeAhead.x, pointAuBoutDeAhead.y, 10);
      // et un au bout de ahead2
      fill(0, 255, 0);
      circle(pointAuBoutDeAhead2.x, pointAuBoutDeAhead2.y, 10);
  
      // On dessine la zone d'évitement
      // Pour cela on trace une ligne large qui va de la position du vaisseau
      // jusqu'au point au bout de ahead
      stroke(100, 100);
      strokeWeight(this.largeurZoneEvitementDevantVaisseau);
      line(this.pos.x, this.pos.y, pointAuBoutDeAhead.x, pointAuBoutDeAhead.y);
      }
  
      // Calcul de la plus petite distance entre distance et distance2
      distance = min(distance, distance2);
      // calcul de la plus petite distance entre distance et distance3
      distance = min(distance, distance3);
  
      // si la distance est < rayon de l'obstacle
      // il y a collision possible et on dessine l'obstacle en rouge
      if (distance < obstacleLePlusProche.r + this.largeurZoneEvitementDevantVaisseau) {
  
        if(this.pos.dist(obstacleLePlusProche.pos) < (this.r + obstacleLePlusProche.r)) {
          // il y a VRAIMENT collision, on dessine l'obstacle en rouge
          //obstacleLePlusProche.color = "red";
        } else {
          //obstacleLePlusProche.color = "green";
        }
  
        // calcul de la force d'évitement. C'est un vecteur qui va
        // du centre de l'obstacle vers le point au bout du vecteur ahead
        // on va appliquer force = vitesseDesiree - vitesseActuelle
        let desiredVelocity;
        if(distance == distance2) {
           desiredVelocity = p5.Vector.sub(pointAuBoutDeAhead2, obstacleLePlusProche.pos);
        } else if(distance == distance3) {
            desiredVelocity = p5.Vector.sub(this.pos, obstacleLePlusProche.pos);
        } else {
            desiredVelocity = p5.Vector.sub(pointAuBoutDeAhead, obstacleLePlusProche.pos);
        }
  
        if(Vehicle.debug) {
          // on le dessine en jaune pour vérifier qu'il est ok (dans le bon sens etc)
          this.drawVector(obstacleLePlusProche.pos, desiredVelocity, "yellow");
        }
        // Dessous c'est l'ETAPE 2 : le pilotage (comment on se dirige vers la cible)
        // on limite ce vecteur desiredVelocity à  maxSpeed
        desiredVelocity.setMag(this.maxSpeed);
  
        // on calcule la force à appliquer pour atteindre la cible avec la formule
        // que vous commencez à connaitre : force = vitesse désirée - vitesse courante
        let force = p5.Vector.sub(desiredVelocity, this.vel);
  
        // on limite cette force à la longueur maxForce
        force.limit(this.maxForce);
  
        return force;
      } else {
        //obstacleLePlusProche.color = "green";
        return createVector(0, 0);
      }
  
    }
  
    avoidCorrige(obstacles) {
      // calcul d'un vecteur ahead devant le véhicule
      // il regarde par exemple 50 frames devant lui
      let ahead = this.vel.copy();
      ahead.mult(30);
      //on calcue ahead2 deux fois plus petit
      let ahead2 = ahead.copy();
      ahead2.mult(0.5);
  
      // on le dessine avec ma méthode this.drawVector(pos vecteur, color)
      this.drawVector(this.pos, ahead, "yellow");
  
      // Calcul des coordonnées du point au bout de ahead
      let pointAuBoutDeAhead = this.pos.copy().add(ahead);
      let pointAuBoutDeAhead2 = this.pos.copy().add(ahead2);
  
      // Detection de l'obstacle le plus proche
      let obstacleLePlusProche = this.getObstacleLePlusProche(obstacles);
  
      // Si pas d'obstacle, on renvoie un vecteur nul
      if (obstacleLePlusProche == undefined) {
        return createVector(0, 0);
      }
  
      // On calcule la distance entre le cercle et le bout du vecteur ahead
      let distance1 = pointAuBoutDeAhead.dist(obstacleLePlusProche.pos);
      let distance2 = pointAuBoutDeAhead2.dist(obstacleLePlusProche.pos);
      let distance = min(distance1, distance2);
  
  
      // On dessine le point au bout du vecteur ahead pour debugger
      fill("red");
      circle(pointAuBoutDeAhead.x, pointAuBoutDeAhead.y, 10);
      fill("blue");
      circle(pointAuBoutDeAhead2.x, pointAuBoutDeAhead2.y, 10);
  
      // On dessine la zone d'évitement
      // Pour cela on trace une ligne large qui va de la position du vaisseau
      // jusqu'au point au bout de ahead
      stroke(100, 100);
      strokeWeight(this.largeurZoneEvitementDevantVaisseau);
      line(this.pos.x, this.pos.y, pointAuBoutDeAhead.x, pointAuBoutDeAhead.y);
  
      // si la distance est < rayon de l'obstacle
      // il y a collision possible et on dessine l'obstacle en rouge
  
      if (distance < obstacleLePlusProche.r + this.largeurZoneEvitementDevantVaisseau + this.r) {
        // collision possible 
  
        // calcul de la force d'évitement. C'est un vecteur qui va
        // du centre de l'obstacle vers le point au bout du vecteur ahead
        let force;
        if (distance1 < distance2) {
          force = p5.Vector.sub(pointAuBoutDeAhead, obstacleLePlusProche.pos);
        }
        else {
          force = p5.Vector.sub(pointAuBoutDeAhead2, obstacleLePlusProche.pos);
        }
        // on le dessine en jaune pour vérifier qu'il est ok (dans le bon sens etc)
        this.drawVector(obstacleLePlusProche.pos, force, "yellow");
  
        // Dessous c'est l'ETAPE 2 : le pilotage (comment on se dirige vers la cible)
        // on limite ce vecteur à la longueur maxSpeed
        // force est la vitesse désirée
        force.setMag(this.maxSpeed);
        // on calcule la force à appliquer pour atteindre la cible avec la formule
        // que vous commencez à connaitre : force = vitesse désirée - vitesse courante
        force.sub(this.vel);
        // on limite cette force à la longueur maxForce
        force.limit(this.maxForce);
        return force;
      } else {
        // pas de collision possible
        return createVector(0, 0);
      }
    }
  
  
    getObstacleLePlusProche(obstacles) {
      let plusPetiteDistance = 100000000;
      let obstacleLePlusProche = undefined;
  
      obstacles.forEach(o => {
        // Je calcule la distance entre le vaisseau et l'obstacle
        const distance = this.pos.dist(o.pos);
  
        if (distance < plusPetiteDistance) {
          plusPetiteDistance = distance;
          obstacleLePlusProche = o;
        }
      });
  
      return obstacleLePlusProche;
    }
  
    getVehiculeLePlusProche(vehicules) {
      let plusPetiteDistance = Infinity;
      let vehiculeLePlusProche;
  
      vehicules.forEach(v => {
        if (v != this) {
          // Je calcule la distance entre le vaisseau et le vehicule
          const distance = this.pos.dist(v.pos);
          if (distance < plusPetiteDistance) {
            plusPetiteDistance = distance;
            vehiculeLePlusProche = v;
          }
        }
      });
  
      return vehiculeLePlusProche;
    }
  
  
   /* getClosestObstacle(pos, obstacles) {
      // on parcourt les obstacles et on renvoie celui qui est le plus près du véhicule
      let closestObstacle = null;
      let closestDistance = 1000000000;
      for (let obstacle of obstacles) {
        let distance = pos.dist(obstacle.pos);
        if (closestObstacle == null || distance < closestDistance) {
          closestObstacle = obstacle;
          closestDistance = distance;
        }
      }
      return closestObstacle;
    }*/
  
    arrive(target) {
      let force = p5.Vector.sub(target, this.pos);
      let distance = force.mag();
      let desiredSpeed = this.maxSpeed;
    
      // Augmenter l'effet dans la zone de ralentissement
      let slowRadius = 200; // Étendez la zone de ralentissement
      if (distance < slowRadius) {
        desiredSpeed = map(distance, 0, slowRadius, 0, this.maxSpeed);
      }
    
      force.setMag(desiredSpeed);
      force.sub(this.vel);
      force.limit(this.maxForce);
      return force;
    }
  
    seek(target, arrival = false) {
      let force = p5.Vector.sub(target, this.pos);
      let desiredSpeed = this.maxSpeed;
      if (arrival) {
        let slowRadius = 100;
        let distance = force.mag();
        if (distance < slowRadius) {
          desiredSpeed = map(distance, 0, slowRadius, 0, this.maxSpeed);
        }
      }
      force.setMag(desiredSpeed);
      force.sub(this.vel);
      force.limit(this.maxForce);
      return force;
    }
  
    // inverse de seek !
    flee(target) {
      return this.seek(target).mult(-1);
    }
  
    /* Poursuite d'un point devant la target !
       cette methode renvoie la force à appliquer au véhicule
    */
       pursue(vehicle) {
        let target = vehicle.pos.copy();
        let prediction = vehicle.vel.copy();
        prediction.mult(10); // Prédire la position future
        target.add(prediction);
      
        // Dessiner la cible prédite
        push();
        fill(0, 255, 0, 100); // Cercle vert transparent
        noStroke();
        circle(target.x, target.y, 16);
        pop();
      
        return this.seek(target);
      }
      
  
    evade(vehicle) {
      let pursuit = this.pursue(vehicle);
      pursuit.mult(-1);
      return pursuit;
    }
  
    // Comportement Separation : on garde ses distances par rapport aux voisins
    // ON ETUDIERA CE COMPORTEMENT PLUS TARD !
    separate(boids) {
      let desiredSeparation = this.r*2;
      let steer = createVector(0, 0);
      let count = 0;
    
      boids.forEach(other => {
        let d = p5.Vector.dist(this.pos, other.pos);
        if (d > 0 && d < desiredSeparation) {
          let diff = p5.Vector.sub(this.pos, other.pos);
          diff.normalize();
          diff.div(d);
          steer.add(diff);
          count++;
        }
      });
    
      if (count > 0) {
        steer.div(count);
      }
    
      if (steer.mag() > 0) {
        steer.normalize();
        steer.mult(this.maxSpeed);
        steer.sub(this.vel);
        steer.limit(this.maxForce);
      }
    
      return steer;
    }
  
    // applyForce est une méthode qui permet d'appliquer une force au véhicule
    // en fait on additionne le vecteurr force au vecteur accélération
    applyForce(force) {
      this.acc.add(force);
    }
  
    update() {
      this.vel.add(this.acc); // Mise à jour de la vitesse
      this.vel.limit(this.maxSpeed); // Limiter la vitesse
      this.pos.add(this.vel); // Mise à jour de la position
    
      this.acc.set(0, 0); // Réinitialiser l'accélération
      this.ajoutePosAuPath(); // Met à jour le chemin
    }
  
    ajoutePosAuPath() {
      // on rajoute la position courante dans le tableau
      this.path.push(this.pos.copy());
  
      // si le tableau a plus de 50 éléments, on vire le plus ancien
      if (this.path.length > this.pathMaxLength) {
        this.path.shift();
      }
    }
  
    // On dessine le véhicule, le chemin etc.
    show() {
      if (leaderMode && this === leader) {
        // Cercle spécial autour du leader
        push();
        imageMode(CENTER); // Centrer l'image
        image(lukeImage, this.pos.x, this.pos.y, this.r * 2, this.r * 1.5); // Taille ajustée avec this.r
        pop();
      }
      // dessin du chemin
      this.drawPath();
      // dessin du vehicule
      this.drawVehicle();
    }
  
    drawVehicle() {
      // formes fil de fer en blanc
      stroke(255);
      // épaisseur du trait = 2
      strokeWeight(2);
  
      // formes pleines
      fill(this.color);
  
      // sauvegarde du contexte graphique (couleur pleine, fil de fer, épaisseur du trait, 
      // position et rotation du repère de référence)
      push();
      // on déplace le repère de référence.
      translate(this.pos.x, this.pos.y);
      // et on le tourne. heading() renvoie l'angle du vecteur vitesse (c'est l'angle du véhicule)
      rotate(this.vel.heading());
  
      // Dessin d'un véhicule sous la forme d'un triangle. Comme s'il était droit, avec le 0, 0 en haut à gauche
      triangle(-this.r_pourDessin, -this.r_pourDessin / 2, -this.r_pourDessin, this.r_pourDessin / 2, this.r_pourDessin, 0);
      // Que fait cette ligne ?
      //this.edges();
  
      // cercle pour le debug
      if (Vehicle.debug) {
        stroke(255);
        noFill();
        circle(0, 0, this.r);
      }
  
      // draw velocity vector
      pop();
      this.drawVector(this.pos, this.vel, color(255, 0, 0));
  
      // Cercle pour évitement entre vehicules et obstacles
      if (Vehicle.debug) {
        stroke(255);
        noFill();
        circle(this.pos.x, this.pos.y, this.r);
      }
    }
  
    drawPath() {
      push();
      stroke(255);
      noFill();
      strokeWeight(1);
  
      fill(this.color);
      // dessin du chemin
      this.path.forEach((p, index) => {
        if (!(index % 5)) {
  
          circle(p.x, p.y, 1);
        }
      });
      pop();
    }
    drawVector(pos, v, color) {
      push();
      // Dessin du vecteur vitesse
      // Il part du centre du véhicule et va dans la direction du vecteur vitesse
      strokeWeight(3);
      stroke(color);
      line(pos.x, pos.y, pos.x + v.x, pos.y + v.y);
      // dessine une petite fleche au bout du vecteur vitesse
      let arrowSize = 5;
      translate(pos.x + v.x, pos.y + v.y);
      rotate(v.heading());
      translate(-arrowSize / 2, 0);
      triangle(0, arrowSize / 2, 0, -arrowSize / 2, arrowSize, 0);
      pop();
    }
  
    // que fait cette méthode ?
    edges() {
      if (this.pos.x > width + this.r) {
        this.pos.x = -this.r;
      } else if (this.pos.x < -this.r) {
        this.pos.x = width + this.r;
      }
      if (this.pos.y > height + this.r) {
        this.pos.y = -this.r;
      } else if (this.pos.y < -this.r) {
        this.pos.y = height + this.r;
      }
    }
  }
  
  class Target extends Vehicle {
    constructor(x, y) {
      super(x, y);
      this.vel = p5.Vector.random2D();
      this.vel.mult(5);
    }
  
    show() {
      push();
      /*if (vehicules.indexOf(this) === 0) {
        this.color = "yellow"; // Le premier véhicule en jaune
      }
      this.drawPath();
      this.drawVehicle();*/
      stroke(255);
      strokeWeight(2);
      fill("#F063A4");
      push();
      translate(this.pos.x, this.pos.y);
      circle(0, 0, this.r * 2);
      pop();
      pop();
    }
  }

  class Wanderer extends Vehicle {
    constructor(x, y) {
      super(x, y); // Appelle le constructeur de la classe Vehicle
      this.color = "blue"; // Couleur spécifique pour les Wanderers
      this.wanderTheta = random(TWO_PI); // Angle initial pour Wander
    }
  
    // Surcharge de la méthode `applyBehaviors` pour ajouter le comportement Wander
    applyBehaviors(obstacles) {
      let wanderForce = this.wander(); // Comportement wander
      let avoidForce = this.avoid(obstacles); // Éviter les obstacles
      let boundariesForce = this.boundaries(); // Repoussé par les bords de l'écran
  
      // Pondération des forces
      wanderForce.mult(1.5); // Force principale pour l'errance
      avoidForce.mult(3.0); // Évitement des obstacles prioritaire
      boundariesForce.mult(2.0); // Rester dans les limites de l'écran
  
      // Appliquer les forces au Wanderer
      this.applyForce(wanderForce);
      this.applyForce(avoidForce);
      this.applyForce(boundariesForce);
    }
  
    // Comportement Wander (errance)
    wander() {
      let wanderRadius = 50; // Rayon pour le cercle de Wander
      let wanderDistance = 100; // Distance devant le véhicule
      let change = 0.3; // Angle aléatoire pour errer
  
      // Modifier l'angle progressivement pour un mouvement fluide
      this.wanderTheta += random(-change, change);
  
      // Position du cercle de Wander devant le véhicule
      let wanderCircle = this.vel.copy();
      wanderCircle.setMag(wanderDistance);
  
      // Calcul du point cible sur le cercle de Wander
      let wanderPoint = p5.Vector.add(
        wanderCircle,
        createVector(
          wanderRadius * cos(this.wanderTheta),
          wanderRadius * sin(this.wanderTheta)
        )
      );
  
      let target = p5.Vector.add(this.pos, wanderPoint); // Point cible
      return this.seek(target); // Générer une force pour aller vers la cible
    }
  
    // Comportement pour rester dans les bords de l'écran
    boundaries() {
      let desired = null;
  
      if (this.pos.x < 50) {
        desired = createVector(this.maxSpeed, this.vel.y);
      } else if (this.pos.x > width - 50) {
        desired = createVector(-this.maxSpeed, this.vel.y);
      }
  
      if (this.pos.y < 50) {
        desired = createVector(this.vel.x, this.maxSpeed);
      } else if (this.pos.y > height - 50) {
        desired = createVector(this.vel.x, -this.maxSpeed);
      }
  
      if (desired !== null) {
        desired.setMag(this.maxSpeed);
        let steer = p5.Vector.sub(desired, this.vel);
        steer.limit(this.maxForce);
        return steer;
      }
      return createVector(0, 0);
    }
    
    // Dessin spécifique des Wanderers
    show() {
      push();
      imageMode(CENTER); // Centrer l'image sur la position
      image(wandererImage, this.pos.x, this.pos.y, this.r_pourDessin * 4, this.r_pourDessin * 4);
      pop();
    }
  }

  class Enemy {
    constructor(x, y) {
      this.pos = createVector(x, y); // Position initiale
      this.vel = p5.Vector.random2D(); // Vitesse aléatoire
      this.acc = createVector(0, 0); // Accélération
      this.size = 60; // Taille de l'ennemi
      this.maxSpeed = 3; // Vitesse maximale
      this.maxForce = 0.2; // Force maximale
      this.fireCooldown = 120; // Temps entre chaque tir (en frames)
      this.lastFire = 0; // Dernier moment où l'ennemi a tiré
      this.r = 30; // Rayon de l'ennemi, plus petit pour ajuster la taille

    }
  
    // Applique les comportements (évitement d'obstacles, déplacement)
    applyBehaviors(obstacles) {
      let wanderForce = this.wander(); // Mouvement aléatoire
      let avoidForce = this.avoid(obstacles); // Éviter les obstacles
  
      wanderForce.mult(1.5); // Pondération pour errer
      avoidForce.mult(3.0); // Priorité forte pour éviter les obstacles
  
      // Appliquer les forces
      this.applyForce(wanderForce);
      this.applyForce(avoidForce);
    }
  
    // Comportement wander (mouvement aléatoire)
    wander() {
      let wanderRadius = 50; // Rayon de la "bulle" wander
      let wanderDistance = 100; // Distance devant l'ennemi
      let change = 0.3; // Variation aléatoire
  
      this.wanderTheta = (this.wanderTheta || 0) + random(-change, change); // Angle erratique
  
      // Calculer la position cible
      let wanderCircle = this.vel.copy().setMag(wanderDistance); // Cercle devant l'ennemi
      let wanderPoint = p5.Vector.add(
        wanderCircle,
        createVector(
          wanderRadius * cos(this.wanderTheta),
          wanderRadius * sin(this.wanderTheta)
        )
      );
  
      let target = p5.Vector.add(this.pos, wanderPoint); // Point cible
      return this.seek(target); // Générer une force pour y aller
    }
  
    // Chercher une cible
    seek(target) {
      let desired = p5.Vector.sub(target, this.pos); // Direction vers la cible
      desired.setMag(this.maxSpeed); // Régler à la vitesse maximale
      let steer = p5.Vector.sub(desired, this.vel); // Steering = Desired - Velocity
      steer.limit(this.maxForce); // Limiter la force de steering
      return steer;
    }
  
    // Éviter les obstacles
    avoid(obstacles) {
      let ahead = this.vel.copy().setMag(50); // Vecteur devant l'ennemi
      let ahead2 = ahead.copy().mult(0.5); // Milieu du vecteur
  
      let closestObstacle = this.getClosestObstacle(obstacles, ahead, ahead2);
  
      if (!closestObstacle) return createVector(0, 0);
  
      let avoidForce = p5.Vector.sub(this.pos, closestObstacle.pos);
      avoidForce.setMag(this.maxSpeed);
      avoidForce.sub(this.vel);
      avoidForce.limit(this.maxForce);
  
      return avoidForce;
    }
  
    // Obtenir l'obstacle le plus proche
    getClosestObstacle(obstacles, ahead, ahead2) {
      let closest = null;
      let minDist = Infinity;
  
      obstacles.forEach(obstacle => {
        let distToAhead = obstacle.pos.dist(this.pos.copy().add(ahead));
        let distToAhead2 = obstacle.pos.dist(this.pos.copy().add(ahead2));
        if (distToAhead < obstacle.r || distToAhead2 < obstacle.r) {
          let d = this.pos.dist(obstacle.pos);
          if (d < minDist) {
            minDist = d;
            closest = obstacle;
          }
        }
      });
  
      return closest;
    }
  
    // Appliquer une force
    applyForce(force) {
      this.acc.add(force);
    }
  
    // Mise à jour de l'ennemi
    update() {
      this.pos.add(this.vel); // Mise à jour de la position
      this.edges(); // Faire rebondir l'ennemi sur les bords
    
      // Tir automatique
      this.shoot();
    }
  
    // Empêcher l'ennemi de sortir de l'écran
    edges() {
      if (this.pos.x > width || this.pos.x < 0) {
        this.vel.x *= -1;
      }
      if (this.pos.y > height || this.pos.y < 0) {
        this.vel.y *= -1;
      }
    }
  
    // Tirer des balles
    shoot() {
      if (frameCount - this.lastFire > this.fireCooldown) {
        let bulletVel = p5.Vector.random2D().setMag(6); // Direction aléatoire
        enemyBullets.push(new EnemyBullet(this.pos, bulletVel));
        this.lastFire = frameCount; // Mettre à jour le dernier tir
      }
    }
  
    // Affichage de l'ennemi
    show() {
      push();
      imageMode(CENTER); // Centrer l'image sur la position de l'ennemi
    image(enemyImage, this.pos.x, this.pos.y, this.r * 3, this.r * 3); // Dessiner l'image
    pop();
    }
  }


  class EnemyBullet {
    constructor(pos, vel) {
      this.pos = pos.copy(); // Position initiale
      this.vel = vel.copy().setMag(6); // Vitesse initiale
      this.size = 8; // Taille des balles
    }
  
    update() {
      this.pos.add(this.vel); // Mise à jour de la position
    }
  
    show() {
      push();
      fill(255, 0, 0); // Rouge pour les balles ennemies
      noStroke();
      circle(this.pos.x, this.pos.y, this.size);
      pop();
    }
  
    // Vérifier si la balle est hors de l'écran
    isOutOfBounds() {
      return this.pos.x < 0 || this.pos.x > width || this.pos.y < 0 || this.pos.y > height;
    }
  }
  


class Bullet {
  constructor(pos, vel) {
    this.pos = pos.copy(); // Position initiale (à l'avant du véhicule)
    this.vel = vel.copy().setMag(10); // Vitesse rapide de la balle
    this.size = 8; // Taille de la balle
  }

  update() {
    this.pos.add(this.vel); // Déplace la balle
  }

  show() {
    push();
    fill(255, 255, 0); // Jaune pour les balles des véhicules
    noStroke();
    circle(this.pos.x, this.pos.y, this.size); // Cercle représentant la balle
    pop();
  }

  isOutOfBounds() {
    // Vérifie si la balle est hors écran
    return this.pos.x < 0 || this.pos.x > width || this.pos.y < 0 || this.pos.y > height;
  }
}


