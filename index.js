/*──────────────────────────────
  1. 전역 설정
──────────────────────────────*/
const ROWS = 14;
const COLS = 30;
const MAX_STAGE = 38;
const MARGIN = 6;

/* 네온 팔레트 */
const NEON_COLORS = ['#FFC7C2', '#4BBEBE', '#ABC8C7', '#B2A8B3', '#8EAF9D'];

/* 텍스트 피드 설정 */
const lineH = 32;      // 한 줄 높이
const FEED_SPEED = 2;       // px/frame 위로 이동
const FEED_INTERVAL = 2000;    // 2 s마다 새 메시지
const MESSAGES = [
  '당신은 지금 진화의 현장을 보고 계십니다',
  '',
  '현생 인류는 1–2% 네안데르탈인 DNA를 보유합니다.', '',
];
let feed = [];    // {str, y, targetY}
let msgIdx = 0;

/* 게임 데이터 */
let grid, evoImages = [], bgColors = [], tileSize;

/*──────────────────────────────
  2. 유틸 함수
──────────────────────────────*/
function randomizeBgColors() {
  bgColors = Array.from({ length: ROWS }, () =>
    Array.from({ length: COLS },
      () => color(random(NEON_COLORS) + '64')));
}
function addRandomTile(stage = 0) {
  const blanks = [];
  for (let r = 0; r < ROWS; r++)
    for (let c = 0; c < COLS; c++)
      if (grid[r][c] < 0) blanks.push({ r, c });
  if (blanks.length === 0) return;
  const { r, c } = random(blanks);
  grid[r][c] = stage;
}

/*──────────────────────────────
  3. 텍스트 피드
──────────────────────────────*/
function startTextFeed() {
  setInterval(() => {
    feed.forEach(m => m.targetY -= lineH);
    const newStr = MESSAGES[msgIdx];
    msgIdx = (msgIdx + 1) % MESSAGES.length;
    feed.push({ str: newStr, y: height + lineH, targetY: height - lineH });
  }, FEED_INTERVAL);
}
/* 텍스트 피드 매-프레임 업데이트 */
function updateFeed() {
  /* 1️⃣ 위치 갱신 */
  feed.forEach(m => {
    if (m.y > m.targetY) m.y -= FEED_SPEED;   // 위로 이동
  });

  /* 2️⃣ 화면 밖(윗쪽)으로 사라진 줄은 제거 */
  feed = feed.filter(m => m.y + lineH / 2 > 0); // 중앙 y가 완전히 위로 나가면 삭제

  /* 3️⃣ 남은 줄만 그리기 */
  feed.forEach(m => text(m.str, width / 2, m.y));
}

/*──────────────────────────────
  4. p5: preload / setup / draw
──────────────────────────────*/
function preload() {
  evoImages = Array(MAX_STAGE).fill(null);
  for (let i = 1; i <= MAX_STAGE; i++) {
    const idx = nf(i, 2);
    loadImage(`assets/${idx}.png`,
      img => evoImages[i - 1] = img,
      () => evoImages[i - 1] = null);
  }
}
function setup() {
  createCanvas(windowWidth, windowHeight);
  initGame();

  /* ⏱ 0.1초마다 임의 방향키 입력 */
  setInterval(() => {
    keyCode = random([LEFT_ARROW, RIGHT_ARROW, UP_ARROW, DOWN_ARROW]);
    keyPressed();
  }, 100);

  startTextFeed();
  textAlign(CENTER, CENTER); textSize(20); fill('#fff');
}
function initGame() {
  grid = Array.from({ length: ROWS }, () => Array(COLS).fill(-1));
  randomizeBgColors();
  for (let i = 0; i < 8; i++) addRandomTile(0);   // 1단계 8개
  for (let i = 0; i < 4; i++) addRandomTile(1);   // 2단계 4개
}
function draw() {
  background(0);

  /* ─ 보드 그리기 ─ */
  const availW = width - MARGIN * (COLS + 1);
  const availH = height - MARGIN * (ROWS + 1);
  tileSize = min(availW / COLS, availH / ROWS);

  // 빈칸 배경
  noStroke();
  for (let r = 0; r < ROWS; r++)
    for (let c = 0; c < COLS; c++) {
      const x = MARGIN + c * (tileSize + MARGIN);
      const y = MARGIN + r * (tileSize + MARGIN);
      fill(bgColors[r][c]);
      rect(x, y, tileSize, tileSize, 6);
    }

  // 타일
  for (let r = 0; r < ROWS; r++)
    for (let c = 0; c < COLS; c++) {
      const v = grid[r][c];
      if (v < 0) continue;
      const x = MARGIN + c * (tileSize + MARGIN);
      const y = MARGIN + r * (tileSize + MARGIN);
      const img = evoImages[v];
      if (img && img.width) {
        const s = (tileSize * 0.9) / max(img.width, img.height);
        image(img, x + (tileSize - img.width * s) / 2,
          y + (tileSize - img.height * s) / 2,
          img.width * s, img.height * s);
      } else {
        const col = NEON_COLORS[v % NEON_COLORS.length];
        push();
        stroke(col); strokeWeight(4); fill(color(col + '33'));
        rect(x, y, tileSize, tileSize, 6);
        noStroke(); fill(col);
        rect(x + 4, y + 4, tileSize - 8, tileSize - 8, 4);
        pop();
      }
    }

  /* ─ 텍스트 피드 ─ */
  updateFeed();
}
function windowResized() { resizeCanvas(windowWidth, windowHeight); }

