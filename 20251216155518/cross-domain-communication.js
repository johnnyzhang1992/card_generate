/**
 * 跨域通信桥接系统
 * 支持主页面与iframe、iframe之间的安全通信
 */

class CrossDomainBridge {
    constructor() {
        this.origin = window.location.origin;
        this.allowedDomains = []; // 允许通信的域名白名单
        this.messageHandlers = new Map(); // 消息处理器
        this.pendingRequests = new Map(); // 等待响应的请求
        this.frameMap = new Map(); // iframe映射表
        this.messageCounter = 0; // 消息计数器
        
        // 初始化消息监听
        this.setupMessageListener();
    }

    /**
     * 设置允许通信的域名白名单
     */
    setAllowedDomains(domains) {
        this.allowedDomains = domains.map(domain => {
            try {
                return new URL(domain).origin;
            } catch {
                return domain;
            }
        });
    }

    /**
     * 注册iframe
     */
    registerFrame(frameId, frameElement) {
        this.frameMap.set(frameId, {
            element: frameElement,
            origin: this.getFrameOrigin(frameElement)
        });
    }

    /**
     * 获取iframe的origin
     */
    getFrameOrigin(frameElement) {
        try {
            return new URL(frameElement.src).origin;
        } catch {
            return '*'; // 如果无法获取origin，使用通配符
        }
    }

    /**
     * 设置消息监听器
     */
    setupMessageListener() {
        window.addEventListener('message', (event) => {
            this.handleIncomingMessage(event);
        });
    }

    /**
     * 处理接收到的消息
     */
    handleIncomingMessage(event) {
        // 安全检查：验证来源
        if (!this.isAllowedOrigin(event.origin)) {
            console.warn('收到来自未授权域名的消息:', event.origin);
            return;
        }

        try {
            // 解密消息
            const message = this.decryptMessage(event.data);
            
            if (!this.isValidMessage(message)) {
                console.warn('收到无效消息格式');
                return;
            }

            console.log(`收到来自 ${message.from} 的消息:`, message);

            // 根据消息类型处理
            this.processMessage(message, event.origin);

        } catch (error) {
            console.error('消息处理错误:', error);
        }
    }

    /**
     * 验证消息来源是否允许
     */
    isAllowedOrigin(origin) {
        return this.allowedDomains.includes(origin) || this.allowedDomains.includes('*');
    }

    /**
     * 验证消息格式
     */
    isValidMessage(message) {
        return message && 
               typeof message === 'object' &&
               message.type && 
               message.from &&
               message.timestamp;
    }

    /**
     * 处理消息
     */
    processMessage(message, origin) {
        const { type, requestId, from, to, data } = message;

        switch (type) {
            case 'request':
                this.handleRequest(message, origin);
                break;
            
            case 'response':
                this.handleResponse(message);
                break;
            
            case 'forward':
                this.handleForward(message, origin);
                break;
            
            default:
                console.warn('未知消息类型:', type);
        }
    }

    /**
     * 处理请求消息
     */
    handleRequest(message, origin) {
        const { requestId, from, to, data, command } = message;

        // 检查是否是发给自己的消息
        if (to === 'main' || to === this.origin) {
            this.executeCommand(command, data, from, requestId, origin);
        } else {
            // 转发给目标iframe
            this.forwardMessage(message, to);
        }
    }

    /**
     * 处理响应消息
     */
    handleResponse(message) {
        const { requestId, from, data } = message;
        
        // 查找对应的等待请求
        const pendingRequest = this.pendingRequests.get(requestId);
        if (pendingRequest) {
            pendingRequest.resolve({
                success: true,
                data: data,
                from: from,
                requestId: requestId
            });
            this.pendingRequests.delete(requestId);
        }
    }

    /**
     * 处理转发消息
     */
    handleForward(message, origin) {
        const { target, originalMessage } = message;
        
        // 重新封装并发送给目标
        this.sendToFrame(target, {
            ...originalMessage,
            via: origin // 记录中转方
        });
    }

    /**
     * 转发消息
     */
    forwardMessage(message, targetFrameId) {
        const frameInfo = this.frameMap.get(targetFrameId);
        if (!frameInfo) {
            console.error(`目标iframe未注册: ${targetFrameId}`);
            return;
        }

        // 创建转发消息
        const forwardMessage = this.createMessage('forward', targetFrameId, {
            target: targetFrameId,
            originalMessage: message
        });

        // 发送给目标iframe
        this.sendToFrame(targetFrameId, forwardMessage);
    }

