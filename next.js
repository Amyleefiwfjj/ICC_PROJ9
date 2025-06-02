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

// 가족 메시지 이미지를 아래에서 위로 올릴 때 쓸 변수들
let familyImg;                  // “WE ARE ONE BIG FAMILY.png” 이미지
let familyY;                    // 현재 y 위치
let familyTargetY;              // 최종 고정될 y 위치
let familySpeed = 2;            // 올라가는 속도 (픽셀/프레임)
let familyScaledW, familyScaledH; // 캔버스 크기에 맞춘 이미지 크기

// 회전용 각도 변수
let familyAngle = 0;

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

    // 3) 가족 메시지 이미지 로드 (“WE ARE ONE BIG FAMILY.png”)
    familyImg = loadImage('assets/WE ARE ONE BIG FAMILY.png');
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

    // 4) 가족 메시지 이미지 초기 위치·스케일 계산
    //    (가로 크기를 캔버스 너비의 60%로 조정)
    if (familyImg.width > 0) {
        familyScaledW = width * 0.6;
        familyScaledH = (familyImg.height / familyImg.width) * familyScaledW;
    } else {
        // 이미지 로드 지연될 경우 임시값
        familyScaledW = width * 0.6;
        familyScaledH = familyScaledW * 0.3;
    }
    // 화면 아래(보이지 않는 영역)에서 출발
    familyY = height + familyScaledH / 2 + 20;
    // 최종 고정될 위치: 캔버스 맨 아래에서 약간 위 (이미지 절반 높이 + 마진)
    familyTargetY = height - (familyScaledH / 2) - 40;
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
        // (2) 실제 궤도 각도: 140° → 320°
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
            offsets[i].x = random(-20, 20);
            offsets[i].y = random(-20, 20);
            isHover[i] = true;
        }
        // (8) 호버 상태가 아닐 때: 단계적으로 offsets[i]를 (0,0)으로 복귀
        if (!hovering) {
            isHover[i] = false;
            const lerpFactor = 0.05;
            offsets[i].x = lerp(offsets[i].x, 0, lerpFactor);
            offsets[i].y = lerp(offsets[i].y, 0, lerpFactor);
        }

        // (9) 최종 그릴 위치: 기본 궤도 위치 + offsets
        let drawX = x0 + offsets[i].x;
        let drawY = y0 + offsets[i].y;

        // (10) 위성 이미지를 그리되, 마우스 호버 여부에 따라 투명도 조절
        if (hovering) {
            tint(255, 200);
        } else {
            noTint();
        }
        image(sats[i], drawX, drawY, satSize, satSize);
        noTint();
    }

    pop();

    // ─────────────────────────────────────────────
    // 가족 메시지 이미지(텍스트 PNG) 그리기
    // ─────────────────────────────────────────────

    // (1) 아직 familyImg가 완전히 로드되지 않았으면 draw() 탈출
    if (!familyImg || familyImg.width === 0) {
        return;
    }

    // (2) familyY가 최종 위치에 도달하지 않았다면 위로 이동
    if (familyY > familyTargetY) {
        familyY -= familySpeed;
        if (familyY < familyTargetY) {
            familyY = familyTargetY;
        }
    }

    // (3) 이미지 위에 마우스가 올라와 있는지 판정
    // → 이미지 중심 = (width/2, familyY), 크기 = (familyScaledW, familyScaledH)
    let overFamily = false;
    let leftX = width / 2 - familyScaledW / 2;
    let rightX = width / 2 + familyScaledW / 2;
    let topY = familyY - familyScaledH / 2;
    let bottomY = familyY + familyScaledH / 2;
    if (mouseX >= leftX && mouseX <= rightX && mouseY >= topY && mouseY <= bottomY) {
        overFamily = true;
    }

    // (4) 마우스가 이미지 위에 있으면 회전 각도 증가, 벗어나면 0으로 리셋
    if (overFamily) {
        familyAngle += 0.1; // 회전 속도 조절 (라디안)
    } else {
        familyAngle = 0;
    }

    // (5) 투명도 설정: 호버 시 불투명, 아닐 때 반투명
    if (overFamily) {
        tint(255, 180);
    } else {
        tint(255, 150);
    }

    // (6) 화면 하단 중앙에 familyImg를 회전시켜 그리기
    push();
    translate(width / 2, familyY);
    rotate(familyAngle);
    image(familyImg, 0, 0, familyScaledW, familyScaledH);
    pop();

    noTint();  // 다음 렌더링을 위해 tint 해제

    // ─────────────────────────────────────────────
    // 가족 메시지 이미지 추가 부분 끝
    // ─────────────────────────────────────────────
}

function windowResized() {
    resizeCanvas(windowWidth, windowHeight);

    // 창 크기 바뀌면 familyScaledW/H와 targetY도 재계산
    if (familyImg && familyImg.width > 0) {
        familyScaledW = width * 0.6;
        familyScaledH = (familyImg.height / familyImg.width) * familyScaledW;
        familyTargetY = height - (familyScaledH / 2) - 20;
    }
}
