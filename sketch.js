/**
 * ✨ 泡泡拍照濾鏡 — 升級整合版
 * 功能：彩色粒子混合、多種濾鏡模式切換、倒數計時拍照、閃光效果
 */

let capture;
let pg;
let particles = [];
let snapshot = null;

// 倒數與閃光狀態
let countdown = 0;
let countdownTimer = null;
let flashAlpha = 0;

// 濾鏡模式設定
const MODES = [
  { name: '🫧 夢幻泡泡', types: ['bubble'], bg: null },
  { name: '⭐ 星空閃爍', types: ['star', 'sparkle'], bg: null },
  { name: '🌸 花瓣飄落', types: ['petal', 'heart'], bg: null },
  { name: '❄️ 冬日雪花', types: ['snow', 'bubble'], bg: null },
  { name: '💛 彩虹混合', types: ['bubble', 'star', 'heart', 'petal'], bg: null },
];
let modeIndex = 0;

// UI 元素
let btnCountdown, btnSave, btnMode;
let uiContainer;
let modeLabel;

// ───────────────────────────────────────────
function setup() {
  createCanvas(windowWidth, windowHeight);
  colorMode(HSB, 360, 100, 100, 100);

  capture = createCapture(VIDEO);
  capture.hide();

  pg = createGraphics(640, 480);
  pg.colorMode(HSB, 360, 100, 100, 100);

  setupUI();
}

function draw() {
  background(280, 30, 95); // 柔和薰衣草背景

  let scaleFactor = width < height ? 0.85 : 0.6;
  let imgW = width * scaleFactor;
  let imgH = (imgW * (capture.height || 480)) / (capture.width || 640);

  if (imgH > height * 0.72) {
    imgH = height * 0.72;
    imgW = (imgH * (capture.width || 640)) / (capture.height || 480);
  }

  let xOffset = (width - imgW) / 2;
  let yOffset = (height - imgH) / 2 - 30;

  // 更新粒子圖層
  updateParticleLayer();

  // 鏡像繪製
  push();
  translate(width, 0);
  scale(-1, 1);

  // 攝影機影像
  image(capture, xOffset, yOffset, imgW, imgH);

  // 粒子疊加層
  image(pg, xOffset, yOffset, imgW, imgH);

  // 白色裝飾框
  stroke(0, 0, 100, 60);
  strokeWeight(max(2, width * 0.003));
  noFill();
  rect(xOffset, yOffset, imgW, imgH, 8);
  pop();

  // 倒數顯示
  if (countdown > 0) {
    drawCountdown(xOffset, yOffset, imgW, imgH);
  }

  // 閃光效果
  if (flashAlpha > 0) {
    colorMode(RGB, 255);
    fill(255, 255, 255, flashAlpha);
    noStroke();
    rect(0, 0, width, height);
    colorMode(HSB, 360, 100, 100, 100);
    flashAlpha = max(0, flashAlpha - 18);
  }

  // 拍照預覽圖
  if (snapshot) {
    drawPreview(snapshot);
  }

  updateUIStyle();
}

// ───────────────────────────────────────────
// 粒子圖層
function updateParticleLayer() {
  if (capture.loadedmetadata) {
    if (pg.width !== capture.width || pg.height !== capture.height) {
      pg.resizeCanvas(capture.width, capture.height);
      pg.colorMode(HSB, 360, 100, 100, 100);
    }
  }

  pg.clear();

  let mode = MODES[modeIndex];
  // 控制產生頻率
  if (random(1) < 0.15) {
    let t = random(mode.types);
    particles.push(new Particle(pg.width, pg.height, t));
  }

  for (let i = particles.length - 1; i >= 0; i--) {
    particles[i].move();
    particles[i].display(pg);
    if (particles[i].isOffScreen()) {
      particles.splice(i, 1);
    }
  }
}

// ───────────────────────────────────────────
// 倒數顯示
function drawCountdown(x, y, w, h) {
  let cx = x + w / 2;
  let cy = y + h / 2;

  // 脈動光環
  let pulse = sin(frameCount * 0.15) * 15;
  colorMode(RGB, 255);
  noFill();
  stroke(180, 100, 255, 120);
  strokeWeight(3);
  ellipse(cx, cy, 120 + pulse, 120 + pulse);
  stroke(180, 100, 255, 60);
  strokeWeight(8);
  ellipse(cx, cy, 150 + pulse, 150 + pulse);

  // 數字
  fill(255, 255, 255, 230);
  noStroke();
  textAlign(CENTER, CENTER);
  textSize(80);
  textStyle(BOLD);
  text(countdown, cx, cy);
  colorMode(HSB, 360, 100, 100, 100);
}