    /**
     * 执行命令
     */
    executeCommand(command, data, from, requestId, origin) {
        const handler = this.messageHandlers.get(command);
        
        if (handler) {
            try {
                const result = handler(data, {
                    from: from,
                    origin: origin,
                    requestId: requestId
                });

                // 发送响应
                this.sendResponse(from, requestId, {
                    success: true,
                    result: result
                });

            } catch (error) {
                this.sendResponse(from, requestId, {
                    success: false,
                    error: error.message
                });
            }
        } else {
            console.warn(`未找到命令处理器: ${command}`);
            this.sendResponse(from, requestId, {
                success: false,
                error: `命令未注册: ${command}`
            });
        }
    }

    /**
     * 注册消息处理器
     */
    registerHandler(command, handler) {
        this.messageHandlers.set(command, handler);
    }

    /**
     * 发送消息到iframe
     */
    sendToFrame(frameId, message) {
        const frameInfo = this.frameMap.get(frameId);
        if (!frameInfo) {
            throw new Error(`iframe未注册: ${frameId}`);
        }

        const encryptedMessage = this.encryptMessage(message);
        frameInfo.element.contentWindow.postMessage(encryptedMessage, frameInfo.origin);
    }

    /**
     * 发送响应
     */
    sendResponse(to, requestId, data) {
        const responseMessage = this.createMessage('response', to, data, requestId);
        
        if (to === 'main') {
            // 发送给主页面（自己）
            window.postMessage(this.encryptMessage(responseMessage), this.origin);
        } else {
            // 发送给iframe
            this.sendToFrame(to, responseMessage);
        }
    }

    /**
     * 创建消息
     */
    createMessage(type, to, data, requestId = null) {
        const messageId = this.messageCounter++;
        
        return {
            type: type,
            requestId: requestId || `msg_${messageId}_${Date.now()}`,
            from: this.origin === window.location.origin ? 'main' : this.getFrameId(),
            to: to,
            data: data,
            timestamp: Date.now(),
            version: '1.0'
        };
    }

    /**
     * 获取当前frame的ID（iframe内使用）
     */
    getFrameId() {
        // 在iframe中，可以通过window.name或其他方式识别自己
        return window.name || 'unknown_frame';
    }

    /**
     * 加密消息（Base64）
     */
    encryptMessage(message) {
        const jsonString = JSON.stringify(message);
        return btoa(unescape(encodeURIComponent(jsonString)));
    }

    /**
     * 解密消息（Base64）
     */
    decryptMessage(encryptedMessage) {
        try {
            const jsonString = decodeURIComponent(escape(atob(encryptedMessage)));
            return JSON.parse(jsonString);
        } catch (error) {
            throw new Error('消息解密失败');
        }
    }

