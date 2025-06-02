/*──────────────── 0. 설정값 ────────────────*/
const CFG = {
  trunkLen  : 260,   // 루트→1세대 줄기
  levelGap  : 140,   // 세대 간 반경
  imgSize   : 80,    // 인물 원형 지름
  growTime  : 1500,  // 트리 성장(ms)
  revealGap : 300,   // 노드 등장 간격(ms)
  baseAngle : 35,    // 기본 가지 각(도)
  branchW   : 3      // 줄기 굵기
};

/* 세대(gen), 세대 내 순번(idx), 파일명 */
const members = [
  {gen:0, idx:0, file:'img1.jpg'},
  {gen:1, idx:0, file:'img2.jpg'}, {gen:1, idx:1, file:'img3.jpg'},
  {gen:2, idx:0, file:'img4.jpg'}, {gen:2, idx:1, file:'img5.jpg'},
  {gen:2, idx:2, file:'img6.jpg'}, {gen:2, idx:3, file:'img7.jpg'}
];

/*────────────── 1. 전역 변수 ─────────────*/
let bgImg, tex = {};
let startMillis, growStart, started = false;
let leaves = [], sway = 0;

/*────────────── 2. preload ─────────────*/
function preload(){
  bgImg = loadImage('assets/COUPLE LINES.jpg');
  members.forEach(m => tex[m.file] = loadImage('assets/' + m.file));
}

/*────────────── 3. setup & resize ───────*/
function setup(){
  createCanvas(windowWidth, windowHeight);
  angleMode(DEGREES); colorMode(HSB); imageMode(CENTER);
  strokeWeight(CFG.branchW); noFill();

  startMillis = millis();
  setTimeout(() => { started = true; growStart = millis(); }, 1000);
}
function windowResized(){ resizeCanvas(windowWidth, windowHeight); }

/*────────────── 4. draw 루프 ────────────*/
function draw(){
  background(45, 45, 80);          // 요청하신 배경색

  /* 4-1. 배경 사진 애니메이션 */
  const e = started ? millis() - growStart : 0;
  const p = constrain(e / 3000, 0, 1);
  const r = bgImg.height / bgImg.width;
  let sw = width, sh = sw * r;
  if (sh > height){ sh = height; sw = sh / r; }
  const ew = sw * 0.4, eh = ew * r;
  const photoW = lerp(sw, ew, p),
        photoH = lerp(sh, eh, p),
        photoX = width / 2,
        photoY = lerp(height / 2, height - eh / 2 - 20, p);

  /* 4-2. 잎사귀 업데이트 & 평균 각도(sway) */
  sway = 0;
  leaves.forEach(l => { l.update(); sway += l.angle; });
  if (leaves.length) sway /= leaves.length;

  /* 4-3. 트리 그리기 */
  if (started){
    const root = createVector(photoX, photoY - photoH / 2);
    const g    = constrain(e / CFG.growTime, 0, 1);
    push();
    translate(root.x, root.y);
    rotate(sway);                 // 잎 흔들림을 트리에 반영
    drawBranches(g);
    pop();
  }

  /* 4-4. 인물 노드 & 잎 */
  members.forEach((m, i) => {
    if (e < CFG.growTime + i * CFG.revealGap) return;

    const pos = nodePos(m, photoX, photoY - photoH / 2);
    push();
    translate(pos.x, pos.y); rotate(sway);
    drawPortrait(tex[m.file]);
    pop();

    if (!leaves.some(l => l.anchor === m)){
      leaves.push(new Leaf(pos.x, pos.y - CFG.imgSize / 2 - 12, m));
    }
  });
  leaves.forEach(l => l.display());

  /* 4-5. 배경 사진은 맨 위에 */
  image(bgImg, photoX, photoY, photoW, photoH);
}

/*────────────── 5. 트리(곡선 가지) ────────*/
function drawBranches(g){
  stroke(30, 60, 30);

  /* 중심 줄기 */
  const mainH = CFG.trunkLen * g;
  line(0, 0, 0, -mainH);

  /* 세대별 곡선 가지 */
  for (let gen = 1; gen <= maxGen(); gen++){
    const cur = members.filter(n => n.gen === gen);
    cur.forEach(node => {
      const child = nodePos(node, 0, -mainH);     // 로컬 좌표
      const parent = nodePos({gen: gen-1, idx: floor(node.idx/2)}, 0, -mainH);

      strokeWeight(gen === 1 ? CFG.branchW : CFG.branchW * 0.7);
      beginShape();
      vertex(parent.x, parent.y);
      const midY = lerp(parent.y, child.y, 0.4);
      bezierVertex(parent.x, midY, child.x, midY, child.x, child.y);
      endShape();
    });
  }
}

/*────────────── 6. 노드 좌표 계산 ─────────*/
function nodePos(m, rootX, rootY){
  /* rootX/rootY는 트리 루트 좌표(월드), 없으면 (0,0) */
  rootX = rootX || 0; rootY = rootY || 0;

  const siblings = members.filter(x => x.gen === m.gen).length;
  const radius   = CFG.levelGap * (m.gen + 1);
  const theta    = map(m.idx, 0, siblings - 1, -70, 70); // 부채꼴
  return createVector(
    rootX + radius * sin(theta),
    rootY - radius * cos(theta)
  );
}
function maxGen(){ return max(...members.map(m => m.gen)); }

/*────────────── 7. 잎사귀 클래스 ─────────*/
class Leaf{
  constructor(x, y, anchor){ this.x = x; this.y = y;
    this.seed = random(1000); this.angle = 0; this.anchor = anchor; }
  update(){ this.angle = (noise(this.seed + frameCount * 0.02) - 0.5) * 3; }
  display(){
    push(); translate(this.x, this.y); rotate(this.angle);
    fill(110, 50, 60); noStroke(); ellipse(0, 0, 12, 6);
    pop();
  }
}

/*────────────── 8. 인물 원형 + 골드프레임 ──*/
function drawPortrait(img){
  const r = CFG.imgSize / 2;
  drawingContext.save();
  drawingContext.beginPath();
  drawingContext.arc(0, 0, r, 0, TWO_PI);
  drawingContext.clip();
  image(img, 0, 0, CFG.imgSize, CFG.imgSize);
  drawingContext.restore();

  stroke(40, 40, 90); strokeWeight(4);
  ellipse(0, 0, CFG.imgSize);
}
