// --- 1. 데이터 정의 (자동 생성할 데이터) ------------------------------
const familyData = {
  name: "할아버지",
  birth: "1940-01-01",
  children: []
};

// --- 2. 전역 변수 ---------------------------------------------------
let treeData;
let nodeOrder = 0;
let maxDepth = 0; // 최대 깊이를 추적하기 위한 변수
let maxNodeOrder = 0; // 가장 많은 자식 수를 추적하기 위한 변수

// --- 3. 자손 자동 생성 함수 -------------------------------------------
function generateFamilyTree(node, depth, maxDepth) {
  // 최대 깊이에 도달하면 더 이상 자식 노드를 추가하지 않음
  if (depth > maxDepth) return;

  // 자식 노드 생성 (자식 수는 랜덤하게 설정)
  const numChildren = Math.floor(Math.random() * 3); // 0~2명 자식 생성
  node.children = [];

  for (let i = 0; i < numChildren; i++) {
    const child = {
      name: `${node.name}_자식${i + 1}`,
      birth: `19${(Math.random() * 30 + 50).toFixed(0)}-0${Math.floor(Math.random() * 12) + 1}-0${Math.floor(Math.random() * 30) + 1}`,
      children: []
    };
    node.children.push(child);

    // 자식 노드에 대해 재귀적으로 자손 생성
    generateFamilyTree(child, depth + 1, maxDepth);
  }
}

// --- 4. 노드 위치(레이아웃) 계산 함수 --------------------------------
function assignPositions(node, depth) {
  // 자식을 먼저 배치
  for (let child of node.children) {
    assignPositions(child, depth + 1);
  }

  // 최대 깊이 추적
  maxDepth = Math.max(maxDepth, depth);

  // 현재 노드 차례
  node.x = depth * 200 + 100;        // X 좌표 (깊이마다 간격 200px)
  node.y = nodeOrder * 100 + 50;     // Y 좌표 (순서마다 간격 100px)
  
  // 자식의 개수를 반영하여 가장 큰 노드의 Y 값을 결정
  nodeOrder++;
  maxNodeOrder = Math.max(maxNodeOrder, nodeOrder);
}

// --- 5. p5.js Setup & Draw -----------------------------------------
function setup() {
  createCanvas(800, 600);
  treeData = familyData;
  
  // 자손 자동 생성 (세대수 5)
  generateFamilyTree(treeData, 0, 5);
  
  // 레이아웃 계산
  nodeOrder = 0;
  maxDepth = 0;
  maxNodeOrder = 0;
  assignPositions(treeData, 0);

  // 캔버스 크기 조정 (최대 깊이와 노드 수를 바탕으로)
  resizeCanvas((maxDepth + 1) * 200 + 100, maxNodeOrder * 100 + 50);
}

function draw() {
  background(255);
  stroke(0);
  fill(255);

  // 간선(부모→자식) 그리기
  drawEdges(treeData);

  // 노드(원 + 이름) 그리기
  drawNodes(treeData);

  // 마우스 오버된 노드 정보를 표시
  let hovered = findHoveredNode(treeData);
  if (hovered) {
    fill(240);
    stroke(0);
    rect(width - 200, 20, 180, 60);
    noStroke();
    fill(0);
    textAlign(LEFT, TOP);
    textSize(14);
    text(`이름: ${hovered.name}`, width - 190, 30);
    text(`생일: ${hovered.birth}`, width - 190, 50);
  }
}

// --- 6. 간선 그리기 (재귀) ------------------------------------------
function drawEdges(node) {
  for (let child of node.children) {
    line(node.x, node.y, child.x, child.y);
    drawEdges(child);
  }
}

// --- 7. 노드 그리기 (재귀) ------------------------------------------
function drawNodes(node) {
  // 선택된 노드는 두꺼운 빨간 테두리, 아니면 기본 테두리
  if (node.selected) {
    strokeWeight(3);
    stroke(255, 0, 0);
  } else {
    strokeWeight(1);
    stroke(50);
  }
  fill(200);
  ellipse(node.x, node.y, 60, 60);

  // 이름 출력
  noStroke();
  fill(0);
  textAlign(CENTER, CENTER);
  textSize(12);
  text(node.name, node.x, node.y);

  // 자식 순회
  for (let child of node.children) {
    drawNodes(child);
  }
}

// --- 8. 마우스 클릭 시 노드 선택 ------------------------------------
function mousePressed() {
  selectNode(treeData);
}

// 재귀적으로 모든 노드를 판정하여 클릭된 노드 토글
function selectNode(node) {
  let d = dist(mouseX, mouseY, node.x, node.y);
  if (d < 30) {
    node.selected = !node.selected;
  }
  for (let child of node.children) {
    selectNode(child);
  }
}

// --- 9. 마우스 오버된 노드 찾기 -------------------------------------
function findHoveredNode(node) {
  let d = dist(mouseX, mouseY, node.x, node.y);
  if (d < 30) return node;
  for (let child of node.children) {
    let result = findHoveredNode(child);
    if (result) return result;
  }
  return null;
}
