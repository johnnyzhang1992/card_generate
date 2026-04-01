/**
 * 下载管理器
 * 支持单个下载和批量下载，包含并发控制和进度展示
 */

class DownloadManager {
    constructor() {
        this.downloadQueue = [];           // 下载队列
        this.activeDownloads = new Map();  // 正在进行的下载任务
        this.maxConcurrent = 5;            // 最大并发数
        this.isPaused = false;             // 是否暂停
        this.currentBatchId = null;        // 当前批量下载ID
        this.progressCallbacks = new Map(); // 进度回调
        
        // 初始化JSZip（需要引入jszip库）
        this.JSZip = window.JSZip;
    }

    /**
     * 单个文件下载
     * @param {string} url - 文件URL
     * @param {string} filename - 文件名
     * @param {Function} onProgress - 进度回调
     */
    async downloadSingle(url, filename, onProgress = null) {
        const taskId = this.generateTaskId();
        
        const task = {
            id: taskId,
            type: 'single',
            url: url,
            filename: filename,
            status: 'queued',
            progress: 0,
            onProgress: onProgress
        };

        this.downloadQueue.push(task);
        this.processQueue();
        
        return new Promise((resolve, reject) => {
            this.progressCallbacks.set(taskId, { resolve, reject });
        });
    }

    /**
     * 批量文件下载
     * @param {Array} files - 文件数组 [{url, filename}, ...]
     * @param {string} zipName - 压缩包名称
     * @param {Function} onBatchProgress - 批量进度回调
     */
    async downloadBatch(files, zipName = 'download.zip', onBatchProgress = null) {
        const batchId = this.generateTaskId();
        this.currentBatchId = batchId;
        
        const batchTask = {
            id: batchId,
            type: 'batch',
            files: files,
            zipName: zipName,
            status: 'queued',
            progress: 0,
            completed: 0,
            total: files.length,
            onBatchProgress: onBatchProgress,
            fileTasks: []
        };

        // 创建单个文件任务
        for (const file of files) {
            const fileTaskId = this.generateTaskId();
            const fileTask = {
                id: fileTaskId,
                type: 'batch_file',
                batchId: batchId,
                url: file.url,
                filename: file.filename,
                status: 'queued',
                progress: 0
            };
            
            batchTask.fileTasks.push(fileTask);
            this.downloadQueue.push(fileTask);
        }

        this.downloadQueue.push(batchTask);
        this.processQueue();
        
        return new Promise((resolve, reject) => {
            this.progressCallbacks.set(batchId, { resolve, reject });
        });
    }

    /**
     * 处理下载队列
     */
    processQueue() {
        if (this.isPaused) return;
        
        // 检查是否可以开始新的下载
        while (this.activeDownloads.size < this.maxConcurrent && this.downloadQueue.length > 0) {
            const task = this.downloadQueue.shift();
            
            if (task.type === 'batch') {
                // 批量任务需要等待所有文件下载完成
                this.processBatchTask(task);
            } else if (task.type === 'batch_file') {
                // 批量下载中的单个文件
                this.downloadFile(task);
            } else {
                // 单个文件下载
                this.downloadFile(task);
            }
        }
    }

    /**
     * 处理批量下载任务
     */
    processBatchTask(batchTask) {
        // 批量任务本身不进行下载，只监控进度
        batchTask.status = 'processing';
        
        // 检查是否所有文件都已下载完成
        this.checkBatchCompletion(batchTask);
    }

    /**
     * 检查批量任务完成状态
     */
    checkBatchCompletion(batchTask) {
        const completedFiles = batchTask.fileTasks.filter(t => 
            t.status === 'completed' || t.status === 'error'
        ).length;
        
        batchTask.completed = completedFiles;
        batchTask.progress = (completedFiles / batchTask.total) * 100;
        
        // 更新批量进度
        if (batchTask.onBatchProgress) {
            batchTask.onBatchProgress({
                completed: completedFiles,
                total: batchTask.total,
                progress: batchTask.progress
            });
        }
        
        // 如果所有文件都已完成处理
        if (completedFiles === batchTask.total) {
            this.createZipAndDownload(batchTask);
        }
    }

