/**
 * p5.js 最終整合版本：響應式配置、鏡像視訊、動態泡泡疊加、拍照與儲存
 */

let capture;      // 攝影機物件
let pg;           // 泡泡專用的透明圖層 (Graphics)
let bubbles = []; // 儲存泡泡物件
let snapshot = null; // 暫存拍照圖片

// UI 元素
let btnTakePic, btnSavePic;
let uiContainer;

function setup() {
  // 建立全螢幕畫布
  createCanvas(windowWidth, windowHeight);
  
  // 初始化攝影機
  capture = createCapture(VIDEO);
  capture.hide();

  // 建立離屏畫布 (Buffer)，初始解析度隨意，draw 中會動態修正
  pg = createGraphics(640, 480);

  // 初始化 UI 按鈕
  setupUI();
}

function draw() {
  // 背景色 e7c6ff
  background('#e7c6ff');

  // 1. 動態計算比例：手機直向時影像佔寬 85%，橫向時佔 60%
  let scaleFactor = width < height ? 0.85 : 0.6;
  let imgW = width * scaleFactor;
  let imgH = (imgW * (capture.height || 480)) / (capture.width || 640);

  // 避免高度超出螢幕太大 (預留底部按鈕位置)
  if (imgH > height * 0.7) {
    imgH = height * 0.7;
    imgW = (imgH * (capture.width || 640)) / (capture.height || 480);
  }

  let xOffset = (width - imgW) / 2;
  let yOffset = (height - imgH) / 2 - 30; // 稍微往上提一點

  // 2. 更新並繪製泡泡到透明圖層
  updateBubbleLayer();

  // 3. 繪製主畫面 (鏡像處理)
  push();
  translate(width, 0);
  scale(-1, 1);
  
  // 畫攝影機影像
  image(capture, xOffset, yOffset, imgW, imgH);
  // 畫泡泡疊加層
  image(pg, xOffset, yOffset, imgW, imgH);
  
  // 裝飾性白框
  stroke(255);
  strokeWeight(max(2, width * 0.003));
  noFill();
  rect(xOffset, yOffset, imgW, imgH);
  pop();

  // 4. 繪製拍照後的預覽圖 (在右上角)
  if (snapshot) {
    drawPreview(snapshot);
  }

  // 5. 隨時依螢幕寬度更新按鈕樣式 (響應式)
  updateUIStyle();
}

// --- 邏輯：更新泡泡圖層 ---
function updateBubbleLayer() {
  // 同步 pg 與 capture 的解析度
  if (capture.loadedmetadata) {
    if (pg.width !== capture.width || pg.height !== capture.height) {
      pg.resizeCanvas(capture.width, capture.height);
    }
  }
  
  pg.clear(); // 保持背景透明
  
  // 控制泡泡產生頻率
  if (random(1) < 0.12) {
    bubbles.push(new Bubble(pg.width, pg.height));
  }

  for (let i = bubbles.length - 1; i >= 0; i--) {
    bubbles[i].move();
    bubbles[i].display(pg);
    if (bubbles[i].isOffScreen()) {
      bubbles.splice(i, 1);
    }
  }
}

// --- 功能：拍照 ---
function takeSnapshot() {
  // 重新精算目前的擷取區域
  let scaleFactor = width < height ? 0.85 : 0.6;
  let imgW = width * scaleFactor;
  let imgH = (imgW * capture.height) / capture.width;
  if (imgH > height * 0.7) {
    imgH = height * 0.7;
    imgW = (imgH * capture.width) / capture.height;
  }
  let x = (width - imgW) / 2;
  let y = (height - imgH) / 2 - 30;

  // 取得畫面上該區域的影像 (已包含鏡像與泡泡)
  snapshot = get(x, y, imgW, imgH);
  btnSavePic.show();
}

// --- 功能：儲存照片 ---
function savePhoto() {
  if (snapshot) {
    let filename = 'snap_' + nf(hour(),2) + nf(minute(),2) + nf(second(),2) + '.png';
    save(snapshot, filename);
  }
}

// --- UI 設置與樣式 ---
function setupUI() {
  uiContainer = createDiv('');
  uiContainer.style('position', 'absolute');
  uiContainer.style('bottom', '30px');
  uiContainer.style('width', '100%');
  uiContainer.style('display', 'flex');
  uiContainer.style('justify-content', 'center');
  uiContainer.style('gap', '15px');

  btnTakePic = createButton('📸 拍照');
  btnTakePic.parent(uiContainer);
  btnTakePic.mousePressed(takeSnapshot);

  btnSavePic = createButton('💾 儲存');
  btnSavePic.parent(uiContainer);
  btnSavePic.mousePressed(savePhoto);
  btnSavePic.hide();
}

function updateUIStyle() {
  let isMobile = width < 600;
  let btnPadding = isMobile ? '10px 20px' : '14px 28px';
  let fontSize = isMobile ? '15px' : '18px';

  let btns = [btnTakePic, btnSavePic];
  btns.forEach(b => {
    b.style('padding', btnPadding);
    b.style('font-size', fontSize);
    b.style('border-radius', '50px');
    b.style('border', 'none');
    b.style('font-weight', 'bold');
    b.style('cursor', 'pointer');
    b.style('color', 'white');
    b.style('box-shadow', '0 4px 15px rgba(0,0,0,0.15)');
  });

  btnTakePic.style('background-color', '#6a4c93');
  btnSavePic.style('background-color', '#ff595e');
}

function drawPreview(img) {
  let pw = width < 600 ? width * 0.25 : 120;
  let ph = (pw * img.height) / img.width;
  let px = width - pw - 20;
  let py = 20;

  fill(255, 220);
  noStroke();
  rect(px - 5, py - 5, pw + 10, ph + 10, 8);
  image(img, px, py, pw, ph);
}

function windowResized() {
  resizeCanvas(windowWidth, windowHeight);
}

// --- 類別：泡泡 ---
class Bubble {
  constructor(w, h) {
    this.x = random(w);
    this.y = h + 50;
    this.r = random(w * 0.015, w * 0.04);
    this.speed = random(1.5, 3.5);
    this.angle = random(TWO_PI);
  }

  move() {
    this.y -= this.speed;
    this.x += sin(frameCount * 0.05 + this.angle) * 1.2; // 微弱晃動
  }

  display(target) {
    target.push();
    target.noFill();
    target.stroke(255, 180);
    target.strokeWeight(1.5);
    target.ellipse(this.x, this.y, this.r * 2);
    
    // 泡泡高光
    target.fill(255, 100);
    target.noStroke();
    target.ellipse(this.x - this.r * 0.3, this.y - this.r * 0.3, this.r * 0.4);
    target.pop();
  }

  isOffScreen() {
    return this.y < -100;
  }
}