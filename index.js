/*──────────────────────────────
  1. 환경 설정
──────────────────────────────*/
const ROWS = 14;
const COLS = 30;
const MAX_STAGE = 38;
const MARGIN = 6;

const NEON_COLORS = [
  '#FFC7C2', // 0
  '#4BBEBE', // 1
  '#ABC8C7', // 2
  '#B2A8B3', // 3
  '#8EAF9D'  // 4
];

let grid;                 // 보드
let evoImages = [];       // 단계별 이미지
let bgColors = [];        // 빈칸 배경 팔레트
let tileSize;             // 한 칸 크기

/*──────────────────────────────
  2. 빈 칸 팔레트 (알파 = 0x64 ≡ 100)
──────────────────────────────*/
function randomizeBgColors() {
  bgColors = Array.from({ length: ROWS }, () =>
    Array.from({ length: COLS }, () => color(random(NEON_COLORS) + '64'))
  );
}

/*──────────────────────────────
  3. 이미지 로드
──────────────────────────────*/
function preload() {
  evoImages = Array(MAX_STAGE).fill(null);
  for (let i = 1; i <= MAX_STAGE; i++) {
    const idx = nf(i, 2);                         // "01" ~ "38"
    loadImage(
      `assets/${idx}.png`,
      img => evoImages[i - 1] = img,
      () => evoImages[i - 1] = null
    );
  }
}

/*──────────────────────────────
  4. 초기화
──────────────────────────────*/
function setup() {
  createCanvas(windowWidth, windowHeight);
  initGame();
  /* setup() 안 제일 끝에 추가 ↓↓↓ */
  setInterval(() => {
    const dirs = [LEFT_ARROW, RIGHT_ARROW, UP_ARROW, DOWN_ARROW];
    keyCode = random(dirs);   // p5 전역 keyCode 값을 임의 방향으로 세팅
    keyPressed();             // 기존 키-핸들러 그대로 호출
  }, 100);                    // 100 ms = 0.1 초

}

function initGame() {
  grid = Array.from({ length: ROWS }, () => Array(COLS).fill(-1));
  randomizeBgColors();

  // 1단계(인덱스 0) 6개, 2단계(인덱스 1) 2개
  for (let i = 0; i < 8; i++) addRandomTile(0);
  for (let i = 0; i < 4; i++) addRandomTile(1);
}

/*──────────────────────────────
  5. 매 프레임 그리기
──────────────────────────────*/
function draw() {
  background(0);

  const availW = width - MARGIN * (COLS + 1);
  const availH = height - MARGIN * (ROWS + 1);
  tileSize = min(availW / COLS, availH / ROWS);

  /* 5-1. 빈 칸 배경 */
  noStroke();
  for (let r = 0; r < ROWS; r++)
    for (let c = 0; c < COLS; c++) {
      const x = MARGIN + c * (tileSize + MARGIN);
      const y = MARGIN + r * (tileSize + MARGIN);
      fill(bgColors[r][c]);
      rect(x, y, tileSize, tileSize, 6);
    }

  /* 5-2. 타일(이미지 또는 네온 블록) */
  for (let r = 0; r < ROWS; r++)
    for (let c = 0; c < COLS; c++) {
      const v = grid[r][c];
      if (v < 0) continue;

      const x = MARGIN + c * (tileSize + MARGIN);
      const y = MARGIN + r * (tileSize + MARGIN);
      const img = evoImages[v];

      if (img && img.width > 0) {
        const s = (tileSize * 0.9) / max(img.width, img.height);
        image(img,
          x + (tileSize - img.width * s) / 2,
          y + (tileSize - img.height * s) / 2,
          img.width * s, img.height * s);
      } else {
        const col = NEON_COLORS[v % NEON_COLORS.length];
        push();
        strokeWeight(4); stroke(col); fill(color(col + '33'));
        rect(x, y, tileSize, tileSize, 6);
        noStroke(); fill(col);
        rect(x + 4, y + 4, tileSize - 8, tileSize - 8, 4);
        pop();
      }
    }
}