    /**
     * 下载单个文件
     */
    async downloadFile(task) {
        if (this.activeDownloads.has(task.id)) {
            return; // 已经在下载中
        }

        task.status = 'downloading';
        this.activeDownloads.set(task.id, task);

        try {
            const response = await fetch(task.url);
            
            if (!response.ok) {
                throw new Error(`HTTP ${response.status}: ${response.statusText}`);
            }

            const contentLength = response.headers.get('content-length');
            const total = parseInt(contentLength, 10);
            let loaded = 0;

            const reader = response.body.getReader();
            const chunks = [];

            while (true) {
                const { done, value } = await reader.read();
                
                if (done) break;
                
                chunks.push(value);
                loaded += value.length;
                
                // 更新进度
                task.progress = total ? (loaded / total) * 100 : 0;
                
                // 单个文件进度回调
                if (task.onProgress) {
                    task.onProgress(task.progress);
                }
                
                // 批量任务的单个文件进度
                if (task.batchId) {
                    this.updateBatchFileProgress(task.batchId, task.id, task.progress);
                }
            }

            // 合并数据
            const blob = new Blob(chunks);
            
            task.status = 'completed';
            task.blob = blob;
            
            // 单个文件下载完成
            if (task.type === 'single') {
                this.downloadBlob(blob, task.filename);
                this.completeTask(task.id, true, blob);
            }
            
            // 批量文件下载完成
            if (task.batchId) {
                this.checkBatchCompletion(this.getBatchTask(task.batchId));
            }

        } catch (error) {
            console.error(`下载失败: ${task.url}`, error);
            task.status = 'error';
            task.error = error.message;
            
            if (task.type === 'single') {
                this.completeTask(task.id, false, null, error);
            }
            
            if (task.batchId) {
                this.checkBatchCompletion(this.getBatchTask(task.batchId));
            }
        } finally {
            this.activeDownloads.delete(task.id);
            this.processQueue(); // 继续处理队列
        }
    }

    /**
     * 更新批量任务中单个文件的进度
     */
    updateBatchFileProgress(batchId, fileTaskId, progress) {
        const batchTask = this.getBatchTask(batchId);
        if (!batchTask) return;
        
        const fileTask = batchTask.fileTasks.find(t => t.id === fileTaskId);
        if (fileTask) {
            fileTask.progress = progress;
        }
    }

    /**
     * 获取批量任务
     */
    getBatchTask(batchId) {
        return this.downloadQueue.find(t => t.id === batchId && t.type === 'batch') ||
               this.downloadQueue.find(t => t.id === batchId);
    }

    /**
     * 创建ZIP包并下载
     */
    async createZipAndDownload(batchTask) {
        try {
            batchTask.status = 'packaging';
            
            const zip = new this.JSZip();
            
            // 添加所有成功下载的文件到ZIP
            for (const fileTask of batchTask.fileTasks) {
                if (fileTask.status === 'completed' && fileTask.blob) {
                    zip.file(fileTask.filename, fileTask.blob);
                }
            }
            
            // 生成ZIP文件
            const zipBlob = await zip.generateAsync({
                type: 'blob',
                compression: 'DEFLATE',
                compressionOptions: { level: 6 }
            }, (metadata) => {
                // ZIP打包进度
                if (batchTask.onBatchProgress) {
                    batchTask.onBatchProgress({
                        completed: batchTask.completed,
                        total: batchTask.total,
                        progress: 100, // 文件下载已完成，现在是打包阶段
                        packaging: true,
                        packagingProgress: metadata.percent
                    });
                }
            });
            
            // 下载ZIP文件
            this.downloadBlob(zipBlob, batchTask.zipName);
            
            batchTask.status = 'completed';
            this.completeTask(batchTask.id, true, zipBlob);
            
        } catch (error) {
            console.error('创建ZIP包失败:', error);
            batchTask.status = 'error';
            batchTask.error = error.message;
            this.completeTask(batchTask.id, false, null, error);
        }
    }

    /**
     * 下载Blob文件
     */
    downloadBlob(blob, filename) {
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = filename;
        a.style.display = 'none';
        
        document.body.appendChild(a);
        a.click();
        document.body.removeChild(a);
        
        // 清理URL
        setTimeout(() => URL.revokeObjectURL(url), 1000);
    }

    /**
     * 完成任务
     */
    completeTask(taskId, success, result, error = null) {
        const callback = this.progressCallbacks.get(taskId);
        if (callback) {
            if (success) {
                callback.resolve(result);
            } else {
                callback.reject(error || new Error('下载失败'));
            }
            this.progressCallbacks.delete(taskId);
        }
    }

