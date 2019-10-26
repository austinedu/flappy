/// <reference path="./p5/p5.global-mode.d.ts" />

var score = 0;
var hiscore = 0;
var time = 0;
var hue_val = 0;

const LOADING = 0;
const PLAYING = 1;
const GAMEOVER = 2;
const WAIT_RESTART = 3;
var gamestate = LOADING;

const WIDTH = 600;
const HEIGHT = 900;
const CEILING = 0;
const GROUND = HEIGHT;
var ground_speed = 7;
const START_HEIGHT = 300;

const DINO_SIZE = 40;

const FPS = 60;

const JUMP_VELOCITY = 15;
const GRAVITY = -80/FPS;

var dino;
var obstacles = [];
const NUM_OBSTACLES = 4;

class BoundingBox {
  constructor(x, y, width, height) {
    this.x = x;
    this.y = y;
    this.width = width;
    this.height = height;
    this.intersecting = false;
  }

  get left(){
    return this.x;
  }

  get right() {
    return this.width + this.x;
  }

  get top() {
    return this.y;
  }

  get cX() {
    return this.x + this.width/2;
  }
  get cY() {
    return this.y + this.height/2;
  }


  get bottom() {
    return this.y + this.height;
  }

  set bottom(new_y) {
    this.y = new_y - this.height;
  }

  set left(new_x) {
    this.x = new_x;
  }

  intersects(other){
    // find cases when not overlapping, and invert to get when overlapping.
    let result = !(other.left > this.right
      || other.right < this.left
      || other.top > this.bottom
      || other.bottom < this.top);
    return result;
  }

  check_is_intersecting(other){
    this.intersecting = this.intersects(other);
    console.log(this.intersecting);
  }

  draw(h, f) {
    stroke(h, 100, 50);
    strokeWeight(5);
    fill(h, 100, 70);
    rect(this.x, this.y, this.width, this.height);
  }
}

const BETWEEN_OBSTACLES = WIDTH*.6
const GAP_SIZE = 200;
class Obstacle {
  constructor(next) {
    this.next = next;
    this.generate();
  }
  // generates a location for this obstacle.
  generate() {
    this.boxes = []
    let gap = random(10, HEIGHT-10-GAP_SIZE);
    this.boxes.push(new BoundingBox(BETWEEN_OBSTACLES*this.next, 0, 60, gap));
    this.boxes.push(new BoundingBox(BETWEEN_OBSTACLES*this.next, gap+GAP_SIZE, 60, HEIGHT-GAP_SIZE-gap));
    this.next = NUM_OBSTACLES;
  }

  update() {
    // move the obstacle towards the left of the screen.
    this.boxes[0].left -= ground_speed;
    this.boxes[1].left -= ground_speed;
    // if we go off the screen, we should regenerate the box
    if (this.boxes[0].right < 0) {
      this.generate();
    }
  }

  collides(other) {
    return this.boxes[0].intersects(other) || this.boxes[1].intersects(other)
  }

  draw() {
    this.boxes[0].draw(0);
    this.boxes[1].draw(0);
  }
}

class Dinosaur {
  constructor() {
    this.vy = 0;
    this.box = new BoundingBox(20, START_HEIGHT, DINO_SIZE, DINO_SIZE);
  }

  update() {
    this.box.bottom -= this.vy;
    if (this.box.top < CEILING || this.box.bottom > GROUND) {
      this.vy *= -.9
      this.box.bottom -= this.vy;
    } 
    if (!this.isOnGround()) {
      this.vy += GRAVITY;
    }
    
  } 

  isOnGround() {
    return this.box.bottom == GROUND;
  }

  jump() {
    this.vy = JUMP_VELOCITY;
  }
  
  draw() {
    this.box.draw(hue_val);
  }
}




function start_game() {
  score = 0;
  dino = new Dinosaur();
  obstacles = [];
  for (let i = 0; i < NUM_OBSTACLES; i++) {
    obstacles.push(new Obstacle(i+2));
  }
  gamestate = PLAYING;
  ground_speed = 3;
}

