import './style.css';

const app = document.querySelector<HTMLDivElement>('#app');
if (!app) {
  throw new Error('App container not found');
}

app.innerHTML = `
  <header class="hero">
    <div>
      <p class="eyebrow">GraphPlot · AI辅助网站建设</p>
      <h1>交互式函数绘图实验台</h1>
      <p>输入数学表达式、调整区间，即刻预览曲线并导出图像。适合作业展示与教学演示。</p>
      <div class="hero-actions">
        <button id="plotBtn" class="primary">绘制函数</button>
        <button id="resetBtn" class="ghost">清空画布</button>
      </div>
    </div>
    <div class="hero-card">
      <p>提示：支持 \`sin(x)\`, \`cos(x)\`, \`exp(x)\`, \`log(x)\` 等 JS 表达式。</p>
    </div>
  </header>

  <section class="panel">
    <form id="controls">
      <label>
        函数表达式
        <input type="text" name="expr" value="sin(x)" placeholder="例如：sin(x) + 0.3 * cos(3*x)" required />
      </label>
      <div class="grid-2">
        <label>最小 x<input type="number" name="xmin" value="-10" step="0.5" /></label>
        <label>最大 x<input type="number" name="xmax" value="10" step="0.5" /></label>
      </div>
      <div class="grid-2">
        <label>线条颜色<input type="color" name="color" value="#ff6f61" /></label>
        <label>导出 DPI<select name="dpi"><option value="1">屏幕</option><option value="2">高清</option></select></label>
      </div>
    </form>
  </section>

  <section class="canvas-wrapper">
    <canvas id="plotCanvas" width="800" height="480"></canvas>
    <div class="canvas-actions">
      <button id="downloadBtn">导出 PNG</button>
      <span id="status">等待绘制...</span>
    </div>
  </section>
`;

type PlotConfig = {
  expr: string;
  xmin: number;
  xmax: number;
  color: string;
  dpi: number;
};

const canvas = document.querySelector<HTMLCanvasElement>('#plotCanvas')!;
const ctx = canvas.getContext('2d')!;
const statusEl = document.querySelector('#status')!;
const form = document.querySelector<HTMLFormElement>('#controls')!;

const evaluate = (expr: string) => {
  // eslint-disable-next-line no-new-func
  return new Function('x', `return ${expr};`);
};

const drawGrid = () => {
  const w = canvas.width;
  const h = canvas.height;
  ctx.fillStyle = '#0e1117';
  ctx.fillRect(0, 0, w, h);
  ctx.strokeStyle = '#1f2530';
  ctx.lineWidth = 1;
  for (let x = 0; x <= w; x += 40) {
    ctx.beginPath();
    ctx.moveTo(x, 0);
    ctx.lineTo(x, h);
    ctx.stroke();
  }
  for (let y = 0; y <= h; y += 40) {
    ctx.beginPath();
    ctx.moveTo(0, y);
    ctx.lineTo(w, y);
    ctx.stroke();
  }
};

const plot = (config: PlotConfig) => {
  drawGrid();
  let compiled;
  try {
    compiled = evaluate(config.expr);
  } catch {
    statusEl.textContent = '表达式有误，请检查语法。';
    return;
  }
  const { xmin, xmax, color } = config;
  const w = canvas.width;
  const h = canvas.height;
  const scaleX = w / (xmax - xmin);
  const scaleY = h / 8; // 自定义 Y 缩放
  ctx.strokeStyle = color;
  ctx.lineWidth = 2;
  ctx.beginPath();
  for (let px = 0; px < w; px++) {
    const x = xmin + px / scaleX;
    let y = Number(compiled(x));
    if (!Number.isFinite(y)) continue;
    const py = h / 2 - y * scaleY;
    if (px === 0) ctx.moveTo(px, py);
    else ctx.lineTo(px, py);
  }
  ctx.stroke();
  statusEl.textContent = `已绘制：y = ${config.expr}`;
};

const collectConfig = (): PlotConfig => {
  const data = new FormData(form);
  return {
    expr: (data.get('expr') as string).trim(),
    xmin: Number(data.get('xmin')),
    xmax: Number(data.get('xmax')),
    color: data.get('color') as string,
    dpi: Number(data.get('dpi')),
  };
};

document.querySelector('#plotBtn')?.addEventListener('click', () => {
  plot(collectConfig());
});

document.querySelector('#resetBtn')?.addEventListener('click', () => {
  form.reset();
  drawGrid();
  statusEl.textContent = '等待绘制...';
});

document.querySelector('#downloadBtn')?.addEventListener('click', () => {
  const { dpi } = collectConfig();
  const tmp = document.createElement('canvas');
  tmp.width = canvas.width * dpi;
  tmp.height = canvas.height * dpi;
  const tmpCtx = tmp.getContext('2d')!;
  tmpCtx.scale(dpi, dpi);
  tmpCtx.drawImage(canvas, 0, 0);
  const link = document.createElement('a');
  link.download = 'graphplot.png';
  link.href = tmp.toDataURL('image/png');
  link.click();
});

drawGrid();
statusEl.textContent = '已初始化画布';