function windowResized() { resizeCanvas(windowWidth, windowHeight); }
/*──────────────────────────────
   모든 생명체(단계) 나열
──────────────────────────────*/
function showAllSpecies() {
  // ① 그리드에 존재하는 단계 모으기
  const present = new Set();
  for (let r = 0; r < ROWS; r++)
    for (let c = 0; c < COLS; c++)
      if (grid[r][c] >= 0) present.add(grid[r][c]);

  // ② 화면 잠그고 검은 반투명 오버레이
  noLoop();
  push();
  fill(0, 220); rect(0, 0, width, height);
  pop();

  // ③ 중앙에 한 줄로 나열(작은 타일 크기)
  const stages = Array.from(present).sort((a, b) => a - b);
  const tSize = min(width / (stages.length + 1), height / 3);

  for (let i = 0; i < stages.length; i++) {
    const v = stages[i];
    const x = (i + 1) * (width / (stages.length + 1));
    const y = height / 2;

    if (evoImages[v] && evoImages[v].width > 0) {
      const s = (tSize * 0.8) / max(evoImages[v].width, evoImages[v].height);
      imageMode(CENTER);
      image(evoImages[v], x, y, evoImages[v].width * s, evoImages[v].height * s);
    } else {
      const col = NEON_COLORS[v % NEON_COLORS.length];
      push();
      rectMode(CENTER);
      stroke(col); strokeWeight(4); fill(color(col + '33'));
      rect(x, y, tSize, tSize, 6);
      noStroke(); fill(col);
      rect(x, y, tSize - 8, tSize - 8, 4);
      pop();
    }
  }
}

/*──────────────────────────────
  6. 2048 이동·병합 로직
──────────────────────────────*/
function slideLine(line) {
  line = line.filter(v => v >= 0);
  for (let i = 0; i < line.length - 1; i++) {
    if (line[i] === line[i + 1] && line[i] < MAX_STAGE - 1) {
      line[i]++; line[i + 1] = -1; i++;
    }
  }
  return line.filter(v => v >= 0);
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

      if (!moved && line.some((v, i) => v !== grid[r][i])) moved = true;
      grid[r] = line;
    }
  } else {                           // 'U' or 'D'
    for (let c = 0; c < COLS; c++) {
      let col = [];
      for (let r = 0; r < ROWS; r++) col.push(grid[r][c]);
      if (dir === 'D') col.reverse();

      col = slideLine(col);
      while (col.length < ROWS) col.push(-1);
      if (dir === 'D') col.reverse();

      for (let r = 0; r < ROWS; r++) {
        if (!moved && grid[r][c] !== col[r]) moved = true;
        grid[r][c] = col[r];
      }
    }
  }
  return moved;
}

/*──────────────────────────────
  7. 입력 처리
──────────────────────────────*/
function keyPressed() {
  let moved = false;
  if (keyCode === LEFT_ARROW) moved = move('L');
  if (keyCode === RIGHT_ARROW) moved = move('R');
  if (keyCode === UP_ARROW) moved = move('U');
  if (keyCode === DOWN_ARROW) moved = move('D');

  if (moved) {
    randomizeBgColors();   // 이동 시에만 팔레트 갱신
    addRandomTile();       // 1단계 타일 하나 추가

    if (isGameOver()) {
      // ❯❯ 게임 오버 대신 5초 후 모든 생명체 나열
      setTimeout(showAllSpecies, 5000);
    }
  }
}

/*──────────────────────────────
  8. 타일 추가 & 게임 오버
──────────────────────────────*/
function addRandomTile(stageIdx = 0) {
  const blanks = [];
  for (let r = 0; r < ROWS; r++)
    for (let c = 0; c < COLS; c++)
      if (grid[r][c] < 0) blanks.push({ r, c });
  if (!blanks.length) return;
  const { r, c } = random(blanks);
  grid[r][c] = stageIdx;
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
