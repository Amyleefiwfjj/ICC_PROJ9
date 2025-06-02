// ─────────────────────────────────────────────
// sketch.js
// ─────────────────────────────────────────────
let bgVideo;                    // 배경 동영상 객체
let sats = [];                  // 위성 이미지 배열
const NUM_SATS = 20;            // 위성 개수

// 각 위성별로 궤도에서 벗어날 때 쓸 오프셋(벡터)
let offsets = [];               // p5.Vector 배열
// 위성별 호버 상태를 관리하기 위한 불리언 플래그
let isHover = [];               // boolean 배열

function preload() {
    // 1) 배경 동영상 로드
    bgVideo = createVideo('assets/earth.mp4', () => {
        bgVideo.hide();
        bgVideo.volume(0);   // 음소거 → 자동 재생 허용
        bgVideo.loop();      // 반복 재생
    });

    // 2) 위성 PNG 20장 로드 (파일명: assets/01.png ~ assets/20.png)
    for (let i = 1; i <= NUM_SATS; i++) {
        let fileName = `assets/${nf(i, 2)}.png`;
        sats.push(loadImage(fileName));
    }
}

function setup() {
    createCanvas(windowWidth, windowHeight);
    imageMode(CENTER);
    frameRate(60);

    // offsets와 isHover 배열 초기화
    for (let i = 0; i < NUM_SATS; i++) {
        offsets.push(createVector(0, 0));
        isHover.push(false);
    }
}

function draw() {
    // 1) 배경 비디오 로드 완료 여부 체크
    if (!bgVideo || bgVideo.width === 0) {
        return;
    }

    // 2) 배경 비디오 그리기
    image(bgVideo, width / 2, height / 2, width, height);

    // 3) 궤도 반경 기준값 (화면 크기에 비례)
    const orbitBase = min(width, height) * 0.4;

    // 4) 각 위성 그리기
    push();
    translate(width / 2, height / 2);

    for (let i = 0; i < NUM_SATS; i++) {
        // (1) 궤도 각도 계산: angleRaw ∈ [0, 180)
        let angleRaw = (frameCount * 0.5 + i * (180 / NUM_SATS)) % 180;
        // (2) 실제 궤도 각도: 140° → 320° (원래 135°→315°였으나 예시로 140° 사용)
        let angle = radians(angleRaw + 140);

        // (3) 위성별 미세 궤도 반경
        let radius = orbitBase * 0.9 + (i % 4) * 20;

        // (4) 궤도 상의 기본 위치(x0, y0) 계산
        let x0 = cos(angle) * radius;
        let y0 = sin(angle) * radius * 0.5 - 10;
        // y축을 반 토막(0.5)으로 줄여 타원 효과, -10은 살짝 아래로 이동

        // (5) 마우스와 위성의 “화면 상 위치” 계산
        // 현재 위성 이미지가 그려질 실제 좌표 = (캔버스 중심 + 기본 궤도 좌표 + 오프셋)
        let absX = width / 2 + x0 + offsets[i].x;
        let absY = height / 2 + y0 + offsets[i].y;

        // (6) 마우스가 위성 이미지 위에 올라와 있는지 판정
        let satSize = orbitBase * 0.15;
        let d = dist(mouseX, mouseY, absX, absY);
        let hovering = (d < satSize / 2);

        // (7) 새로 호버가 시작된 경우: offsets[i]에 불규칙 오프셋 할당
        if (hovering && !isHover[i]) {
            // 화면 밖으로 살짝 튀어나갈 정도의 랜덤 오프셋 (±20px 범위)
            offsets[i].x = random(-20, 20);
            offsets[i].y = random(-20, 20);
            isHover[i] = true;
        }
        // (8) 호버 상태가 아닐 때: 단계적으로 offsets[i]를 (0,0)으로 복귀시키기
        if (!hovering) {
            isHover[i] = false;
            // lerpFactor가 작을수록 천천히 복귀
            const lerpFactor = 0.05;
            offsets[i].x = lerp(offsets[i].x, 0, lerpFactor);
            offsets[i].y = lerp(offsets[i].y, 0, lerpFactor);
        }

        // (9) 최종 그릴 위치: 기본 궤도 위치 + offsets
        let drawX = x0 + offsets[i].x;
        let drawY = y0 + offsets[i].y;

        // (10) 위성 이미지를 그리되, 마우스 호버 여부에 따라 살짝 투명하게 표현 (선택 사항)
        //     – 색·크기 변경 요구가 아니므로, hover 시 투명도를 약간 줄여서 시각적으로 구분할 수 있게 함
        if (hovering) {
            tint(255, 200);  // 살짝 투명
        } else {
            noTint();
        }
        image(sats[i], drawX, drawY, satSize, satSize);
        noTint();
    }

    pop();
}

function windowResized() {
    resizeCanvas(windowWidth, windowHeight);
}
