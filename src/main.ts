// @ts-nocheck
import './style.css';

// 声明全局变量，因为它们是通过 CDN 引入的
declare const functionPlot: any;
declare const math: any;
declare const Plotly: any;
declare const MathfieldElement: any;

// 状态管理
const state = {
    mode: '2d', // '2d' or '3d'
    functions: [
        { id: 1, expression: '', color: '#d32f2f' }
    ],
    functions3D: [
        { id: 1, expression: '', color: '#d32f2f' }
    ],
    nextId: 2
};

// 预定义颜色列表
const colors = [
    '#d32f2f', // Red
    '#1976d2', // Blue
    '#388e3c', // Green
    '#fbc02d', // Yellow
    '#8e24aa', // Purple
    '#f57c00', // Orange
    '#0097a7', // Cyan
    '#7b1fa2'  // Violet
];

// DOM 元素
const functionListEl = document.getElementById('function-list');
const addBtn = document.getElementById('add-btn');
const modeBtn = document.getElementById('mode-btn');
const exportBtn = document.getElementById('export-btn');
const plotContainer = document.getElementById('plot');
const keyZBtn = document.getElementById('key-z');
const keyboardToggleBtn = document.getElementById('keyboard-toggle-btn');

// 当前激活的 MathField
let activeMathField = null;

function enforceKeyboardOverlay() {
    if (window.mathVirtualKeyboard) {
        window.mathVirtualKeyboard.overlay = true;
    }
    if (document && document.body && document.body.style) {
        document.body.style.setProperty('padding-bottom', '0px', 'important');
        document.body.style.setProperty('margin-bottom', '0px', 'important');
    }
    if (plotContainer) {
        plotContainer.style.height = '100%';
    }
}

// 初始化
function init() {
    // 检查库是否加载成功
    checkLibraries();

    enforceKeyboardOverlay();

    if (window.mathVirtualKeyboard && typeof window.mathVirtualKeyboard.addEventListener === 'function') {
        window.mathVirtualKeyboard.addEventListener('geometrychange', enforceKeyboardOverlay);
    }

    const bodyStyleObserver = new MutationObserver(() => enforceKeyboardOverlay());
    if (document && document.body) {
        bodyStyleObserver.observe(document.body, { attributes: true, attributeFilter: ['style'] });
    }

    renderFunctionList();
    renderPlot();
    
    addBtn.addEventListener('click', addNewFunction);
    modeBtn.addEventListener('click', toggleMode);
    if (exportBtn) {
        exportBtn.addEventListener('click', exportPlotImage);
    }
    
    // 键盘开关事件：控制 MathLive 全局虚拟键盘
    if (keyboardToggleBtn) {
        keyboardToggleBtn.addEventListener('click', () => {
            if (window.mathVirtualKeyboard) {
                enforceKeyboardOverlay();
                
                // 切换显示状态
                if (window.mathVirtualKeyboard.visible) {
                    window.mathVirtualKeyboard.hide();
                } else {
                    window.mathVirtualKeyboard.show();
                    // 如果有激活的输入框，确保它获得焦点
                    if (activeMathField) {
                        activeMathField.focus();
                    }
                }
            } else {
                showError("MathLive 虚拟键盘未加载，请检查网络连接。");
            }
        });
    }

    // 监听窗口大小变化，重绘图表
    window.addEventListener('resize', () => {
        renderPlot();
    });

    ['math-virtual-keyboard-toggle', 'virtual-keyboard-toggle'].forEach(evt => {
        window.addEventListener(evt, () => {
            enforceKeyboardOverlay();
            requestAnimationFrame(() => renderPlot());
        });
    });
}

function checkLibraries() {
    const missing = [];
    if (typeof functionPlot === 'undefined') missing.push('function-plot');
    if (typeof math === 'undefined') missing.push('math.js');
    if (typeof Plotly === 'undefined') missing.push('Plotly.js');
    // MathLive 通常会定义 MathfieldElement 或 window.MathLive
    if (typeof MathfieldElement === 'undefined') missing.push('MathLive');

    if (missing.length > 0) {
        showError(`以下库加载失败: ${missing.join(', ')}。请检查网络连接或刷新页面。`);
    }
}

