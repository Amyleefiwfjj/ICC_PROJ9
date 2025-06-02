/*──────────────── 0. 설정값 ────────────────*/
const CFG = {
  trunkLen  : 260,   // 루트→1세대 줄기 높이
  levelGap  : 140,   // 세대 간 Y 반경
  imgSize   : 80,    // 인물 원형 지름
  growTime  : 3000,  // 트리 성장(ms) (느리게)
  revealGap : 300,   // 노드 등장 간격(ms)
  branchW   : 3,     // 줄기 굵기

  extraGrow : 8000,  // 추가 확대(ms)
  maxScale  : 2.4,   // 얼마나 크게 확대할지
  fadeTime  : 2000,  // 페이드아웃(ms)

  videoPlay : 5000,  // 지구 영상 재생(ms)
  shrinkTime: 2000   // 영상 축소(ms)
};

/* 세대(gen), 순번(idx), 이미지 파일명 */
const members = [
  {gen:0, idx:0, file:'img1.jpg'},
  {gen:1, idx:0, file:'img2.jpg'}, {gen:1, idx:1, file:'img3.jpg'},
  {gen:2, idx:0, file:'img4.jpg'}, {gen:2, idx:1, file:'img5.jpg'},
  {gen:2, idx:2, file:'img6.jpg'}, {gen:2, idx:3, file:'img7.jpg'}
];

/*──────────────── 1. 전역변수 ───────────────*/
let bgImg, tex = {}, earthVid;
let leaves = [], sway = 0, treeScale = 1;
let startMillis, growStart;
let fadeAlpha = 255, fadeStart = 0;
let earthStart = 0, shrinkStart = 0;

/* 상태 머신 */
const STATE = { TREE:0, FADE:1, EARTH:2, SHRINK:3 };
let state = STATE.TREE;

/*──────────────── 2. preload ───────────────*/
function preload() {
  bgImg = loadImage('assets/COUPLE LINES.jpg');
  members.forEach(m => tex[m.file] = loadImage('assets/' + m.file));
  earthVid = createVideo('assets/earth.mp4', () => earthVid.loop());
  earthVid.hide();
}

/*──────────────── 3. setup ───────────────*/
function setup() {
  createCanvas(windowWidth, windowHeight);
  angleMode(DEGREES); colorMode(HSB); imageMode(CENTER);
  strokeWeight(CFG.branchW); noFill();

  startMillis = millis();
  setTimeout(() => { growStart = millis(); }, 1000);
}
function windowResized(){ resizeCanvas(windowWidth, windowHeight); }

/*──────────────── 4. draw 루프 ───────────────*/
function draw() {
  const now = millis();

  // ─── EARTH or SHRINK 상태 처리 ───
  if (state === STATE.EARTH || state === STATE.SHRINK) {
    background(0);

    // 영상 축소 비율 계산
    let k = 1;
    if (state === STATE.SHRINK) {
      const t = constrain((now - shrinkStart) / CFG.shrinkTime, 0, 1);
      k = 1 - t; 
      if (t >= 1) { noLoop(); return; }
    }
    image(earthVid, width/2, height/2, width*k, height*k);

    // 5초 재생 후 축소 상태로 전환
    if (state === STATE.EARTH && now - earthStart > CFG.videoPlay) {
      state = STATE.SHRINK;
      shrinkStart = now;
    }
    return;
  }

  // ─── TREE & FADE 상태 처리 ───
  background(237, 222, 201, fadeAlpha);

  // 1) 배경 사진 애니메이션
  const e    = growStart ? now - growStart : 0;
  const pImg = constrain(e / 3000, 0, 1);
  const ratio = bgImg.height / bgImg.width;
  let sw = width, sh = sw * ratio;
  if (sh > height) { sh = height; sw = sh / ratio; }
  const ew = sw * 0.4, eh = ew * ratio;
  const photoW = lerp(sw, ew, pImg);
  const photoH = lerp(sh, eh, pImg);
  const photoX = width/2;
  const photoY = lerp(height/2, height - eh/2 - 20, pImg);

  // 2) 잎 업데이트 & sway 계산
  sway = 0;
  leaves.forEach(l => { 
    l.update(); 
    sway += l.angle; 
  });
  if (leaves.length) sway /= leaves.length;

  // 3) TREE 상태: 트리와 노드 그리기 (흔들림 없이)
  if (state === STATE.TREE) {
    const root = createVector(photoX, photoY - photoH/2);
    const growP = constrain(e / CFG.growTime, 0, 1);

    // 3-1) 트리 확대 (1 → maxScale)
    const extra = constrain((e - CFG.growTime) / CFG.extraGrow, 0, 1);
    treeScale = 1 + extra * (CFG.maxScale - 1);

    push();
    translate(root.x, root.y);
    scale(treeScale);
    // 가지를 그릴 때 sway 제거 → 안정된 가계도 느낌
    drawBranches(growP);
    pop();

    // 3-2) 인물 노드 & 잎 (흔들림 없이 노드 배치, 잎만 흔들림)
    members.forEach((m,i) => {
      if (e < CFG.growTime + i * CFG.revealGap) return;
      const pos = nodePos(m, root, treeScale);
      push();
      translate(pos.x, pos.y);
      drawPortrait(tex[m.file]);  // 노드도 흔들림 없이 고정
      pop();

      // 잎 생성: 노드 밑에 한 개씩 달아 둔다
      if (!leaves.some(l => l.anchor === m)) {
        leaves.push(new Leaf(
          pos.x, 
          pos.y - CFG.imgSize/2 - 12, 
          m
        ));
      }
    });
    leaves.forEach(l => l.display());

    // 3-3) 확대 완료 후 FADE 상태로 전환
    if (extra >= 1) {
      state = STATE.FADE;
      fadeStart = now;
    }
  }

  // 4) FADE 상태: 트리 + 사진 천천히 사라짐
  if (state === STATE.FADE) {
    const t = (now - fadeStart) / CFG.fadeTime;
    fadeAlpha = map(t, 0, 1, 255, 0);
    if (t >= 1) {
      state = STATE.EARTH;
      earthVid.play();
      earthStart = now;
      return;
    }
  }

  // 5) 배경 사진을 제일 위에, 투명도 적용
  tint(255, fadeAlpha);
  image(bgImg, photoX, photoY, photoW, photoH);
  noTint();
}

