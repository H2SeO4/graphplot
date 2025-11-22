(function(){const r=document.createElement("link").relList;if(r&&r.supports&&r.supports("modulepreload"))return;for(const n of document.querySelectorAll('link[rel="modulepreload"]'))c(n);new MutationObserver(n=>{for(const s of n)if(s.type==="childList")for(const l of s.addedNodes)l.tagName==="LINK"&&l.rel==="modulepreload"&&c(l)}).observe(document,{childList:!0,subtree:!0});function o(n){const s={};return n.integrity&&(s.integrity=n.integrity),n.referrerPolicy&&(s.referrerPolicy=n.referrerPolicy),n.crossOrigin==="use-credentials"?s.credentials="include":n.crossOrigin==="anonymous"?s.credentials="omit":s.credentials="same-origin",s}function c(n){if(n.ep)return;n.ep=!0;const s=o(n);fetch(n.href,s)}})();const v=document.querySelector("#app");if(!v)throw new Error("App container not found");v.innerHTML=`
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
`;const i=document.querySelector("#plotCanvas"),t=i.getContext("2d"),d=document.querySelector("#status"),g=document.querySelector("#controls"),C=e=>new Function("x",`return ${e};`),u=()=>{const e=i.width,r=i.height;t.fillStyle="#0e1117",t.fillRect(0,0,e,r),t.strokeStyle="#1f2530",t.lineWidth=1;for(let o=0;o<=e;o+=40)t.beginPath(),t.moveTo(o,0),t.lineTo(o,r),t.stroke();for(let o=0;o<=r;o+=40)t.beginPath(),t.moveTo(0,o),t.lineTo(e,o),t.stroke()},L=e=>{u();let r;try{r=C(e.expr)}catch{d.textContent="表达式有误，请检查语法。";return}const{xmin:o,xmax:c,color:n}=e,s=i.width,l=i.height,b=s/(c-o),w=l/8;t.strokeStyle=n,t.lineWidth=2,t.beginPath();for(let a=0;a<s;a++){const S=o+a/b;let p=Number(r(S));if(!Number.isFinite(p))continue;const m=l/2-p*w;a===0?t.moveTo(a,m):t.lineTo(a,m)}t.stroke(),d.textContent=`已绘制：y = ${e.expr}`},y=()=>{const e=new FormData(g);return{expr:e.get("expr").trim(),xmin:Number(e.get("xmin")),xmax:Number(e.get("xmax")),color:e.get("color"),dpi:Number(e.get("dpi"))}};var h;(h=document.querySelector("#plotBtn"))==null||h.addEventListener("click",()=>{L(y())});var f;(f=document.querySelector("#resetBtn"))==null||f.addEventListener("click",()=>{g.reset(),u(),d.textContent="等待绘制..."});var x;(x=document.querySelector("#downloadBtn"))==null||x.addEventListener("click",()=>{const{dpi:e}=y(),r=document.createElement("canvas");r.width=i.width*e,r.height=i.height*e;const o=r.getContext("2d");o.scale(e,e),o.drawImage(i,0,0);const c=document.createElement("a");c.download="graphplot.png",c.href=r.toDataURL("image/png"),c.click()});u();d.textContent="已初始化画布";