    /**
     * 暂停下载
     */
    pause() {
        this.isPaused = true;
        
        // 停止所有活跃下载
        for (const [taskId, task] of this.activeDownloads) {
            // 实际实现中可能需要中止fetch请求
            task.status = 'paused';
        }
        
        this.activeDownloads.clear();
    }

    /**
     * 继续下载
     */
    resume() {
        this.isPaused = false;
        this.processQueue();
    }

    /**
     * 取消下载
     */
    cancel(taskId = null) {
        if (taskId) {
            // 取消特定任务
            this.removeTaskFromQueue(taskId);
            
            if (this.activeDownloads.has(taskId)) {
                this.activeDownloads.delete(taskId);
            }
            
            // 拒绝Promise
            this.completeTask(taskId, false, null, new Error('下载已取消'));
        } else {
            // 取消所有任务
            this.pause();
            this.downloadQueue = [];
            this.activeDownloads.clear();
            
            // 拒绝所有等待的Promise
            for (const [id, callback] of this.progressCallbacks) {
                callback.reject(new Error('下载已取消'));
            }
            this.progressCallbacks.clear();
        }
    }

    /**
     * 从队列中移除任务
     */
    removeTaskFromQueue(taskId) {
        this.downloadQueue = this.downloadQueue.filter(t => t.id !== taskId);
    }