// 切换模式
function toggleMode() {
    state.mode = state.mode === '2d' ? '3d' : '2d';
    modeBtn.textContent = state.mode === '2d' ? '切换到 3D' : '切换到 2D';
    
    // 切换 Z 键显示 (虽然现在用的是 MathLive 键盘，但保留逻辑以防万一)
    if (keyZBtn) {
        keyZBtn.style.display = state.mode === '2d' ? 'none' : 'block';
    }

    // 清空绘图区，防止 Plotly 和 function-plot 冲突
    plotContainer.innerHTML = '';
    
    renderFunctionList();
    renderPlot();
}

// 获取当前模式的函数列表
function getCurrentFunctions() {
    return state.mode === '2d' ? state.functions : state.functions3D;
}

// 添加新函数
function addNewFunction() {
    const currentList = getCurrentFunctions();
    const color = colors[currentList.length % colors.length];
    const newFunc = {
        id: state.nextId++,
        expression: '',
        color: color
    };
    currentList.push(newFunc);
    renderFunctionList();
    // 聚焦到新输入框
    // 由于 MathField 是自定义元素，需要稍微延迟一下等待 DOM 更新
    setTimeout(() => {
        const mf = document.getElementById(`mf-${newFunc.id}`);
        if (mf) {
            mf.focus();
            activeMathField = mf;
        }
    }, 0);
}

// 移除函数
function removeFunction(id) {
    if (state.mode === '2d') {
        state.functions = state.functions.filter(f => f.id !== id);
    } else {
        state.functions3D = state.functions3D.filter(f => f.id !== id);
    }
    renderFunctionList();
    renderPlot();
}

// 更新函数表达式
function updateFunction(id, expression) {
    const currentList = getCurrentFunctions();
    const func = currentList.find(f => f.id === id);
    if (func) {
        func.expression = expression;
        renderPlot();
    }
}

// 渲染函数列表输入框
function renderFunctionList() {
    functionListEl.innerHTML = '';
    const currentList = getCurrentFunctions();
    
    currentList.forEach((func, index) => {
        try {
            const item = document.createElement('div');
            item.className = 'function-item';
            
            const colorIndicator = document.createElement('div');
            colorIndicator.className = 'color-indicator';
            colorIndicator.style.backgroundColor = func.color;
            
            const inputGroup = document.createElement('div');
            inputGroup.className = 'function-input-group';
            
            // 输入行
            const inputRow = document.createElement('div');
            inputRow.className = 'input-row';

            // 移除前缀显示 (f(x)= 或 z=)
            // const prefix = document.createElement('span');
            // prefix.className = 'function-prefix';
            // ...
            
            // 使用 MathLive 的 math-field
            const mf = document.createElement('math-field');
            mf.id = `mf-${func.id}`;
            mf.value = func.expression; 
            mf.placeholder = state.mode === '2d' ? '输入函数或方程 (如 x^2 + y^2 = 1)' : '输入函数或方程 (如 z = x^2 + y^2)';
            
            // 配置 MathLive: 隐藏内部 UI，完全由外部控制
            mf.setAttribute('math-virtual-keyboard-policy', 'manual');
            
            // 尝试设置 menuItems，如果失败则忽略 (防止未加载完成时报错)
            try {
                mf.menuItems = [];
            } catch (e) {
                // 忽略
            }
            
            // 监听输入
            mf.addEventListener('input', (e) => {
                const latex = e.target.value;
                const textExpr = latexToText(latex);
                updateFunction(func.id, textExpr);
            });

            // 监听聚焦
            mf.addEventListener('focus', () => {
                activeMathField = mf;
            });
            
            // inputRow.appendChild(prefix); // 不再添加前缀
            inputRow.appendChild(mf);

            inputGroup.appendChild(inputRow);
            
            // 错误信息显示区域
            const errorMsg = document.createElement('div');
            errorMsg.id = `error-${func.id}`;
            errorMsg.className = 'function-error';
            inputGroup.appendChild(errorMsg);
            
            const removeBtn = document.createElement('button');
            removeBtn.className = 'btn-remove';
            removeBtn.innerHTML = '&times;';
            removeBtn.title = '移除';
            removeBtn.onclick = () => removeFunction(func.id);
            
            item.appendChild(colorIndicator);
            item.appendChild(inputGroup);
            item.appendChild(removeBtn);
            
            functionListEl.appendChild(item);
        } catch (err) {
            console.error("Error rendering function item:", err);
        }
    });
}

