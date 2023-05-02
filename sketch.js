// Reference code links for bird：https://openprocessing.org/sketch/871526
// Reference code links for eat：https://editor.p5js.org/beckyaston/sketches/I3lZ7fCyc
// Reference code links for tree：https://editor.p5js.org/joemcalister/sketches/6v-N3urTT
// Reference code links for body track: https://editor.p5js.org/eri.kalaitzidi/sketches/ODpPqP2un


// -----Initialize the variables for drawing the bird-----
var birds;
var fillColors;
let bg;
let newAng = [];

// -----Initialising variables for body tracking----------
let video;
let poseNet;
let pose;
let skeleton;
let bodyposX;
let bodyposY;

// --Distribution of food--
let food = [];

// ----Update the structure of the position for bird-----
class Bird {
  constructor(){
  this.loc = new createVector(random(width), random(height));  // Update the location here
  var velSize = random(3);  
  var velAng = random(TWO_PI);
  this.vel = new createVector(velSize * cos(velAng), velSize * sin(velAng)); 
  this.vertices = []; 
  this.fillColor = fillColors[int(random(fillColors.length))];

  // ------The initial speed of the pigeons--------
  this.velocity = new createVector(random(-2,2),random(-2,2));  // Velocity of shape
  this.desired = new createVector(0, 0);   // Attractiveness - Anticipation to the next direction
  this.diameter = new createVector(0, 0);   // Radius of bird
  this.full = 0;
  this.center = new createVector(0,0);
  }
  
  // -----------Preparation for drawing the shape of the dove---------
  render() {
    noStroke();
    fill(this.fillColor);
    if (this.vertices.length < 4) {
      return; 
    }    

    let centerX = 0;
    let centerY = 0;
    beginShape();
    
    for (var i = 0; i < 4; i++) {
      var v = this.vertices[i];
      vertex(v.x, v.y);
      centerX = centerX + this.vertices[i].x;
      centerY = centerY + this.vertices[i].y;
    }
    endShape(CLOSE);

  this.center = createVector(centerX/3, centerY/3);
  let dis1 = dist(this.center.x,this.center.y,this.vertices[0].x,this.vertices[0].y);
  let dis2 = dist(this.center.x,this.center.y,this.vertices[1].x,this.vertices[1].y);
  let dis3 = dist(this.center.x,this.center.y,this.vertices[2].x,this.vertices[2].y);
  this.diameter = max(dis1,dis2,dis3);
  }
  
  // --------Change the area of the latest position----------
  update() {  
    var location = createVector(this.bodyposX, this.bodyposY);
    var acc = p5.Vector.sub(location, this.loc).limit(1); //Take the current position and subtract it from the current position
    acc.mult(randomGaussian(1, 1));
    acc.rotate(randomGaussian(0, PI / 3)); // Change of angle
    this.vel.add(acc);
    this.vel.limit(10);
    this.loc.add(this.vel);
    this.vertices.push(p5.Vector.add(this.loc, this.vel.copy().rotate(random(TWO_PI))));

    if (this.vertices.length > 4) {   // The number of edges in a shape can be changed by changing the value
      this.vertices.shift(); // Loop through the array and delete when it reaches 3
      
      // ----------Birdie reaches edge bounce------------
      if (this.loc.x > width){
        this.loc.x = width;
        this.vertices.x = this.vertices.x * -1;
      }
      if (this.loc.x < 0) {
        this.loc.x = 0;
        this.vertices.x = this.vertices.x * -1;
      }
      if (this.loc.y < 0) {
        this.loc.y = 0;
        this.vertices.y = this.vertices.y * -1;
      }
      if (this.loc.y > height) {
        this.loc.y = height;
        this.vertices.y = this.vertices.y * -1; 
      }
      
      // ----- Eat food ------ 
      if(this.full > 0){
        this.full--;
      }
    }

}

  moveToFood(x, y){ // x and y refer to the location of the food
     
    // If it has been eaten, put it back without execution
    if(this.full>0){
      return false;
    }

    this.desired.x = x;   
    this.desired.y = y;
    let direction = p5.Vector.sub(this.desired, this.center); // Confirmation of the direction of travel
    
    if (direction.mag() < this.diameter/2){     //If the distance is less than means it has been eaten
      this.full = 1000;
      return true;
    } 
  } 
}