/*──────────────────────────────
  5. 2048 이동·병합
──────────────────────────────*/
function slideLine(a) {
  a = a.filter(v => v >= 0);
  for (let i = 0; i < a.length - 1; i++)
    if (a[i] === a[i + 1] && a[i] < MAX_STAGE - 1) { a[i]++; a[i + 1] = -1; i++; }
  return a.filter(v => v >= 0);
}
function move(dir) {
  let moved = false;
  if (dir === 'L' || dir === 'R') {
    for (let r = 0; r < ROWS; r++) {
      let line = grid[r].slice();
      if (dir === 'R') line.reverse();
      line = slideLine(line);
      while (line.length < COLS) line.push(-1);
      if (dir === 'R') line.reverse();
      if (line.some((v, i) => v !== grid[r][i])) moved = true;
      grid[r] = line;
    }
  } else {
    for (let c = 0; c < COLS; c++) {
      let col = []; for (let r = 0; r < ROWS; r++) col.push(grid[r][c]);
      if (dir === 'D') col.reverse();
      col = slideLine(col);
      while (col.length < ROWS) col.push(-1);
      if (dir === 'D') col.reverse();
      for (let r = 0; r < ROWS; r++) {
        if (grid[r][c] !== col[r]) moved = true;
        grid[r][c] = col[r];
      }
    }
  }
  return moved;
}
function keyPressed() {
  let moved = false;
  if (keyCode === LEFT_ARROW) moved = move('L');
  if (keyCode === RIGHT_ARROW) moved = move('R');
  if (keyCode === UP_ARROW) moved = move('U');
  if (keyCode === DOWN_ARROW) moved = move('D');

  if (moved) {
    randomizeBgColors();
    addRandomTile();
    if (isGameOver()) setTimeout(showAllSpecies, 15000);
  }
}
function isGameOver() {
  for (let r = 0; r < ROWS; r++)
    for (let c = 0; c < COLS; c++) {
      const v = grid[r][c];
      if (v < 0) return false;
      if (c + 1 < COLS && grid[r][c + 1] === v) return false;
      if (r + 1 < ROWS && grid[r + 1][c] === v) return false;
    }
  return true;
}

/*──────────────────────────────
  6. 모든 생명체 나열
──────────────────────────────*/
function showAllSpecies() {
  const set = new Set();
  for (let r = 0; r < ROWS; r++) for (let c = 0; c < COLS; c++)
    if (grid[r][c] >= 0) set.add(grid[r][c]);

  noLoop();
  push(); fill(0, 220); rect(0, 0, width, height); pop();

  const stages = [...set].sort((a, b) => a - b);
  const tSize = min(width / (stages.length + 1), height / 3);
  imageMode(CENTER); rectMode(CENTER);

  for (let i = 0; i < stages.length; i++) {
    const v = stages[i];
    const x = (i + 1) * (width / (stages.length + 1)), y = height / 2;
    const img = evoImages[v];
    if (img && img.width) {
      const s = (tSize * 0.8) / max(img.width, img.height);
      image(img, x, y, img.width * s, img.height * s);
    } else {
      const col = NEON_COLORS[v % NEON_COLORS.length];
      push();
      stroke(col); strokeWeight(4); fill(color(col + '33'));
      rect(x, y, tSize, tSize, 6);
      noStroke(); fill(col);
      rect(x, y, tSize - 8, tSize - 8, 4);
      pop();
    }
  }
}