// 设置特定函数的错误信息
function setFunctionError(id, msg) {
    const errEl = document.getElementById(`error-${id}`);
    if (errEl) {
        errEl.textContent = msg;
        errEl.style.display = 'block';
    }
}

// 清除特定函数的错误信息
function clearFunctionError(id) {
    const errEl = document.getElementById(`error-${id}`);
    if (errEl) {
        errEl.style.display = 'none';
        errEl.textContent = '';
    }
}

// 简单的 LaTeX 到 math.js 表达式转换器
function latexToText(latex) {
    if (!latex) return '';
    let text = latex;
    
    // 0. 处理自然对数底数 e
    // MathLive 可能输出 \mathrm{e}, \exponentialE 或直接 e
    text = text.replace(/\\mathrm{e}/g, 'e');
    text = text.replace(/\\exponentialE/g, 'e');
    text = text.replace(/\\e/g, 'e');

    // 1. 替换常用命令
    text = text.replace(/\\cdot/g, '*');
    text = text.replace(/\\times/g, '*');
    text = text.replace(/\\div/g, '/');
    text = text.replace(/\\pi/g, 'pi');
    text = text.replace(/\\theta/g, 'theta');
    text = text.replace(/\\sin/g, 'sin');
    text = text.replace(/\\cos/g, 'cos');
    text = text.replace(/\\tan/g, 'tan');
    
    // 处理对数
    text = text.replace(/\\ln/g, 'log'); // math.js log 是自然对数
    // 处理 \log (默认为 log10)，但要小心 \log_{base}
    // 如果是 \log 后面没有 _，则替换为 log10
    text = text.replace(/\\log(?!_)/g, 'log10'); 
    // 如果是 \log_，暂时保留，让后续循环处理结构，或者 math.js 可能不支持 log_b 语法
    // math.js 支持 log(x, base)。我们需要将 \log_{b}(x) 转换为 log(x, b)
    // 这比较复杂，因为 b 和 x 可能是复杂表达式。
    // 暂时只支持简单的 log10，如果用户输入 log_2(x)，可能需要手动调整或更复杂的解析。
    
    // 2. 循环处理嵌套结构 (\sqrt, \frac, \left...\right, ^{...})
    // 使用一个循环反复处理，直到没有变化，这样可以支持任意深度的嵌套
    let oldText = '';
    let loopCount = 0;
    while (text !== oldText && loopCount < 50) {
        oldText = text;
        loopCount++;

        // 处理 \left( ... \right) -> ( ... )
        text = text.replace(/\\left\(/g, '(');
        text = text.replace(/\\right\)/g, ')');
        text = text.replace(/\\left/g, ''); 
        text = text.replace(/\\right/g, '');

        // 处理 \sqrt{...} -> sqrt(...)
        // 匹配最内层的 sqrt (不包含其他花括号的)
        text = text.replace(/\\sqrt{([^{}]*)}/g, 'sqrt($1)');
        
        // 处理 \frac{a}{b} -> (a)/(b)
        // 匹配最内层的 frac
        text = text.replace(/\\frac{([^{}]*)}{([^{}]*)}/g, '($1)/($2)');

        // 处理上标 ^{...} -> ^(...)
        text = text.replace(/\^{([^{}]*)}/g, '^($1)');
        
        // 处理下标 _{...} -> _(...) (主要用于变量名或 log_b)
        // text = text.replace(/_\{([^{}]*)\}/g, '_($1)');
    }

    // 3. 后处理
    text = text.replace(/\^([0-9])/g, '^$1'); // 处理简单的 x^2

    // 4. 处理隐式乘法 (xy -> x*y, 2x -> 2*x)
    // 注意：要避免破坏函数名 (如 sin, cos, log, sqrt) 和变量名
    // 策略：只处理明确的单字母变量 x, y, z 之间的组合
    
    // 处理 x, y, z 之间的隐式乘法 (如 xy, yz, zx, xyz)
    let implicitLoop = 0;
    while (/[xyz][xyz]/.test(text) && implicitLoop < 5) {
        text = text.replace(/([xyz])([xyz])/g, '$1*$2');
        implicitLoop++;
    }
    
    // 处理数字紧跟变量 (如 2x -> 2*x)
    text = text.replace(/(\d)([xyz])/g, '$1*$2');
    
    // 处理 e 的隐式乘法 (如 ex -> e*x)
    // 注意：e 可能是变量也可能是常数，这里假设是常数 e
    // 但要小心不要破坏单词，比如 theta, sec, etc.
    // 简单的处理：如果 e 后面紧跟 x, y, z
    text = text.replace(/e([xyz])/g, 'e*$1');
    text = text.replace(/([xyz])e/g, '$1*e');

    // 5. 清理剩余的 LaTeX 符号 (花括号和反斜杠)
    text = text.replace(/[{}]/g, ''); 
    text = text.replace(/\\/g, '');   

    return text;
}