// ───────────────────────────────────────────
// 拍照功能
function startCountdownShot() {
  if (countdownTimer) return;
  countdown = 3;
  btnCountdown.elt.disabled = true;

  countdownTimer = setInterval(() => {
    countdown--;
    if (countdown <= 0) {
      clearInterval(countdownTimer);
      countdownTimer = null;
      countdown = 0;
      doTakeSnapshot();
    }
  }, 1000);
}

function doTakeSnapshot() {
  flashAlpha = 220; // 觸發閃光

  // 稍微延遲讓閃光先繪製
  setTimeout(() => {
    let scaleFactor = width < height ? 0.85 : 0.6;
    let imgW = width * scaleFactor;
    let imgH = (imgW * capture.height) / capture.width;
    if (imgH > height * 0.72) {
      imgH = height * 0.72;
      imgW = (imgH * capture.width) / capture.height;
    }
    let x = (width - imgW) / 2;
    let y = (height - imgH) / 2 - 30;

    snapshot = get(x, y, imgW, imgH);
    btnSave.show();
    btnCountdown.elt.disabled = false;
  }, 80);
}

function savePhoto() {
  if (snapshot) {
    let filename = 'snap_' + nf(hour(), 2) + nf(minute(), 2) + nf(second(), 2) + '.png';
    save(snapshot, filename);
  }
}

function switchMode() {
  modeIndex = (modeIndex + 1) % MODES.length;
  particles = [];
  modeLabel.html(MODES[modeIndex].name);
}

// ───────────────────────────────────────────
// 預覽圖
function drawPreview(img) {
  let pw = width < 600 ? width * 0.25 : 120;
  let ph = (pw * img.height) / img.width;
  let px = width - pw - 20;
  let py = 20;

  colorMode(RGB, 255);
  fill(255, 255, 255, 200);
  noStroke();
  rect(px - 6, py - 6, pw + 12, ph + 12, 10);
  image(img, px, py, pw, ph);
  colorMode(HSB, 360, 100, 100, 100);
}

// ───────────────────────────────────────────
// UI
function setupUI() {
  uiContainer = createDiv('');
  uiContainer.style('position', 'absolute');
  uiContainer.style('bottom', '28px');
  uiContainer.style('width', '100%');
  uiContainer.style('display', 'flex');
  uiContainer.style('flex-direction', 'column');
  uiContainer.style('align-items', 'center');
  uiContainer.style('gap', '10px');

  // 濾鏡名稱標籤
  modeLabel = createDiv(MODES[0].name);
  modeLabel.parent(uiContainer);
  modeLabel.style('font-size', '14px');
  modeLabel.style('color', 'rgba(80,50,120,0.85)');
  modeLabel.style('font-weight', '600');
  modeLabel.style('letter-spacing', '1px');

  let btnRow = createDiv('');
  btnRow.parent(uiContainer);
  btnRow.style('display', 'flex');
  btnRow.style('gap', '12px');
  btnRow.style('justify-content', 'center');

  btnMode = createButton('🎨 切換濾鏡');
  btnMode.parent(btnRow);
  btnMode.mousePressed(switchMode);

  btnCountdown = createButton('📸 倒數拍照');
  btnCountdown.parent(btnRow);
  btnCountdown.mousePressed(startCountdownShot);

  btnSave = createButton('💾 儲存');
  btnSave.parent(btnRow);
  btnSave.mousePressed(savePhoto);
  btnSave.hide();
}

function updateUIStyle() {
  let isMobile = width < 600;
  let fs = isMobile ? '14px' : '16px';
  let pd = isMobile ? '9px 18px' : '12px 24px';
  let btns = [btnMode, btnCountdown, btnSave];

  btns.forEach(b => {
    b.style('padding', pd);
    b.style('font-size', fs);
    b.style('border-radius', '50px');
    b.style('border', 'none');
    b.style('font-weight', 'bold');
    b.style('cursor', 'pointer');
    b.style('color', 'white');
    b.style('box-shadow', '0 4px 18px rgba(100,60,180,0.25)');
    b.style('transition', 'transform 0.1s');
  });

  btnMode.style('background', 'linear-gradient(135deg,#9b72cf,#c491d3)');
  btnCountdown.style('background', 'linear-gradient(135deg,#6a4c93,#9b72cf)');
  btnSave.style('background', 'linear-gradient(135deg,#ff595e,#ff8c66)');
}

function windowResized() {
  resizeCanvas(windowWidth, windowHeight);
}