    /**
     * 生成任务ID
     */
    generateTaskId() {
        return `task_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
    }

    /**
     * 获取下载状态
     */
    getStatus() {
        return {
            queueLength: this.downloadQueue.length,
            activeDownloads: this.activeDownloads.size,
            maxConcurrent: this.maxConcurrent,
            isPaused: this.isPaused,
            currentBatchId: this.currentBatchId
        };
    }

    /**
     * 设置最大并发数
     */
    setMaxConcurrent(max) {
        this.maxConcurrent = Math.max(1, Math.min(max, 10)); // 限制在1-10之间
        this.processQueue(); // 重新处理队列
    }
}

// ==================== UI管理器 ====================

class DownloadUIManager {
    constructor(downloadManager) {
        this.downloadManager = downloadManager;
        this.downloadList = document.getElementById('download-list') || this.createDownloadList();
        this.setupUI();
    }

    /**
     * 创建下载列表容器
     */
    createDownloadList() {
        const container = document.createElement('div');
        container.id = 'download-list';
        container.style.cssText = `
            position: fixed;
            top: 20px;
            right: 20px;
            width: 300px;
            background: white;
            border: 1px solid #ddd;
            border-radius: 8px;
            box-shadow: 0 2px 10px rgba(0,0,0,0.1);
            z-index: 1000;
            max-height: 400px;
            overflow-y: auto;
        `;
        
        const header = document.createElement('div');
        header.textContent = '下载管理器';
        header.style.cssText = `
            padding: 10px;
            background: #f5f5f5;
            border-bottom: 1px solid #ddd;
            font-weight: bold;
        `;
        
        container.appendChild(header);
        document.body.appendChild(container);
        
        return container;
    }

    /**
     * 设置UI界面
     */
    setupUI() {
        this.createControlPanel();
    }

    /**
     * 创建控制面板
     */
    createControlPanel() {
        const controls = document.createElement('div');
        controls.style.cssText = `
            padding: 10px;
            border-bottom: 1px solid #eee;
        `;
        
        const pauseBtn = this.createButton('暂停', () => this.downloadManager.pause());
        const resumeBtn = this.createButton('继续', () => this.downloadManager.resume());
        const cancelBtn = this.createButton('取消全部', () => this.downloadManager.cancel());
        
        controls.appendChild(pauseBtn);
        controls.appendChild(resumeBtn);
        controls.appendChild(cancelBtn);
        
        this.downloadList.appendChild(controls);
    }

    /**
     * 创建按钮
     */
    createButton(text, onClick) {
        const button = document.createElement('button');
        button.textContent = text;
        button.onclick = onClick;
        button.style.cssText = `
            margin: 2px;
            padding: 4px 8px;
            font-size: 12px;
        `;
        return button;
    }

    /**
     * 添加下载任务到UI
     */
    addDownloadTask(task) {
        const taskElement = document.createElement('div');
        taskElement.id = `task_${task.id}`;
        taskElement.style.cssText = `
            padding: 10px;
            border-bottom: 1px solid #eee;
        `;
        
        const title = document.createElement('div');
        title.textContent = task.type === 'batch' ? 
            `批量下载: ${task.zipName}` : 
            `文件: ${task.filename}`;
        title.style.fontWeight = 'bold';
        
        const progress = document.createElement('div');
        progress.innerHTML = this.createProgressHTML(task);
        
        const status = document.createElement('div');
        status.textContent = `状态: ${this.getStatusText(task.status)}`;
        status.style.fontSize = '12px';
        status.style.color = '#666';
        
        taskElement.appendChild(title);
        taskElement.appendChild(progress);
        taskElement.appendChild(status);
        
        this.downloadList.appendChild(taskElement);
        
        return taskElement;
    }

    /**
     * 创建进度条HTML
     */
    createProgressHTML(task) {
        if (task.type === 'batch') {
            return `
                <div style="margin: 5px 0;">
                    <div style="display: flex; justify-content: space-between; font-size: 12px;">
                        <span>批量进度</span>
                        <span>${task.completed || 0}/${task.total || 0}</span>
                    </div>
                    <div style="background: #f0f0f0; height: 4px; border-radius: 2px;">
                        <div style="background: #007bff; height: 100%; width: ${task.progress || 0}%; border-radius: 2px;"></div>
                    </div>
                </div>
            `;
        } else {
            return `
                <div style="margin: 5px 0;">
                    <div style="text-align: right; font-size: 12px;">${Math.round(task.progress || 0)}%</div>
                    <div style="background: #f0f0f0; height: 4px; border-radius: 2px;">
                        <div style="background: #28a745; height: 100%; width: ${task.progress || 0}%; border-radius: 2px;"></div>
                    </div>
                </div>
            `;
        }
    }

    /**
     * 获取状态文本
     */
    getStatusText(status) {
        const statusMap = {
            'queued': '等待中',
            'downloading': '下载中',
            'processing': '处理中',
            'packaging': '打包中',
            'completed': '已完成',
            'paused': '已暂停',
            'error': '错误'
        };
        return statusMap[status] || status;
    }

    /**
     * 更新任务进度
     */
    updateTaskProgress(task) {
        let taskElement = document.getElementById(`task_${task.id}`);
        
        if (!taskElement) {
            taskElement = this.addDownloadTask(task);
        }
        
        const progressHTML = this.createProgressHTML(task);
        taskElement.querySelector('div:nth-child(2)').innerHTML = progressHTML;
        
        const statusElement = taskElement.querySelector('div:nth-child(3)');
        statusElement.textContent = `状态: ${this.getStatusText(task.status)}`;
        
        if (task.status === 'completed') {
            statusElement.style.color = '#28a745';
        } else if (task.status === 'error') {
            statusElement.style.color = '#dc3545';
        }
    }
}

// ==================== 使用示例 ====================

// 初始化下载管理器
const downloadManager = new DownloadManager();

// 设置最大并发数
downloadManager.setMaxConcurrent(5);

// 创建UI管理器
const uiManager = new DownloadUIManager(downloadManager);

// 单个文件下载示例
async function downloadSingleFile() {
    const url = 'https://example.com/file1.jpg';
    const filename = 'image1.jpg';
    
    try {
        await downloadManager.downloadSingle(url, filename, (progress) => {
            console.log(`下载进度: ${progress}%`);
        });
        console.log('文件下载完成');
    } catch (error) {
        console.error('下载失败:', error);
    }
}

// 批量文件下载示例
async function downloadMultipleFiles() {
    const files = [
        { url: 'https://example.com/file1.jpg', filename: 'image1.jpg' },
        { url: 'https://example.com/file2.jpg', filename: 'image2.jpg' },
        { url: 'https://example.com/file3.jpg', filename: 'image3.jpg' },
        // ... 更多文件
    ];
    
    try {
        await downloadManager.downloadBatch(files, 'my_files.zip', (progress) => {
            console.log(`批量下载进度: ${progress.completed}/${progress.total} (${Math.round(progress.progress)}%)`);
            
            if (progress.packaging) {
                console.log(`打包进度: ${Math.round(progress.packagingProgress)}%`);
            }
        });
        console.log('批量下载完成');
    } catch (error) {
        console.error('批量下载失败:', error);
    }
}

// 导出模块
if (typeof module !== 'undefined' && module.exports) {
    module.exports = { DownloadManager, DownloadUIManager };
}