// 更新 LaTeX 预览 (不再需要，因为 MathField 本身就是预览)
function updateLatexPreview(id, expression) {
    // 空函数，保留接口以防报错
}

// 渲染图表 (主入口)
function renderPlot() {
    if (state.mode === '2d') {
        render2DPlot();
    } else {
        render3DPlot();
    }
}

// 渲染 2D 图表
function render2DPlot() {
    try {
        const width = plotContainer.clientWidth;
        const height = plotContainer.clientHeight;
        
        // 解析所有函数表达式
        const data = state.functions
            .filter(f => f.expression.trim() !== '')
            .map(f => {
                // 先清除之前的错误
                clearFunctionError(f.id);
                try {
                    // 尝试预解析以捕获语法错误
                    // 注意：parseExpression 内部会处理隐函数转换，所以这里只做基本检查
                    // 如果是隐函数 (包含=)，我们需要先转换成 (lhs)-(rhs) 再检查
                    let exprToCheck = f.expression;
                    if (exprToCheck.includes('=')) {
                        const parts = exprToCheck.split('=');
                        if (parts.length === 2) {
                            exprToCheck = `(${parts[0]}) - (${parts[1]})`;
                        }
                    }
                    // 简单的语法检查
                    math.parse(exprToCheck);
                    
                    const config = parseExpression(f.expression, f.color);
                    return config;
                } catch (err) {
                    setFunctionError(f.id, "语法错误: " + err.message);
                    return null;
                }
            })
            .filter(config => config !== null);

        // 如果没有有效函数，显示一个空的网格
        if (data.length === 0) {
            data.push({ fn: '0', color: 'transparent' }); 
        }

        functionPlot({
            target: '#plot',
            width: width,
            height: height,
            yAxis: { domain: [-10, 10] },
            xAxis: { domain: [-10, 10] },
            grid: true,
            data: data,
            tip: {
                xLine: true,    // 显示垂直辅助线
                yLine: true,    // 显示水平辅助线
                renderer: function (x, y, index) {
                    return `x: ${x.toFixed(3)}, y: ${y.toFixed(3)}`;
                }
            }
        });
    } catch (e) {
        console.error("2D 绘图错误:", e);
        // 这里是全局绘图错误，可能无法归因于特定函数
    }
}

