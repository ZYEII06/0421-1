/**
 * p5.js 完整程式碼：攝影機鏡像置中 + 透明泡泡圖層
 */

let capture;    // 攝影機物件
let pg;         // 離屏畫布 (疊加層)
let bubbles = []; // 泡泡陣列

function setup() {
  // 1. 建立全螢幕畫布
  createCanvas(windowWidth, windowHeight);
  
  // 2. 啟動攝影機並隱藏預設的 HTML 影片元件
  capture = createCapture(VIDEO);
  capture.hide();

  // 3. 建立一個與攝影機初始解析度相近的離屏畫布
  // 實際上 draw 中會根據攝影機 metadata 動態調整
  pg = createGraphics(640, 480);
}

function draw() {
  // 設定背景顏色 e7c6ff
  background('#e7c6ff');

  // 計算視訊要在畫面上顯示的大小 (畫布的 60%)
  let imgW = width * 0.6;
  let imgH = height * 0.6;
  let xOffset = (width - imgW) / 2;
  let yOffset = (height - imgH) / 2;

  // --- 步驟 A：處理離屏畫布 (pg) ---
  
  // 確認攝影機資料載入後，調整 pg 大小以符合比例
  if (capture.loadedmetadata) {
    if (pg.width !== capture.width || pg.height !== capture.height) {
      pg.resizeCanvas(capture.width, capture.height);
    }
  }

  // 清除離屏畫布，使其保持透明
  pg.clear();

  // 產生新泡泡的機率 (0.1 = 10% 機率每影格產生一個)
  if (random(1) < 0.15) {
    bubbles.push(new Bubble(pg.width, pg.height));
  }

  // 更新並繪製所有泡泡到 pg 上
  for (let i = bubbles.length - 1; i >= 0; i--) {
    bubbles[i].move();
    bubbles[i].display(pg);

    // 移除超出頂端的泡泡
    if (bubbles[i].isOffScreen()) {
      bubbles.splice(i, 1);
    }
  }

  // --- 步驟 B：將所有內容繪製到主畫布上 ---

  push();
  // 1. 執行鏡像反轉：平移到最右邊，然後 X 軸縮放為 -1
  translate(width, 0);
  scale(-1, 1);

  // 2. 繪製攝影機影像 (置中)
  image(capture, xOffset, yOffset, imgW, imgH);

  // 3. 將泡泡圖層疊加在攝影機上方
  image(pg, xOffset, yOffset, imgW, imgH);
  pop();
}

// 當瀏覽器視窗大小改變時，重新調整畫布
function windowResized() {
  resizeCanvas(windowWidth, windowHeight);
}

// --- 泡泡類別定義 ---
class Bubble {
  constructor(w, h) {
    this.x = random(w);
    this.y = h + 20;            // 從畫面底部外產生
    this.r = random(8, 25);     // 泡泡大小
    this.speed = random(1, 4);  // 上升速度
    this.wiggle = random(0.5, 2); // 左右晃動幅度
  }

  move() {
    this.y -= this.speed;
    this.x += sin(frameCount * 0.1) * this.wiggle; // 使用正弦函數產生平滑震盪
  }

  display(target) {
    target.push();
    target.noFill();
    target.stroke(255, 255, 255, 180); // 白色半透明邊框
    target.strokeWeight(1.5);
    target.ellipse(this.x, this.y, this.r * 2);
    
    // 增加一個反光點，讓泡泡更真實
    target.fill(255, 255, 255, 100);
    target.noStroke();
    target.ellipse(this.x - this.r * 0.3, this.y - this.r * 0.3, this.r * 0.4);
    target.pop();
  }

  isOffScreen() {
    return this.y < -50;
  }
}