function setup() {
  createCanvas(WIDTH, HEIGHT);  
  colorMode(HSL);
  frameRate(FPS);

  start_game();
}

// Draws the score and high score on the screen.
function draw_score(){
  textFont("Consolas");
  textStyle(NORMAL);
  strokeWeight(0);
  fill(20);
  textSize(20);
  text("HI " + get_score_text(score), 10, 20);
  fill(0);
  text(get_score_text(hiscore), 110, 20);

}

// Converts score integer to text (has zeros behind it)
function get_score_text(score) {
  var score_text = ""
  if (score < 10000){
    score_text += '0';
  }
  if (score < 1000) {
    score_text += '0';
  }
  if (score < 100) {
    score_text += '0';
  }
  if (score < 10) {
    score_text += '0';
  }
  return score_text + score;
}

// Draw gameover screen
function draw_gameover() {
  // Draw darkened rectangle
  strokeWeight(0);
  textFont("Consolas");
  fill(255, 255, 255, 0.4);
  rect(0, 0, width, height);
  // Draw game over text
  fill(10);
  textSize(60);
  text("GAME OVER", 135, 300);
  textSize(30);
  if (gamestate == GAMEOVER) {
    text("Hit spacebar twice to restart.", 60, 350);
  }
  if (gamestate == WAIT_RESTART) {
    text("Hit spacebar to restart.", 100, 350);
  }
}

function draw_ground() {
  fill(255, 50, 50);
  noStroke();
  // Draw both the ground and the ceiling
  rect(0, 0, WIDTH, 5);
  rect(0, HEIGHT-5, WIDTH, 5);
}

function draw_game() {
  dino.draw();
  // Draw the obstacles
  for (const o of obstacles){
    o.draw();
  }

  // draw the ground
  draw_ground();
  
}

const BACKGROUND_WIDTH = 60;
const TRANSP = 0.2;
function draw_background() {
  noStroke();
  background(100)
  
  var offset = time % BACKGROUND_WIDTH;
  for (var i = -offset; i < WIDTH; i += BACKGROUND_WIDTH) {
    fill(255, 50, 50, TRANSP);
    rect(i, 0, BACKGROUND_WIDTH/2, HEIGHT);
    fill(200, 50, 50, TRANSP);
    rect(i+BACKGROUND_WIDTH/2, 0, BACKGROUND_WIDTH/2, HEIGHT);
  }
}

function draw() {
  draw_background();

  if (gamestate == PLAYING) {
    time++;
    hue_val = (hue_val+1) % 300;
    // Calculate the score.
    if (time%10 == 0){
      score++;
      if (score > hiscore){
        hiscore = score;
      }
    }
    update_game();
  }
  draw_game();
  if (gamestate == GAMEOVER || gamestate == WAIT_RESTART) {
    draw_gameover();
  }
  draw_score();
}

function update_game() {
  dino.update();

  for (const o of obstacles){
    o.update();
  }

  // if (dino.box.top > HEIGHT || dino.box.bottom < 0) {
  //   gamestate = GAMEOVER;
  // }

  // check if a box intersects with the dino. 
  for (const o of obstacles) {
    if (o.collides(dino.box)){
      gamestate = GAMEOVER;
    }
    
  }

  if (time % 1000 == 0) {
    ground_speed += 0.5;
  }
}

function keyPressed(){
  // spacebar pressed
  if (keyCode == 32){
    if (gamestate == WAIT_RESTART || gamestate == LOADING) {
      start_game();
    }
    if (gamestate == GAMEOVER){
      gamestate = WAIT_RESTART;
    }
    if (gamestate == PLAYING) {
      if (dino != null)
        dino.jump();
    }
  }
  if (keyCode == LEFT_ARROW) {
    if (gamestate == PLAYING) {
      dino.move_left();
    }
  }
  if (keyCode == RIGHT_ARROW) {
    if (gamestate == PLAYING) {
      dino.move_right();
    }
  }
}