// 渲染 3D 图表
function render3DPlot() {
    if (typeof Plotly === 'undefined') {
        showError("Plotly 库未加载，无法绘制 3D 图形。请检查网络连接。");
        return;
    }

    try {
        const data = [];
        const layout = {
            autosize: true,
            margin: { l: 0, r: 0, b: 0, t: 0 },
            scene: {
                xaxis: { title: 'x' },
                yaxis: { title: 'y' },
                zaxis: { title: 'z' },
                aspectmode: 'cube' // 保持比例
            }
        };

        let hasValidFunction = false;

        state.functions3D.forEach(f => {
            clearFunctionError(f.id); // 清除旧错误
            if (!f.expression.trim()) return;

            // 检查是否为隐函数方程 (包含 =)
            if (f.expression.includes('=')) {
                try {
                    const parts = f.expression.split('=');
                    const lhs = parts[0].trim();
                    const rhs = parts[1].trim();
                    // 构造 f(x,y,z) = lhs - rhs
                    const exprStr = `(${lhs}) - (${rhs})`;
                    const expr = math.compile(exprStr);

                    const xVals = [];
                    const yVals = [];
                    const zVals = [];
                    const values = [];

                    const range = 10; // 扩大范围以支持更多图形
                    const steps = 60; // 增加网格密度以提高平滑度 (原为30)
                    const stepSize = (range * 2) / steps;

                    for (let x = -range; x <= range; x += stepSize) {
                        for (let y = -range; y <= range; y += stepSize) {
                            for (let z = -range; z <= range; z += stepSize) {
                                xVals.push(x);
                                yVals.push(y);
                                zVals.push(z);
                                try {
                                    const val = expr.evaluate({x, y, z});
                                    values.push(typeof val === 'number' ? val : NaN);
                                } catch (e) {
                                    values.push(NaN);
                                }
                            }
                        }
                    }

                    data.push({
                        type: 'isosurface',
                        x: xVals,
                        y: yVals,
                        z: zVals,
                        value: values,
                        isomin: -0.5, // 阈值
                        isomax: 0.5,
                        surface: { show: true, count: 1, fill: 0.8 },
                        slices: { z: { show: false }, y: { show: false }, x: { show: false } },
                        caps: { x: { show: false }, y: { show: false }, z: { show: false } },
                        colorscale: 'Viridis',
                        showscale: false,
                        name: f.expression,
                        opacity: 0.6
                    });
                    hasValidFunction = true;

                } catch (err) {
                    console.error("3D Implicit Error", err);
                    setFunctionError(f.id, `解析错误: ${err.message}`);
                }
            } else {
                // 显式函数 z = f(x, y)
                try {
                    // 使用 math.js 编译表达式
                    const expr = math.compile(f.expression);
                    const xValues = [];
                    const yValues = [];
                    const zValues = [];

                    const step = 0.2; // 减小步长以提高精度 (原为0.5)
                    const range = 10;

                    // 生成网格数据
                    for (let x = -range; x <= range; x += step) {
                        xValues.push(x);
                    }
                    for (let y = -range; y <= range; y += step) {
                        yValues.push(y);
                    }

                    for (let i = 0; i < yValues.length; i++) {
                        const zRow = [];
                        for (let j = 0; j < xValues.length; j++) {
                            const scope = { x: xValues[j], y: yValues[i] };
                            try {
                                const val = expr.evaluate(scope);
                                // 检查是否为复数或非数值
                                if (typeof val === 'number' && !isNaN(val) && isFinite(val)) {
                                    zRow.push(val);
                                } else {
                                    // 尝试处理 math.js 的复数对象或其他类型
                                    if (val && val.re !== undefined) {
                                         // 如果是复数，仅取实部，或者视为无效
                                         zRow.push(null);
                                    } else {
                                         zRow.push(null);
                                    }
                                }
                            } catch (err) {
                                zRow.push(null);
                            }
                        }
                        zValues.push(zRow);
                    }

                    data.push({
                        type: 'surface',
                        x: xValues,
                        y: yValues,
                        z: zValues,
                        colorscale: 'Viridis',
                        name: f.expression,
                        showscale: false,
                        opacity: 0.8
                    });
                    hasValidFunction = true;

                } catch (err) {
                    console.error("3D 表达式解析错误:", err);
                    setFunctionError(f.id, `解析错误: ${err.message}`);
                }
            }
        });

        if (hasValidFunction) {
            Plotly.newPlot('plot', data, layout, { responsive: true, scrollZoom: true });
            clearError();
        } else {
             // 如果没有有效函数，显示空坐标轴
             Plotly.newPlot('plot', [], layout, { responsive: true, scrollZoom: true });
        }

    } catch (e) {
        console.error("3D 绘图错误:", e);
        showError(`绘图错误: ${e.message}`);
    }
}

function showError(msg) {
    let errEl = document.getElementById('error-msg');
    if (!errEl) {
        errEl = document.createElement('div');
        errEl.id = 'error-msg';
        errEl.style.position = 'absolute';
        errEl.style.top = '10px';
        errEl.style.right = '10px';
        errEl.style.backgroundColor = 'rgba(255, 0, 0, 0.8)';
        errEl.style.color = 'white';
        errEl.style.padding = '10px';
        errEl.style.borderRadius = '5px';
        errEl.style.zIndex = '1000';
        document.body.appendChild(errEl);
    }
    errEl.textContent = msg;
    errEl.style.display = 'block';
}

function clearError() {
    const errEl = document.getElementById('error-msg');
    if (errEl) {
        errEl.style.display = 'none';
    }
}

