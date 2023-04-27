var birds;
var fillColors;
let newAng = [];

// 身体追踪
let video;
let poseNet;
let pose;
let skeleton;
let bodyposX;
let bodyposY;

// 分配食物
let food = [];   

// 更新位置的结构体
class Bird {
  constructor(){
  this.loc = new createVector(random(width), random(height));  // 在这里更新位置
  var velSize = random(3);  
  var velAng = random(TWO_PI);
  this.vel = new createVector(velSize * cos(velAng), velSize * sin(velAng)); 
  this.vertices = []; //顶点
  this.fillColor = fillColors[int(random(fillColors.length))];

  //鸟类初始的速度
  this.velocity = new createVector(random(-2,2),random(-2,2));  // Velocity of shape 生物的速度 
  this.friction = new createVector(0, 0);   // 摩擦力-阻力
  this.desired = new createVector(0, 0);   // 吸引力
  this.diameter = new createVector(0, 0);   //半径
 // this.speedLimit = random(1,this.diameter/10); //限制速度
  this.full = 0;

  this.center = new createVector(0,0);
  }
  
  render() {
    noStroke();
    fill(this.fillColor);
    if (this.vertices.length < 3) {
      return; 
    }    

    let centerX = 0;
    let centerY = 0;
    beginShape();
    
    for (var i = 0; i < 3; i++) {
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
  console.log(this.diameter);
  }
  
  update() {  // 改变位置的区域
    var location = createVector(this.bodyposX, this.bodyposY);
    var acc = p5.Vector.sub(location, this.loc).limit(1); //拿现在的位置减去当前的位置
    //var acc = this.loc.limit(1); //拿现在的位置减去当前的位置
    acc.mult(randomGaussian(1, 1));
    acc.rotate(randomGaussian(0, PI / 3)); // 角度的变化
    this.vel.add(acc);
    this.vel.limit(10);
    this.loc.add(this.vel);
    this.vertices.push(p5.Vector.add(this.loc, this.vel.copy().rotate(random(TWO_PI))));

    if (this.vertices.length > 3) {   // 通过改变数值可以改变形状中边的多少
      this.vertices.shift(); // 循环数组，到3即删除
      
      // 小鸟到达边缘反弹
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
      
      // 吃到饭了
      if(this.full > 0){
        this.full--;
      }
    }

}

  moveToFood(x, y){ // x和y指的是食物的位置
     
    // 如果已经吃了就放回不执行
    if(this.full>0){
      return false;
    }

    this.desired.x = x;   
    this.desired.y = y;
    let direction = p5.Vector.sub(this.desired, this.center); //确认行径的方向
    console.log(this.desired);
    console.log(this.center);
    console.log(direction.mag());
    console.log(this.diameter);
    
    if (direction.mag() < this.diameter/2){     //如果距离小于？？
      this.full = 1000;
      return true;
    } 

    //only move if they are close to the target x & y locations
    if(direction.mag() < 200){
      direction.normalize(); //normalize gives us the unit vector of length 1 (i.e. just the direction )
      this.vel.add(direction);
    }
    return false;
  } 

}

function drawFog(){
  push();
  fill(32, 16);
  noStroke();
  rect(0,0,width,height);
  pop();
}

function setup() {
  createCanvas(windowWidth, windowHeight);
  background(0); 
  fillColors = [    // 分配3种颜色
    color(0, 0, 0),
    color(156, 156, 156), 
    color(83, 83, 83)
  ];
  frameRate(30);
  birds = [];            // 分配一个数组存储每个数组的东西
  for (var i = 0; i < 100; i++) {        // for循环个十次得出10个
    birds.push(new Bird());    
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
  bodyposX = 0;
  bodyposY = 0;
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
    bodyposX = pose.keypoints[0].position.x;
    bodyposY = pose.keypoints[0].position.y;
    
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
  else{
     bodyposX = random(width);
     bodyposY = random(height);
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
  for (var i = 0; i < birds.length; i++) {
    var bird = birds[i]; 
    bird.render();
    
    
    if(food.length > 0){
      // 如果有食物，就想着食物的方向移动
      bird.bodyposX = food[food.length-1].x;
      bird.bodyposY = food[food.length-1].y;
      bird.update();
      if(bird.moveToFood(food[food.length-1].x,food[food.length-1].y)){
        food.pop();
        } 
      } else {
        bird.bodyposX = bodyposX;
        bird.bodyposY = bodyposY;
        bird.update();
      }
  
  }

  updateFood();  // 增加食物

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

function windowResized() {  //改变窗口的大小
  resizeCanvas(windowWidth, windowHeight);
}

// 更新食物 upatefood
function updateFood(){  // 更新食物的位置
  for(let i = food.length-1; i >= 0 ; i--){   //从后往前走
    fill(100);
    circle(food[i].x,food[i].y,food[i].d);
    food[i].y += 1;   // 食物降落的效果，可以让它跟着手运动
    if(food[i].y > height){
      food.splice(i,1);//remove one from array at index i   更改并增加数组
    }
  }
}

function mousePressed() {   //按压分配新的位置
   // if(food.length == 0 ){   //增加食物，和大小
      food.push({
          x:random(width),
          y:random(height),
          d:random(5,20)
        });
   // }
}

