/*──────────────────────────────
  1. 전역 설정
──────────────────────────────*/
const ROWS = 14, COLS = 30, MAX_STAGE = 20, MARGIN = 6;

/* 네온 팔레트 */
const NEON_COLORS = ['#FFC7C2', '#4BBEBE', '#ABC8C7', '#B2A8B3', '#8EAF9D'];

/* 텍스트 피드 */
const LINE_H = 32;           // 한 줄 높이
const FEED_SPEED = 2;        // px/frame
const FEED_INTERVAL = 2000;  // ms
const MESSAGES = [
  '당신은 지금 진화의 현장을 보고 계십니다.', '',
  'You are witnessing evolution in action.', '',
  '눈으로 볼 수 있듯, 우리는 같은 조상으로부터 나왔습니다.', '',
  'As you can see, we came from a common ancestor.', '',
  '같은 조상으로부터 나왔으니, 우리는 한 가족이 아닐까요?', '',
  'Since we came from a common ancestor, doesn\'t that make us one family?', '',
  '그렇습니다. 우리 지구인은 하나의 큰 가족입니다.', '',
  'That\'s right — we, the people of Earth, are one big family.', '',
];
let feed = [];          // {str,y,targetY}
let msgIdx = 0;
let feedDone = false;   // 모든 메시지를 다 뿌렸는지 여부
let showPrompt = false;
/* 게임 데이터 */
let grid, evoImages = [], bgColors = [], tileSize;

/*──────────────────────────────
  2. 유틸
──────────────────────────────*/
function randomizeBgColors() {
  bgColors = Array.from({ length: ROWS }, () => Array.from({ length: COLS },
    () => color(random(NEON_COLORS) + '64')));
}
function addRandomTile(stage = 0) {
  const slots = [];
  for (let r = 0; r < ROWS; r++)
    for (let c = 0; c < COLS; c++)
      if (grid[r][c] < 0) slots.push({ r, c });
  if (!slots.length) return;
  const { r, c } = random(slots);
  grid[r][c] = stage;
}

/*──────────────────────────────
  3. 텍스트 피드
──────────────────────────────*/
function startTextFeed() {
  const timer = setInterval(() => {
    /* 1) 위로 한 칸 */
    feed.forEach(m => m.targetY -= lineH);

    /* 2) 다음 문장 */
    if (msgIdx < MESSAGES.length) {
      const newStr = MESSAGES[msgIdx++];
      feed.push({ str: newStr, y: height + lineH, targetY: height - lineH });
    } else {
      // 모든 문장을 push 했으므로 타이머 멈춤
      clearInterval(timer);
      feedDone = true;           // 플래그 ON
    }
  }, FEED_INTERVAL);
}

function updateFeed() {
  /* 위치 갱신 & 그리기 */
  feed.forEach(m => {
    if (m.y > m.targetY) m.y -= FEED_SPEED;
    text(m.str, width / 2, m.y);
  });
  feed = feed.filter(m => m.y + lineH / 2 > 0);

  /* 모든 문장이 사라지고 나면 안내문 띄우기 */
  if (feedDone && feed.length === 0 && !showPrompt) {
    showPrompt = true;
  }

  if (showPrompt) {
    push();
    textSize(24);
    fill('#FFEE58');
    text('Click to move to next page', width / 2, height / 2);
    pop();
  }
}
function mousePressed() {
  if (showPrompt) goToNextPage();
}

function goToNextPage() {
  // TODO: 원하는 동작으로 교체
  // 예) window.location.href = 'next.html';
  console.log('Moving to next page…');
}


/*──────────────────────────────
  4. preload / setup
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

  /* 자동 방향키 입력: 0.2 s */
  setInterval(() => {
    keyCode = random([LEFT_ARROW, RIGHT_ARROW, UP_ARROW, DOWN_ARROW]);
    keyPressed();
  }, 200);

  startTextFeed();
  textAlign(CENTER, CENTER); textSize(20); fill('#fff');
}
function initGame() {
  grid = Array.from({ length: ROWS }, () => Array(COLS).fill(-1));
  randomizeBgColors();
  for (let i = 0; i < 8; i++) addRandomTile(0);
  for (let i = 0; i < 4; i++) addRandomTile(1);
}

/*──────────────────────────────
  5. draw 루프
──────────────────────────────*/
function draw() {
  background(0);

  const availW = width - MARGIN * (COLS + 1);
  const availH = height - MARGIN * (ROWS + 1);
  tileSize = min(availW / COLS, availH / ROWS);

  // 빈 칸
  noStroke();
  for (let r = 0; r < ROWS; r++)
    for (let c = 0; c < COLS; c++) {
      const x = MARGIN + c * (tileSize + MARGIN);
      const y = MARGIN + r * (tileSize + MARGIN);
      fill(bgColors[r][c]); rect(x, y, tileSize, tileSize, 6);
    }

  // 타일
  for (let r = 0; r < ROWS; r++)
    for (let c = 0; c < COLS; c++) {
      const v = grid[r][c]; if (v < 0) continue;
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

  updateFeed();          // 텍스트 레이어
}
function windowResized() { resizeCanvas(windowWidth, windowHeight); }

/*──────────────────────────────
  6. 2048 로직
──────────────────────────────*/
function slideLine(a) {
  a = a.filter(v => v >= 0);
  for (let i = 0; i < a.length - 1; i++) {
    if (a[i] === a[i + 1] && a[i] < MAX_STAGE - 1) { a[i]++; a[i + 1] = -1; i++; }
  }
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
  7. 생명체 나열
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