// 导出图片功能
function exportPlotImage() {
    const width = 800;
    const height = 600;
    const canvas = document.createElement('canvas');
    canvas.width = width;
    canvas.height = height;
    const ctx = canvas.getContext('2d');

    // 填充白色背景
    ctx.fillStyle = '#ffffff';
    ctx.fillRect(0, 0, width, height);

    // 绘制标题和函数列表
    ctx.fillStyle = '#333333';
    ctx.font = 'bold 20px Arial';
    ctx.fillText('GraphPlot Export', 20, 30);

    let textY = 60;
    ctx.font = '16px Arial';
    const currentList = getCurrentFunctions();
    currentList.forEach((f, i) => {
        if (f.expression) {
            ctx.fillStyle = f.color;
            ctx.fillText(`${state.mode === '2d' ? 'f' : 'z'}${i+1}: ${f.expression}`, 20, textY);
            textY += 25;
        }
    });

    // 预留给图表的区域
    const plotY = textY + 10;
    const plotHeight = height - plotY - 20;

    if (state.mode === '3d') {
        // 3D 导出 (使用 Plotly.toImage)
        Plotly.toImage(plotContainer, {format: 'png', width: width - 40, height: plotHeight})
            .then(function(dataUrl) {
                const img = new Image();
                img.onload = function() {
                    ctx.drawImage(img, 20, plotY);
                    downloadCanvas(canvas);
                };
                img.src = dataUrl;
            })
            .catch(function(err) {
                console.error('3D Export Error:', err);
                alert('导出失败: ' + err.message);
            });
    } else {
        // 2D 导出 (SVG 转 Canvas)
        const svg = plotContainer.querySelector('svg');
        if (svg) {
            const svgData = new XMLSerializer().serializeToString(svg);
            const svgBlob = new Blob([svgData], {type: 'image/svg+xml;charset=utf-8'});
            const url = URL.createObjectURL(svgBlob);
            
            const img = new Image();
            img.onload = function() {
                // 保持比例绘制
                const scale = Math.min((width - 40) / img.width, plotHeight / img.height);
                const w = img.width * scale;
                const h = img.height * scale;
                ctx.drawImage(img, 20, plotY, w, h);
                URL.revokeObjectURL(url);
                downloadCanvas(canvas);
            };
            img.src = url;
        } else {
            alert('未找到图表');
        }
    }
}

function downloadCanvas(canvas) {
    const link = document.createElement('a');
    link.download = `graph_export_${new Date().getTime()}.png`;
    link.href = canvas.toDataURL('image/png');
    link.click();
}

// 解析表达式类型 (2D)
function parseExpression(input, color) {
    input = input.trim();
    if (!input) return null;

    // 1. 参数方程 (Parametric): "cos(t), sin(t)"
    if (input.includes(',')) {
        const parts = input.split(',').map(p => p.trim());
        if (parts.length === 2) {
            let xExpr = parts[0].replace(/^x\s*=\s*/i, '');
            let yExpr = parts[1].replace(/^y\s*=\s*/i, '');
            
            return {
                fnType: 'parametric',
                graphType: 'polyline',
                x: xExpr,
                y: yExpr,
                color: color,
                range: [0, 2 * Math.PI],
                nSamples: 500
            };
        }
    }

    // 2. 极坐标 (Polar): "r = ..." 或包含 "theta"
    if (input.toLowerCase().startsWith('r') || input.toLowerCase().includes('theta')) {
        let isPolar = false;
        let expr = input;
        
        if (expr.toLowerCase().replace(/\s/g, '').startsWith('r=')) {
            expr = expr.split('=')[1].trim();
            isPolar = true;
        } else if (expr.toLowerCase().includes('theta')) {
            isPolar = true;
        }

        if (isPolar) {
            return {
                fnType: 'polar',
                graphType: 'polyline',
                r: expr,
                color: color,
                range: [0, 2 * Math.PI],
                nSamples: 500
            };
        }
    }

    // 3. 隐函数 (Implicit): "x^2 + y^2 = 1"
    if (input.includes('=')) {
        const parts = input.split('=');
        if (parts.length === 2) {
            const lhs = parts[0].trim();
            const rhs = parts[1].trim();
            return {
                fnType: 'implicit',
                fn: `(${lhs}) - (${rhs})`,
                color: color
            };
        }
    }

    // 4. 普通函数 (Explicit)
    let expr = input;
    expr = expr.replace(/^(y|f\(x\))\s*=\s*/i, '');

    const compiledExpr = math.compile(expr);

    return {
        fn: function (scope) {
            try {
                const xValue = typeof scope === 'object' && scope !== null ? scope.x : scope;
                return compiledExpr.evaluate({ x: xValue });
            } catch (err) {
                return NaN;
            }
        },
        color: color,
        graphType: 'polyline',
        nSamples: 500
    };
}

// 启动应用
init();