    /**
     * 发送命令到iframe
     */
    async sendCommand(frameId, command, data = {}) {
        return new Promise((resolve, reject) => {
            const requestId = `cmd_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
            
            // 创建请求消息
            const requestMessage = this.createMessage('request', frameId, data, requestId);
            requestMessage.command = command;
            
            // 存储等待响应的请求
            this.pendingRequests.set(requestId, { resolve, reject });
            
            // 发送消息
            try {
                this.sendToFrame(frameId, requestMessage);
                
                // 设置超时
                setTimeout(() => {
                    if (this.pendingRequests.has(requestId)) {
                        this.pendingRequests.delete(requestId);
                        reject(new Error('请求超时'));
                    }
                }, 10000); // 10秒超时
                
            } catch (error) {
                this.pendingRequests.delete(requestId);
                reject(error);
            }
        });
    }
}

// ==================== 主页面实现 ====================

class MainPageBridge extends CrossDomainBridge {
    constructor() {
        super();
        this.setupMainPage();
    }

    setupMainPage() {
        // 设置允许的域名（示例）
        this.setAllowedDomains([
            'https://saas-service1.com',
            'https://saas-service2.com', 
            'https://saas-service3.com',
            window.location.origin // 允许自己
        ]);

        // 注册命令处理器
        this.registerHandler('console_log', (data, metadata) => {
            console.log(`主页面执行命令: ${data.message}`);
            return { executed: true, message: data.message };
        });

        // 设置测试按钮
        this.setupTestButtons();
    }

    setupTestButtons() {
        // 伪代码：创建测试按钮
        const button1 = this.createButton('通知iframe1', () => {
            this.testScenario1();
        });
        
        document.body.appendChild(button1);
    }

    createButton(text, onClick) {
        const button = document.createElement('button');
        button.textContent = text;
        button.onclick = onClick;
        button.style.margin = '10px';
        button.style.padding = '10px 20px';
        return button;
    }

    /**
     * 测试场景1：主页面通知iframe1
     */
    async testScenario1() {
        try {
            const messageKey = `msg_${Date.now()}`;
            const messageContent = `主页面消息内容 ${messageKey}`;
            
            console.log(`主页面发送消息到iframe1，Key: ${messageKey}`);
            
            const result = await this.sendCommand('iframe1', 'console_log', {
                message: `iframe1 收到来自主页面的消息：{${messageContent}}`,
                key: messageKey
            });
            
            console.log(`iframe1 已成功执行命令：{${messageKey}}`);
            
        } catch (error) {
            console.error('场景1执行失败:', error);
        }
    }
}

// ==================== iframe实现 ====================

class IframeBridge extends CrossDomainBridge {
    constructor(frameId) {
        super();
        this.frameId = frameId;
        this.setupIframe();
    }

    setupIframe() {
        // 设置允许的域名
        this.setAllowedDomains([
            window.parent.location.origin, // 允许父页面
            window.location.origin // 允许自己
        ]);

        // 注册命令处理器
        this.registerHandler('console_log', (data, metadata) => {
            const viaInfo = metadata.via ? `，从${metadata.via}中转` : '';
            console.log(`${this.frameId} ${data.message}${viaInfo}`);
            return { 
                executed: true, 
                message: data.message,
                key: data.key 
            };
        });

        // 设置iframe内部按钮
        this.setupIframeButtons();
    }

    setupIframeButtons() {
        // 伪代码：在iframe内创建按钮
        if (this.frameId === 'iframe2') {
            const button = this.createButton('通知iframe3', () => {
                this.testScenario2();
            });
            
            document.body.appendChild(button);
        }
    }

    createButton(text, onClick) {
        const button = document.createElement('button');
        button.textContent = text;
        button.onclick = onClick;
        button.style.margin = '10px';
        button.style.padding = '10px 20px';
        return button;
    }

    /**
     * 测试场景2：iframe2通知iframe3
     */
    async testScenario2() {
        try {
            const messageKey = `msg_${Date.now()}`;
            const messageContent = `iframe2消息内容 ${messageKey}`;
            
            console.log(`iframe2发送消息到iframe3，Key: ${messageKey}`);
            
            // 通过主页面中转
            const result = await this.sendCommand('iframe3', 'console_log', {
                message: `iframe3 收到来自 iframe2 的消息：{${messageContent}}`,
                key: messageKey
            });
            
            console.log(`iframe3 已成功执行命令：{${messageKey}}，从${window.parent.location.host}中转`);
            
        } catch (error) {
            console.error('场景2执行失败:', error);
        }
    }

    /**
     * 重写发送命令方法，通过主页面中转
     */
    async sendCommand(targetFrameId, command, data = {}) {
        // 如果目标不是主页面，需要通过主页面中转
        if (targetFrameId !== 'main') {
            // 创建中转请求
            const forwardMessage = this.createMessage('request', 'main', {
                target: targetFrameId,
                command: command,
                data: data
            });
            
            // 发送给主页面
            return await super.sendCommand('main', 'forward_request', {
                target: targetFrameId,
                originalMessage: forwardMessage
            });
        }
        
        return await super.sendCommand(targetFrameId, command, data);
    }
}

// ==================== 使用示例 ====================

// 主页面初始化
if (window === window.top) {
    // 这是主页面
    const mainBridge = new MainPageBridge();
    
    // 注册iframe（在实际使用中，需要在iframe加载完成后注册）
    window.addEventListener('load', () => {
        const iframe1 = document.getElementById('iframe1');
        const iframe2 = document.getElementById('iframe2');
        const iframe3 = document.getElementById('iframe3');
        
        if (iframe1) mainBridge.registerFrame('iframe1', iframe1);
        if (iframe2) mainBridge.registerFrame('iframe2', iframe2);
        if (iframe3) mainBridge.registerFrame('iframe3', iframe3);
    });
    
    window.mainBridge = mainBridge;
}

// iframe初始化
if (window !== window.top) {
    // 这是在iframe中
    const frameId = window.name || 'unknown_frame';
    const iframeBridge = new IframeBridge(frameId);
    window.iframeBridge = iframeBridge;
}

// 导出模块
if (typeof module !== 'undefined' && module.exports) {
    module.exports = { CrossDomainBridge, MainPageBridge, IframeBridge };
}