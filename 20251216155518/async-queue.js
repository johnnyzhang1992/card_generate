class AsyncRequestQueue {
    constructor() {
        // 存储点击事件的队列
        this.clickQueue = [];
        // 存储返回数据的队列
        this.dataQueue = [];
        // 存储最终结果
        this.results = [];
        // 当前处理的请求ID
        this.currentRequestId = 0;
        // 下一个期望的请求ID
        this.expectedRequestId = 0;
        // 回调函数，用于界面更新
        this.onUpdateCallback = null;
        // 存储正在进行的请求
        this.pendingRequests = new Map();
    }

    /**
     * 注册按钮点击事件
     * @param {string} buttonId - 按钮标识
     * @param {Function} asyncRequest - 异步请求函数，返回Promise
     * @returns {boolean} 是否成功发起请求
     */
    handleButtonClick(buttonId, asyncRequest) {
        // 检查该按钮是否已经有请求在进行中
        if (this.pendingRequests.has(buttonId)) {
            console.log(`按钮 ${buttonId} 的请求正在进行中，忽略重复点击`);
            return false;
        }
        
        const requestId = this.currentRequestId++;
        
        console.log(`按钮 ${buttonId} 被点击，请求ID: ${requestId}`);
        
        // 标记该按钮的请求正在进行中
        this.pendingRequests.set(buttonId, requestId);
        
        // 将点击事件加入队列
        this.clickQueue.push({
            id: requestId,
            buttonId: buttonId,
            timestamp: Date.now()
        });
        
        // 执行异步请求
        asyncRequest().then(data => {
            this.handleRequestComplete(requestId, buttonId, data);
        }).catch(error => {
            this.handleRequestComplete(requestId, buttonId, { error: error.message });
        });
        
        return true;
    }

    /**
     * 处理请求完成
     */
    handleRequestComplete(requestId, buttonId, data) {
        console.log(`请求 ${requestId} (按钮 ${buttonId}) 完成，数据:`, data);
        
        // 移除该按钮的进行中标记
        this.pendingRequests.delete(buttonId);
        
        // 将返回数据加入数据队列
        this.dataQueue.push({
            id: requestId,
            buttonId: buttonId,
            data: data,
            completedAt: Date.now()
        });
        
        // 尝试处理队列
        this.processQueue();
    }

    /**
     * 处理队列，确保按点击顺序存储数据
     */
    processQueue() {
        // 按请求ID排序数据队列
        this.dataQueue.sort((a, b) => a.id - b.id);
        
        // 处理所有可以按顺序处理的数据
        while (this.dataQueue.length > 0 && this.dataQueue[0].id === this.expectedRequestId) {
            const completedRequest = this.dataQueue.shift();
            
            // 将数据按顺序存储到结果数组中
            this.results.push({
                buttonId: completedRequest.buttonId,
                data: completedRequest.data,
                processedAt: Date.now()
            });
            
            console.log(`按顺序处理请求 ${completedRequest.id}，当前结果数量: ${this.results.length}`);
            
            this.expectedRequestId++;
            
            // 触发界面更新
            this.triggerUpdate();
        }
    }

    /**
     * 触发界面更新
     */
    triggerUpdate() {
        if (this.onUpdateCallback) {
            this.onUpdateCallback([...this.results]);
        }
    }

    /**
     * 设置界面更新回调
     */
    setUpdateCallback(callback) {
        this.onUpdateCallback = callback;
    }

    /**
     * 获取当前结果
     */
    getResults() {
        return [...this.results];
    }

    /**
     * 清空队列和结果
     */
    clear() {
        this.clickQueue = [];
        this.dataQueue = [];
        this.results = [];
        this.currentRequestId = 0;
        this.expectedRequestId = 0;
        this.pendingRequests.clear();
    }

    /**
     * 检查按钮是否有请求正在进行中
     */
    isButtonPending(buttonId) {
        return this.pendingRequests.has(buttonId);
    }
}

// 示例使用
class ButtonManager {
    constructor() {
        this.queue = new AsyncRequestQueue();
        this.buttons = new Map(); // 存储按钮元素和状态
        this.setupEventListeners();
        this.setupUI();
    }

    setupEventListeners() {
        // 设置界面更新回调
        this.queue.setUpdateCallback((results) => {
            this.updateCanvas(results);
            this.updateLog(results);
        });
    }

    setupUI() {
        // 创建按钮和界面
        this.createButtons();
        this.createCanvas();
        this.createLog();
    }

    createButtons() {
        const container = document.createElement('div');
        container.style.cssText = `
            position: fixed;
            top: 20px;
            right: 20px;
            display: flex;
            gap: 10px;
            z-index: 1000;
        `;

        // 创建多个按钮
        for (let i = 1; i <= 5; i++) {
            const button = document.createElement('button');
            button.textContent = `按钮 ${i}`;
            button.style.cssText = `
                padding: 10px 20px;
                background: #007bff;
                color: white;
                border: none;
                border-radius: 5px;
                cursor: pointer;
                transition: all 0.3s ease;
            `;
            
            button.onclick = () => this.handleButtonClick(i);
            container.appendChild(button);
            
            // 存储按钮元素
            this.buttons.set(i, button);
        }

        // 清空按钮
        const clearButton = document.createElement('button');
        clearButton.textContent = '清空';
        clearButton.style.cssText = `
            padding: 10px 20px;
            background: #dc3545;
            color: white;
            border: none;
            border-radius: 5px;
            cursor: pointer;
        `;
        clearButton.onclick = () => this.clearResults();
        container.appendChild(clearButton);

        document.body.appendChild(container);
    }

