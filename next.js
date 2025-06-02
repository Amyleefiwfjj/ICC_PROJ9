// ─────────────────────────────────────────────
// sketch.js
// ─────────────────────────────────────────────
let bgVideo;               // 배경 동영상 객체
let sats = [];             // 위성 이미지 배열
const NUM_SATS = 20;       // 위성 개수

function preload() {
    bgVideo = createVideo('assets/earth.mp4', () => {
        bgVideo.hide();       // <video> 태그를 숨기고 canvas에만 그리도록 설정
        bgVideo.volume(0);    // 음소거 (브라우저 자동 재생 허용)
        bgVideo.loop();       // 반복 재생
    });

    // 2) 20개의 위성 PNG 로드 (sat01.png ~ sat20.png)
    for (let i = 1; i <= NUM_SATS; i++) {
        const fileName = `assets/${nf(i, 2)}.png`; // ex) 'sat01.png'
        sats.push(loadImage(fileName));
    }
}

function setup() {
    createCanvas(windowWidth, windowHeight);
    imageMode(CENTER);
    frameRate(60);
}

function draw() {
    // 0) 동영상이 아직 준비되지 않았다면 건너뜀
    //    (width 프로퍼티를 체크하면 로드 여부를 알 수 있음)
    if (!bgVideo || bgVideo.width === 0) {
        return;
    }

    // 1) 배경 동영상 그리기 (캔버스 전체)
    image(bgVideo, width / 2, height / 2, width, height);

    // 2) 위성들 그리기
    //    - 중앙(0,0)을 캔버스 중심으로 옮긴 뒤, 각도와 반경을 계산하여 orbit 구현
    const orbitBase = min(width, height) * 0.25; // 궤도 기준 반경 (캔버스 크기에 비례)
    push();
    translate(width / 2, height / 2);
    for (let i = 0; i < NUM_SATS; i++) {
        // 각 위성마다 고유 위상 적용 (frameCount * 속도 + 위상차)
        const angle = radians(frameCount * 0.5 + i * (360 / NUM_SATS));
        // 궤도 반경을 위성 인덱스에 따라 미세 변화
        const radius = orbitBase * 0.9 + (i % 4) * 20;
        const satSize = orbitBase * 0.15;
        const x = cos(angle) * radius;
        const y = sin(angle) * radius;

        // 위성 이미지 크기 설정 (궤도 기준에 비례)
        image(sats[i], x, y, satSize, satSize);
    }
    pop();
}

function windowResized() {
    resizeCanvas(windowWidth, windowHeight);
}