function setup() {
  createCanvas(windowWidth, windowHeight);
  bg = loadImage('background.png');
  background(bg); 
  fillColors = [    // Assign 3 colours for bird
    color(0, 0, 0),
    color(50, 50, 50), 
    color(83, 83, 83)
  ];
  frameRate(30);
  birds = [];            // Allocate an array to store the stuff of each array
  for (var i = 0; i < 90; i++) {     // the number of bird for I want 
    birds.push(new Bird());    
  }
  stroke(50);        
  fill(0);
  for(let i=0; i<30; i++){
    newAng[i] = random(PI*0.3);
  }

  // -------Body tracking--------
  // load webcam and hide the video element to only view the canvas
  video = createCapture(VIDEO);
  video.size(width, height);
  video.hide();

  poseNet = ml5.poseNet(video);
  
  //.on is an event listener that returns the results when a pose is detected
  poseNet.on("pose", gotPoses);
  bodyposX = 0;
  bodyposY = 0;
}

function draw() {  
  background(bg);
  
  translate(video.width, 0);
  scale(-1, 1);
  // --Presence of action in contrast to video--
  if (pose) {
    ellipse(pose.keypoints[9].position.x,pose.keypoints[9].position.y, 10, 10);
    bodyposX = pose.keypoints[0].position.x;
    bodyposY = pose.keypoints[0].position.y;
  }
  else{
     bodyposX = random(width);
     bodyposY = random(height);
  }

  // ----- Drawing the visual picture ------
  push();
  translate(width, 0);
  scale(-1, 1);
  stroke(50);
  fill(0,0,0);
  drawTree();
  pop();

  push();
  drawFog();
  pop();

  // ------ Constantly recurring position updates -------
  for (var i = 0; i < birds.length; i++) {
    var bird = birds[i]; 
    bird.render();
    bird.bodyposX = bodyposX;
    bird.bodyposY = bodyposY;
    bird.update();

    if(food.length > 0){
      for(let i=0; i< food.length ;i++){
      let distance= dist(bird.center.x, bird.center.y, food[i].x, food[i].y);
      if(distance < 300){  // Judging how much to eat by distance
        bird.bodyposX = food[food.length-1].x;
        bird.bodyposY = food[food.length-1].y;
        bird.update();
        if(bird.moveToFood(food[food.length-1].x,food[food.length-1].y)){
          food.pop();
          } 
      }
    }
  } 
}
  updateFood();  // Increase food
}


//   ------ tree code-------
function drawFog(){
  push();
  fill(32, 16);
  noStroke();
  rect(0,0,width,height);
  pop();
}


// Initialization of the tree
// Drawing the tree as a standing point
function drawTree(){
  let bLen = 180;
  let bAng = -PI*0.5;
  let Ang = 0;
  push();
  translate(width/8, height);
  branch(bLen, bAng, Ang); // initial length and facing up
  pop();
}

// same recusive function as in Tree.pde, only using random numbers
function branch(len, theta, Ang){
push();
rotate(theta); // rotate to the angle provided
strokeWeight(sqrt(len*10)*0.3);
line(0,0, len, 0); // draw one branch
translate(len,0); // and move to its edge

if(len > 30.0){ // stop condition - very important!
  Ang++;;
  branch(len * 0.7, - newAng[Ang]*0.4, Ang); // left branch
  branch(len * 0.85, newAng[Ang], Ang);   // right branch  
}else{
  push();
  fill(80);
  stroke(50);
  strokeWeight(3);
  ellipse(0,0,10,10); // only draw a leaf
  pop();
}
pop();

}

function modelReady() {
  console.log("model ready");
}

function gotPoses(poses) {
  //poses is an array of all the poses the model detects in each frame
  //each pose has two properties: pose and skeleton
  
    //only when at least one pose is detected, access the poses
  if (poses.length > 0) {
    pose = poses[0].pose;
    skeleton = poses[0].skeleton;
  }
}

// -----------Updating food upatefood----------
function updateFood(){  // Update the location of food
  for(let i = food.length-1; i >= 0 ; i--){   //From back to front
    fill(0);
    circle(food[i].x,food[i].y,food[i].d);
    food[i].y += 1;   // Effect of food landing
    if(food[i].y > height){
      food.splice(i,1);//remove one from array at index i 
    }
  }
}

// ------- Press to assign new position for food ---------
function mousePressed() {   
   // if(food.length == 0 ){   //Increase in food, and size
      food.push({
          x:random(width),
          y:random(height),
          d:random(15,40)
        });
   // }
}

// ------Change the size of the window--------
function windowResized() {  
  resizeCanvas(windowWidth, windowHeight);
}