    createCanvas() {
        const canvas = document.createElement('canvas');
        canvas.width = 800;
        canvas.height = 400;
        canvas.style.cssText = `
            border: 1px solid #ccc;
            margin: 20px;
            display: block;
        `;
        this.canvas = canvas;
        this.ctx = canvas.getContext('2d');
        document.body.appendChild(canvas);
    }

    createLog() {
        const log = document.createElement('div');
        log.style.cssText = `
            margin: 20px;
            padding: 10px;
            border: 1px solid #ccc;
            height: 200px;
            overflow-y: auto;
            font-family: monospace;
        `;
        this.log = log;
        document.body.appendChild(log);
    }

    handleButtonClick(buttonId) {
        const button = this.buttons.get(buttonId);
        
        // 检查是否已经有请求在进行中
        if (this.queue.isButtonPending(buttonId)) {
            console.log(`按钮 ${buttonId} 的请求正在进行中，忽略重复点击`);
            
            // 添加视觉反馈
            this.showButtonFeedback(button, 'pending');
            setTimeout(() => {
                this.resetButtonStyle(button);
            }, 300);
            return;
        }

        // 更新按钮状态为进行中
        this.updateButtonState(buttonId, 'pending');

        // 模拟异步请求，随机延迟
        const asyncRequest = () => {
            const delay = Math.random() * 2000 + 500; // 500ms - 2500ms随机延迟
            return new Promise(resolve => {
                setTimeout(() => {
                    resolve({
                        button: buttonId,
                        timestamp: Date.now(),
                        data: `按钮 ${buttonId} 的数据`,
                        delay: delay
                    });
                }, delay);
            });
        };

        // 发起请求
        const requestStarted = this.queue.handleButtonClick(buttonId, asyncRequest);
        
        if (requestStarted) {
            console.log(`按钮 ${buttonId} 请求已发起`);
        } else {
            // 如果请求未能发起，重置按钮状态
            this.updateButtonState(buttonId, 'idle');
        }
    }

    /**
     * 更新按钮状态
     */
    updateButtonState(buttonId, state) {
        const button = this.buttons.get(buttonId);
        if (!button) return;

        this.resetButtonStyle(button);

        switch (state) {
            case 'pending':
                button.style.background = '#6c757d';
                button.style.cursor = 'not-allowed';
                button.textContent = `按钮 ${buttonId} (请求中...)`;
                break;
            case 'idle':
            default:
                button.style.background = '#007bff';
                button.style.cursor = 'pointer';
                button.textContent = `按钮 ${buttonId}`;
                break;
        }
    }

    /**
     * 显示按钮反馈
     */
    showButtonFeedback(button, type) {
        const originalBackground = button.style.background;
        
        switch (type) {
            case 'pending':
                button.style.background = '#ffc107';
                break;
        }
        
        // 短暂显示后恢复
        setTimeout(() => {
            button.style.background = originalBackground;
        }, 300);
    }

    /**
     * 重置按钮样式
     */
    resetButtonStyle(button) {
        if (this.queue.isButtonPending(parseInt(button.textContent.match(/\d+/)[0]))) {
            // 如果按钮仍有请求在进行中，保持pending状态
            return;
        }
        
        button.style.background = '#007bff';
        button.style.cursor = 'pointer';
        button.textContent = button.textContent.replace(/ \(请求中\.\.\.\)/, '');
    }

    updateCanvas(results) {
        const ctx = this.ctx;
        const width = this.canvas.width;
        const height = this.canvas.height;

        // 清空画布
        ctx.clearRect(0, 0, width, height);

        // 绘制背景
        ctx.fillStyle = '#f0f0f0';
        ctx.fillRect(0, 0, width, height);

        // 绘制结果
        const barWidth = 60;
        const barSpacing = 20;
        const startX = 50;
        const maxBarHeight = height - 100;

        results.forEach((result, index) => {
            const x = startX + index * (barWidth + barSpacing);
            const barHeight = (index + 1) * 20;
            
            // 不同按钮不同颜色
            const colors = ['#007bff', '#28a745', '#ffc107', '#dc3545', '#6f42c1'];
            const color = colors[(result.buttonId - 1) % colors.length];
            
            ctx.fillStyle = color;
            ctx.fillRect(x, height - 50 - barHeight, barWidth, barHeight);
            
            // 绘制标签
            ctx.fillStyle = '#333';
            ctx.font = '14px Arial';
            ctx.fillText(`按钮 ${result.buttonId}`, x, height - 30);
            ctx.fillText(`#${index + 1}`, x + barWidth/2 - 10, height - 50 - barHeight - 10);
        });

        // 绘制标题
        ctx.fillStyle = '#333';
        ctx.font = '16px Arial';
        ctx.fillText(`处理顺序可视化 (${results.length} 个结果)`, 20, 30);
    }

    updateLog(results) {
        this.log.innerHTML = '<h3>处理日志:</h3>';
        
        results.forEach((result, index) => {
            const div = document.createElement('div');
            div.style.cssText = `
                padding: 5px;
                border-bottom: 1px solid #eee;
                color: #666;
            `;
            div.textContent = `#${index + 1}: 按钮 ${result.buttonId} - ${JSON.stringify(result.data)}`;
            this.log.appendChild(div);
        });

        if (results.length === 0) {
            const div = document.createElement('div');
            div.textContent = '暂无数据';
            div.style.color = '#999';
            this.log.appendChild(div);
        }
    }

    clearResults() {
        this.queue.clear();
        this.updateCanvas([]);
        this.updateLog([]);
    }
}

// 页面加载完成后初始化
if (typeof document !== 'undefined') {
    document.addEventListener('DOMContentLoaded', () => {
        new ButtonManager();
    });
}

// 导出模块
if (typeof module !== 'undefined' && module.exports) {
    module.exports = { AsyncRequestQueue, ButtonManager };
}