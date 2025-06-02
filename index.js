let evoImgs = [];
const totalImgs = 38;

function preload() {
  // assets 폴더에 evolution1.png ~ evolution38.png가 있다고 가정
  for (let i = 1; i <= totalImgs; i++) {
    let path = `assets/${i}.png`;
    evoImgs.push(loadImage(path));
  }
}

function setup() {
  createCanvas(windowWidth, windowHeight);
  imageMode(CENTER);
}

function draw() {
  let count = floor(map(mouseY, 0, height, 0, totalImgs));
  count = constrain(count, 0, totalImgs);

  for (let i = 0; i < count; i++) {
    let img = evoImgs[i];
    let angle = map(i, 0, totalImgs - 1, 0, TWO_PI * 3);
    let xPos = width / 2 + cos(angle) * (width * 0.3);
    let yPos = map(i, 0, totalImgs - 1, height * 0.05, height * 0.95);
    let imgH = height * 0.05;
    let imgW = (img.width / img.height) * imgH;

    // 마우스 호버 감지
    if (dist(mouseX, mouseY, xPos, yPos) < imgW / 2) {
      // 확대
      push();
      translate(xPos, yPos);
      scale(1.5);
      image(img, 0, 0, imgW, imgH);
      pop();
      // 툴팁
      fill(255);
      textSize(14);
      textAlign(CENTER, BOTTOM);
      text("Species " + (i + 1), xPos, yPos - imgH * 0.8);
    } else {
      image(img, xPos, yPos, imgW, imgH);
    }
  }

  // 프로그레스 바
  noStroke();
  fill(255, 100);
  let barH = 5;
  let barW = map(count, 0, totalImgs, 0, width);
  rect(0, height - barH, barW, barH);
}

function windowResized() {
  resizeCanvas(windowWidth, windowHeight);
}
