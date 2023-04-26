var particles;
var fillColors;
let newAng = [];

// 身体追踪
let video;
let poseNet;
let pose;
let skeleton;

function setup() {
  createCanvas(windowWidth, windowHeight);
  background(0); 
  fillColors = [             // 分配3种颜色
    color(0, 0, 0),
    color(156, 156, 156), 
    color(83, 83, 83)
  ];
  frameRate(30);
  particles = [];            // 分配一个数组存储每个数组的东西
  for (var i = 0; i < 100; i++) {        // for循环个十次得出10个
    particles.push(new Particle());    
  }
  stroke(50);        
  fill(0);
  for(let i=0; i<30; i++){
    newAng[i] = random(PI*0.3);
  }
  
  //身体追踪
  // load webcam and hide the video element to only view the canvas
  video = createCapture(VIDEO);
  video.size(width, height);
  video.hide();
  
  //load poseNet pre-trained model and connect it to the video
  //modelReady is a callback telling me when the poseNet model is done loading
  //poseNet = ml5.poseNet(video, modelReady);
  poseNet = ml5.poseNet(video);
  
  //.on is an event listener that returns the results when a pose is detected
  poseNet.on("pose", gotPoses);
}

function draw() {
  //绘制背景 -- 会覆盖原来的痕迹
  //绘制树木
  
  background(255);
  

  //image(video, 0, 0);
  
  //if a pose is detected
  if (pose) {
    
    //loop through all the keypoints and draw an ellipse for each one of them
    for (let i=0; i<pose.keypoints.length; i++){
      //draw a keypoint only if confidence is over a threshold
      //if (pose.keypoints[i].score > 0.2) {
        noStroke();
        ellipse(pose.keypoints[i].position.x,pose.keypoints[i].position.y, 10, 10);
      //}
    }

    let bodyposX = pose.keypoints[9].position.x;
    let bodyposY = pose.keypoints[9].position.y;
  
    
    //loop through all the skeleton data and draw a line for each pair of neighbour joints
    // 循环浏览所有骨架数据，为每一对相邻关节画一条线。
    for (let i=0; i<skeleton.length; i++){
      //skeleton is a 2d array
      let point_a = skeleton[i][0];
      let point_b = skeleton[i][1];
      stroke(0);
      strokeWeight(4);
      line(point_a.position.x, point_a.position.y, point_b.position.x, point_b.position.y);
    }
  }

  // 绘制视觉画面
  push();
  stroke(120); 
  drawTree();
  pop();

  push();
  drawFog(); // only draw the fog evey 16 frames 只有没16帧的时候才绘制
  pop();
  // 不断循环更新位置
  for (var i = 0; i < particles.length; i++) {
    var particle = particles[i]; 
    particle.render();
    particle.update(pose);
  }
}

// 更新位置的结构体
function Particle() {
  this.loc = createVector(random(width), random(height));  // 在这里更新位置
  var velSize = random(3);
  var velAng = random(TWO_PI);
  this.vel = createVector(velSize * cos(velAng), velSize * sin(velAng));
  this.vertices = [];
  this.fillColor = fillColors[int(random(fillColors.length))];
}

Particle.prototype = {
  render: function() {
    noStroke();
    fill(this.fillColor);
    if (this.vertices.length < 3) {
      return; 
    }    
    beginShape();
    for (var i = 0; i < 3; i++) {
      var v = this.vertices[i];
      vertex(v.x, v.y);
    }
    endShape(CLOSE);
  },
  
  update: function(pose) {
  
    var target = createVector(this.bodyposX, this.bodyposY);
    var acc = p5.Vector.sub(target, this.loc).limit(1);
    //console.log(this.bodypos);
    acc.mult(randomGaussian(1, 1));
    acc.rotate(randomGaussian(0, PI / 3));
    this.vel.add(acc);
    this.vel.limit(15);
    this.loc.add(this.vel);
    this.vertices.push(p5.Vector.add(this.loc, this.vel.copy().rotate(random(TWO_PI))));
    if (this.vertices.length > 3) {
      this.vertices.shift();
    }
  }
}

function drawFog(){
  push();
  fill(32, 16);
  noStroke();
  rect(0,0,width,height);
  pop();
}


// 树的初始化
// 绘制树作为站立点
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
// 与Tree.pde中的递归功能相同，只是使用随机数
function branch(len, theta, Ang){
push();
fill(255,255,255);  //可通过这个来改变果实的颜色
rotate(theta); // rotate to the angle provided
strokeWeight(sqrt(len*10)*0.3);
line(0,0, len, 0); // draw one branch
translate(len,0); // and move to its edge

if(len > 30.0){ // stop condition - very important!
  Ang++;;
  branch(len * 0.7, - newAng[Ang]*0.4, Ang); // left branch
  branch(len * 0.85, newAng[Ang], Ang);   // right branch  
}else{
  ellipse(0,0,10,10); // only draw a leaf
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