/*──────────────── 5. 트리 & 가지 ───────────────*/
function drawBranches(g) {
  // g = 0 → 1: 트리 성장 비율
  const H = CFG.trunkLen * g;

  // (1) 중심 줄기: 한 번만 그린다
  stroke(40, 50, 30);
  strokeWeight(CFG.branchW);
  line(0, 0, 0, -H);

  // (2) 잔가지 재귀호출
  growBranch(0, -H, H * 0.8, 0);
}

// ── 내부 재귀 함수: 더 풍성하고 얇은 잔가지들이 여러 갈래로 퍼짐 ──
function growBranch(x, y, len, depth) {
  // 종료 조건: 깊이 5단계 혹은 길이가 너무 짧으면 중단
  if (len < 8 || depth > 5) return;

  // 깊이에 따른 굵기 감소 (3 → 0.4)
  const w = map(depth, 0, 5, CFG.branchW * 0.9, 0.4);
  strokeWeight(w);

  // 한 마디에서 3~4개의 가지가 벌어짐
  const branchCnt = random([3,3,4]);        // 대개 3개, 가끔 4개
  const baseAng = 18 + depth * 4;           // 세대가 깊어질수록 넓게 퍼짐

  for (let i = 0; i < branchCnt; i++) {
    const dir = map(i, 0, branchCnt-1, -1, 1); 
    const jitter = random(-6, 6);                    // 각도에 살짝 랜덤
    const ang = dir * (baseAng + jitter);
    const nextLen = len * random(0.65, 0.78);         // 다음 가지 길이를 0.65~0.78배

    push();
    translate(x, y);
    rotate(ang);
    stroke(40, 50, 30);
    line(0, 0, 0, -nextLen);
    growBranch(0, -nextLen, nextLen, depth + 1);
    pop();
  }
}

/*──────────────── 6. 노드 좌표 계산 ─────────────*/
function nodePos(m, root, s) {
  const siblings = members.filter(x => x.gen === m.gen).length;
  const radius   = CFG.levelGap * (m.gen + 1) * s;
  const theta    = map(m.idx, 0, siblings - 1, -70, 70);
  return createVector(
    root.x + radius * sin(theta),
    root.y - radius * cos(theta)
  );
}
function maxGen(){ return max(...members.map(m => m.gen)); }

/*──────────────── 7. 잎사귀 클래스 ─────────────*/
class Leaf {
  constructor(x, y, anchor) {
    this.x = x;
    this.y = y;
    this.anchor = anchor;
    this.seed = random(1000);
    this.angle = 0;
  }
  update() {
    // 진폭을 줄여서 아주 미세하게만 흔들리게 함
    this.angle = (noise(this.seed + frameCount * 0.01) - 0.5) * 1.2;
  }
  display() {
    push();
    translate(this.x, this.y);
    rotate(this.angle);
    fill(110, 60, 70); // 밝은 초록계 HSB
    noStroke();
    ellipse(0, 0, 14, 7);
    pop();
  }
}

/*──────────────── 8. 인물 노드 그리기 ─────────*/
function drawPortrait(img) {
  const r = CFG.imgSize / 2;
  drawingContext.save();
  drawingContext.beginPath();
  drawingContext.arc(0, 0, r, 0, TWO_PI);
  drawingContext.clip();
  image(img, 0, 0, CFG.imgSize, CFG.imgSize);
  drawingContext.restore();

  stroke(40, 40, 90);
  strokeWeight(4);
  ellipse(0, 0, CFG.imgSize);
}