// ───────────────────────────────────────────
// 粒子類別
class Particle {
  constructor(w, h, type) {
    this.x = random(w);
    this.y = h + 50;
    this.r = random(w * 0.012, w * 0.038);
    this.speed = random(1.2, 3.2);
    this.angle = random(TWO_PI);
    this.hue = random(360);
    this.type = type || 'bubble';
    this.rot = random(TWO_PI);
    this.rotSpeed = random(-0.04, 0.04);
    this.life = 1.0;
  }

  move() {
    this.y -= this.speed;
    this.x += sin(frameCount * 0.05 + this.angle) * 1.3;
    this.rot += this.rotSpeed;
    this.hue = (this.hue + 0.8) % 360; // 緩慢色輪漂移
  }

  display(t) {
    t.push();
    t.translate(this.x, this.y);

    switch (this.type) {
      case 'bubble':   this._drawBubble(t);   break;
      case 'star':     this._drawStar(t);     break;
      case 'sparkle':  this._drawSparkle(t);  break;
      case 'heart':    this._drawHeart(t);    break;
      case 'petal':    this._drawPetal(t);    break;
      case 'snow':     this._drawSnow(t);     break;
    }

    t.pop();
  }

  _drawBubble(t) {
    t.noFill();
    t.stroke(this.hue, 60, 100, 75);
    t.strokeWeight(1.8);
    t.ellipse(0, 0, this.r * 2);
    // 高光
    t.fill(0, 0, 100, 55);
    t.noStroke();
    t.ellipse(-this.r * 0.3, -this.r * 0.3, this.r * 0.45);
    // 底部反光
    t.fill(this.hue, 30, 100, 25);
    t.ellipse(this.r * 0.15, this.r * 0.35, this.r * 0.6, this.r * 0.25);
  }

  _drawStar(t) {
    t.rotate(this.rot);
    t.fill(this.hue, 80, 100, 85);
    t.noStroke();
    let sp = 5, inner = this.r * 0.4, outer = this.r;
    t.beginShape();
    for (let i = 0; i < sp * 2; i++) {
      let a = (i * PI) / sp - PI / 2;
      let r = i % 2 === 0 ? outer : inner;
      t.vertex(cos(a) * r, sin(a) * r);
    }
    t.endShape(CLOSE);
    // 光暈
    t.fill(this.hue, 60, 100, 30);
    t.ellipse(0, 0, this.r * 2.5, this.r * 2.5);
  }

  _drawSparkle(t) {
    t.rotate(this.rot);
    t.stroke(this.hue, 50, 100, 90);
    t.strokeWeight(1.5);
    t.noFill();
    let arms = 4;
    for (let i = 0; i < arms; i++) {
      let a = (i * TWO_PI) / arms;
      t.line(0, 0, cos(a) * this.r, sin(a) * this.r);
      t.line(0, 0, cos(a + PI / arms) * this.r * 0.5, sin(a + PI / arms) * this.r * 0.5);
    }
    t.fill(this.hue, 40, 100, 70);
    t.noStroke();
    t.ellipse(0, 0, this.r * 0.4);
  }

  _drawHeart(t) {
    t.rotate(this.rot * 0.3);
    t.fill(this.hue, 70, 100, 80);
    t.noStroke();
    let s = this.r / 10;
    t.scale(s, s);
    t.beginShape();
    t.vertex(0, -3);
    t.bezierVertex(0, -8, 8, -8, 8, -3);
    t.bezierVertex(8, 2, 0, 8, 0, 12);
    t.bezierVertex(0, 8, -8, 2, -8, -3);
    t.bezierVertex(-8, -8, 0, -8, 0, -3);
    t.endShape(CLOSE);
  }

  _drawPetal(t) {
    t.rotate(this.rot);
    t.fill(this.hue, 45, 100, 70);
    t.stroke(this.hue, 50, 85, 50);
    t.strokeWeight(0.5);
    t.ellipse(0, -this.r * 0.5, this.r * 0.45, this.r * 0.95);
    // 中脈
    t.stroke(this.hue, 30, 90, 60);
    t.strokeWeight(0.8);
    t.line(0, -this.r * 0.05, 0, -this.r * 0.9);
  }

  _drawSnow(t) {
    t.rotate(this.rot);
    t.stroke(200, 30, 100, 85);
    t.strokeWeight(1.2);
    t.noFill();
    for (let i = 0; i < 6; i++) {
      t.push();
      t.rotate((i * TWO_PI) / 6);
      t.line(0, 0, 0, -this.r);
      t.line(0, -this.r * 0.5, this.r * 0.25, -this.r * 0.72);
      t.line(0, -this.r * 0.5, -this.r * 0.25, -this.r * 0.72);
      t.pop();
    }
    t.fill(200, 20, 100, 60);
    t.noStroke();
    t.ellipse(0, 0, this.r * 0.35);
  }

  isOffScreen() {
    return this.y < -100;
  }
}