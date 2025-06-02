let bgVideo;            // 배경 동영상
let sats = [];          // 위성 이미지 배열
const NUM_SATS = 20;    // 위성 개수

function preload() {
    // 배경 동영상 로드 (루트 폴더에 'earth.mp4'가 있다고 가정)
    bgVideo = createVideo('assets/earth.mp4', () => {
        bgVideo.hide();
        bgVideo.volume(0);  // 음소거 → 브라우저 자동 재생 허용
        bgVideo.loop();     // 반복 재생
    });

    // 위성 PNG 20장 로드 (sat01.png ~ sat20.png)
    for (let i = 1; i <= NUM_SATS; i++) {
        let fileName = `assets/${nf(i, 2)}.png`;  // ex) "sat01.png", "sat02.png", ... "sat20.png"
        sats.push(loadImage(fileName));
    }
}

function setup() {
    createCanvas(windowWidth, windowHeight);
    imageMode(CENTER);
    frameRate(60);
}

function draw() {
    // 1) 배경 비디오가 아직 로드되지 않았다면 draw 탈출
    if (!bgVideo || bgVideo.width === 0) {
        return;
    }

    // 2) 배경 비디오 그리기
    image(bgVideo, width / 2, height / 2, width, height);

    const orbitBase = min(width, height) * 0.4;  // 궤도 반경 기준값

    push();
    translate(width / 2, height / 2);
    for (let i = 0; i < NUM_SATS; i++) {
        // ① angleRaw: 0부터 180까지 순환
        let angleRaw = (frameCount * 0.5 + i * (180 / NUM_SATS)) % 180;
        // ② 실제 궤도 상의 각도: 135° 부터 시작 → 315°까지
        let angle = radians(angleRaw + 140);

        // 궤도 반경(위성마다 미세하게 다르게)
        let radius = orbitBase * 0.9 + (i % 4) * 20;

        // x, y 좌표
        let x = cos(angle) * radius;
        // y를 0.5 배 스케일로 줄여서 화면 앞쪽 타원 궤도처럼 보이게 함
        let y = sin(angle) * radius * 0.5 - 10;

        // 위성 크기
        let satSize = orbitBase * 0.15;
        image(sats[i], x, y, satSize, satSize);
    }
    pop();
}

// 창 크기 변화 대응
function windowResized() {
    resizeCanvas(windowWidth, windowHeight);
}
