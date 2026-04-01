class AsyncRequestQueue {
    constructor() {
        this.clickQueue = [];           // 点击事件队列
        this.dataQueue = [];            // 返回数据队列
        this.results = [];              // 最终结果数组
        this.currentRequestId = 0;      // 当前请求ID
        this.expectedRequestId = 0;     // 期望的请求ID
        this.pendingRequests = new Map(); // 正在进行的请求
        this.onUpdateCallback = null;   // 更新回调函数
    }

    /**
     * 处理按钮点击
     * @param {string} buttonId - 按钮标识
     * @param {Function} asyncRequest - 异步请求函数
     * @returns {boolean} - 是否成功发起请求
     */
    handleButtonClick(buttonId, asyncRequest) {
        // 检查是否有重复请求
        if (this.pendingRequests.has(buttonId)) {
            console.log(`按钮 ${buttonId} 请求正在进行中，忽略重复点击`);
            return false;
        }

        const requestId = this.currentRequestId++;
        
        // 标记请求进行中
        this.pendingRequests.set(buttonId, requestId);
        
        // 记录点击事件
        this.clickQueue.push({
            id: requestId,
            buttonId: buttonId,
            timestamp: Date.now()
        });

        // 执行异步请求
        asyncRequest()
            .then(data => this.handleRequestComplete(requestId, buttonId, data))
            .catch(error => this.handleRequestComplete(requestId, buttonId, { error: error.message }));

        return true;
    }

    /**
     * 处理请求完成
     */
    handleRequestComplete(requestId, buttonId, data) {
        // 移除进行中标记
        this.pendingRequests.delete(buttonId);
        
        // 将返回数据加入队列
        this.dataQueue.push({
            id: requestId,
            buttonId: buttonId,
            data: data,
            completedAt: Date.now()
        });
        
        // 处理队列
        this.processQueue();
    }

    /**
     * 按顺序处理队列
     */
    processQueue() {
        // 按请求ID排序
        this.dataQueue.sort((a, b) => a.id - b.id);
        
        // 按顺序处理可以处理的数据
        while (this.dataQueue.length > 0 && this.dataQueue[0].id === this.expectedRequestId) {
            const completedRequest = this.dataQueue.shift();
            
            // 存储到结果数组
            this.results.push({
                buttonId: completedRequest.buttonId,
                data: completedRequest.data,
                processedAt: Date.now()
            });
            
            this.expectedRequestId++;
            
            // 触发更新
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
     * 设置更新回调
     */
    setUpdateCallback(callback) {
        this.onUpdateCallback = callback;
    }

    /**
     * 检查按钮是否有请求在进行中
     */
    isButtonPending(buttonId) {
        return this.pendingRequests.has(buttonId);
    }

    /**
     * 获取当前结果
     */
    getResults() {
        return [...this.results];
    }

    /**
     * 清空所有状态
     */
    clear() {
        this.clickQueue = [];
        this.dataQueue = [];
        this.results = [];
        this.currentRequestId = 0;
        this.expectedRequestId = 0;
        this.pendingRequests.clear();
    }
}

// 使用示例
class App {
    constructor() {
        this.queue = new AsyncRequestQueue();
        this.setup();
    }

    setup() {
        // 设置更新回调
        this.queue.setUpdateCallback((results) => {
            this.updateUI(results);
        });

        // 创建按钮
        this.createButtons();
    }

    createButtons() {
        // 伪代码：创建按钮
        for (let i = 1; i <= 5; i++) {
            // 伪代码：创建按钮元素
            const button = this.createButtonElement(i);
            
            // 绑定点击事件
            button.onclick = () => this.handleButtonClick(i);
        }
    }

    createButtonElement(buttonId) {
        // 伪代码：创建按钮
        // 实际实现中这里会创建真实的DOM元素
        return {
            onclick: null,
            textContent: `按钮 ${buttonId}`,
            disabled: false
        };
    }

    handleButtonClick(buttonId) {
        // 检查重复点击
        if (this.queue.isButtonPending(buttonId)) {
            console.log(`按钮 ${buttonId} 正在处理中，请等待完成`);
            return;
        }

        // 模拟异步请求
        const asyncRequest = () => {
            const delay = Math.random() * 2000 + 500;
            return new Promise(resolve => {
                setTimeout(() => {
                    resolve({
                        button: buttonId,
                        timestamp: Date.now(),
                        data: `按钮 ${buttonId} 的响应数据`
                    });
                }, delay);
            });
        };

        // 发起请求
        this.queue.handleButtonClick(buttonId, asyncRequest);
    }

    updateUI(results) {
        // 伪代码：更新界面
        console.log('更新界面:', results);
        
        // 实际实现中这里会更新canvas或显示结果
        // 例如：更新canvas画面、显示处理日志等
    }
}

// 使用示例
// const app = new App();

// 导出模块
if (typeof module !== 'undefined' && module.exports) {
    module.exports = { AsyncRequestQueue, App };
}