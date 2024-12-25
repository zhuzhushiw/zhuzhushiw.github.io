class Tetris {
    constructor(element) {
        if (!element) {
            console.error('No element provided to Tetris constructor');
            return;
        }

        // 初始化游戏画布
        this.element = element;
        this.canvas = document.createElement('canvas');
        this.context = this.canvas.getContext('2d');
        this.canvas.width = 300;
        this.canvas.height = 600;
        this.element.appendChild(this.canvas);
        
        // 初始化游戏参数
        this.blockSize = 30;
        this.cols = this.canvas.width / this.blockSize;
        this.rows = this.canvas.height / this.blockSize;
        this.dropInterval = 1000; // 方块下落间隔（毫秒）
        
        // 初始化游戏状态
        this.reset();
        
        // 定义方块形状
        this.pieces = [
            [[1, 1, 1, 1]],  // I
            [[1, 1], [1, 1]],  // O
            [[0, 1, 0], [1, 1, 1]],  // T
            [[1, 0], [1, 0], [1, 1]],  // L
            [[0, 1], [0, 1], [1, 1]],  // J
            [[1, 1, 0], [0, 1, 1]],  // S
            [[0, 1, 1], [1, 1, 0]]   // Z
        ];
        
        // 定义颜色
        this.colors = [
            '#000000',  // 背景色
            '#FF0000',  // 红色
            '#00FF00',  // 绿色
            '#0000FF',  // 蓝色
            '#FFFF00',  // 黄色
            '#00FFFF',  // 青色
            '#FF00FF',  // 品红
            '#FFA500'   // 橙色
        ];
        
        // 添加键盘事件监听
        this.handleKeyPress = this.handleKeyPress.bind(this);
        document.addEventListener('keydown', this.handleKeyPress);
        
        // 初始化游戏循环
        this.gameLoop = this.gameLoop.bind(this);
        
        // 初始绘制
        this.draw();
    }
    
    reset() {
        this.board = Array(this.rows).fill().map(() => Array(this.cols).fill(0));
        this.score = 0;
        this.gameOver = false;
        this.isRunning = false;
        this.isPaused = false;
        this.lastMove = Date.now();
        this.currentPiece = this.newPiece();
        this.animationFrameId = null;
    }
    
    newPiece() {
        if (!Array.isArray(this.pieces) || this.pieces.length === 0) {
            console.error('Pieces array is not properly initialized');
            return null;
        }

        const pieceIndex = Math.floor(Math.random() * this.pieces.length);
        const piece = this.pieces[pieceIndex];
        if (!piece) {
            console.error('Invalid piece selected:', pieceIndex);
            return null;
        }

        const colorIndex = Math.floor(Math.random() * (this.colors.length - 1)) + 1;
        
        return {
            shape: piece,
            x: Math.floor((this.cols - piece[0].length) / 2),
            y: 0,
            color: colorIndex
        };
    }
    
    draw() {
        if (!this.context) {
            console.error('Canvas context is not initialized');
            return;
        }

        // 清空画布
        this.context.fillStyle = this.colors[0];
        this.context.fillRect(0, 0, this.canvas.width, this.canvas.height);
        
        // 绘制边框
        this.context.strokeStyle = '#FFFFFF';
        this.context.strokeRect(0, 0, this.canvas.width, this.canvas.height);
        
        // 绘制已固定的方块
        for(let y = 0; y < this.rows; y++) {
            for(let x = 0; x < this.cols; x++) {
                if(this.board[y][x]) {
                    this.drawBlock(x, y, this.board[y][x]);
                }
            }
        }
        
        // 绘制当前方块
        if(this.currentPiece && this.currentPiece.shape) {
            for(let y = 0; y < this.currentPiece.shape.length; y++) {
                for(let x = 0; x < this.currentPiece.shape[y].length; x++) {
                    if(this.currentPiece.shape[y][x]) {
                        this.drawBlock(
                            this.currentPiece.x + x,
                            this.currentPiece.y + y,
                            this.currentPiece.color
                        );
                    }
                }
            }
        }
        
        // 绘制分数
        this.context.fillStyle = '#FFFFFF';
        this.context.font = '20px Arial';
        this.context.fillText(`Score: ${this.score}`, 10, 25);
        
        // 游戏结束或暂停显示
        if(this.gameOver || this.isPaused) {
            this.context.fillStyle = 'rgba(0, 0, 0, 0.5)';
            this.context.fillRect(0, 0, this.canvas.width, this.canvas.height);
            this.context.fillStyle = '#FFFFFF';
            this.context.font = '40px Arial';
            this.context.textAlign = 'center';
            this.context.fillText(
                this.gameOver ? 'Game Over' : 'Paused',
                this.canvas.width / 2,
                this.canvas.height / 2
            );
            this.context.textAlign = 'start';
        }
    }
    
    drawBlock(x, y, color) {
        if (!this.context || !this.colors[color]) {
            return;
        }
        
        this.context.fillStyle = this.colors[color];
        this.context.fillRect(
            x * this.blockSize,
            y * this.blockSize,
            this.blockSize - 1,
            this.blockSize - 1
        );
        
        // 添加边框
        this.context.strokeStyle = '#FFFFFF';
        this.context.strokeRect(
            x * this.blockSize,
            y * this.blockSize,
            this.blockSize - 1,
            this.blockSize - 1
        );
    }
    
    moveDown() {
        if (!this.currentPiece || !this.isRunning || this.isPaused) return;
        
        this.currentPiece.y++;
        if(this.checkCollision()) {
            this.currentPiece.y--;
            this.mergePiece();
            this.clearLines();
            this.currentPiece = this.newPiece();
            if(this.checkCollision()) {
                this.gameOver = true;
                this.isRunning = false;
            }
        }
    }
    
    moveLeft() {
        if (!this.currentPiece || !this.isRunning || this.isPaused) return;
        
        this.currentPiece.x--;
        if(this.checkCollision()) {
            this.currentPiece.x++;
        }
    }
    
    moveRight() {
        if (!this.currentPiece || !this.isRunning || this.isPaused) return;
        
        this.currentPiece.x++;
        if(this.checkCollision()) {
            this.currentPiece.x--;
        }
    }
    
    rotate() {
        if (!this.currentPiece || !this.currentPiece.shape || !this.isRunning || this.isPaused) return;
        
        const rotated = [];
        for(let i = 0; i < this.currentPiece.shape[0].length; i++) {
            rotated[i] = [];
            for(let j = this.currentPiece.shape.length - 1; j >= 0; j--) {
                rotated[i].push(this.currentPiece.shape[j][i]);
            }
        }
        
        const oldShape = this.currentPiece.shape;
        this.currentPiece.shape = rotated;
        if(this.checkCollision()) {
            this.currentPiece.shape = oldShape;
        }
    }
    
    checkCollision() {
        if (!this.currentPiece || !this.currentPiece.shape) return true;
        
        for(let y = 0; y < this.currentPiece.shape.length; y++) {
            for(let x = 0; x < this.currentPiece.shape[y].length; x++) {
                if(this.currentPiece.shape[y][x]) {
                    const boardX = this.currentPiece.x + x;
                    const boardY = this.currentPiece.y + y;
                    
                    if(boardX < 0 || boardX >= this.cols ||
                       boardY >= this.rows ||
                       (boardY >= 0 && this.board[boardY][boardX])) {
                        return true;
                    }
                }
            }
        }
        return false;
    }
    
    mergePiece() {
        if (!this.currentPiece || !this.currentPiece.shape) return;
        
        for(let y = 0; y < this.currentPiece.shape.length; y++) {
            for(let x = 0; x < this.currentPiece.shape[y].length; x++) {
                if(this.currentPiece.shape[y][x]) {
                    const boardY = this.currentPiece.y + y;
                    if(boardY >= 0) {
                        this.board[boardY][this.currentPiece.x + x] = this.currentPiece.color;
                    }
                }
            }
        }
    }
    
    clearLines() {
        let linesCleared = 0;
        
        for(let y = this.rows - 1; y >= 0; y--) {
            if(this.board[y].every(cell => cell !== 0)) {
                this.board.splice(y, 1);
                this.board.unshift(Array(this.cols).fill(0));
                linesCleared++;
                y++; // 重新检查当前行，因为上面的行已经下移
            }
        }
        
        if(linesCleared > 0) {
            this.score += [40, 100, 300, 1200][linesCleared - 1];
        }
    }
    
    handleKeyPress(event) {
        if (!this.isRunning || this.gameOver) return;
        
        switch(event.keyCode) {
            case 37: // 左箭头
                this.moveLeft();
                break;
            case 39: // 右箭头
                this.moveRight();
                break;
            case 40: // 下箭头
                this.moveDown();
                break;
            case 38: // 上箭头
                this.rotate();
                break;
        }
        
        this.draw();
    }
    
    gameLoop() {
        if (!this.isRunning || this.gameOver || this.isPaused) {
            if (this.animationFrameId) {
                cancelAnimationFrame(this.animationFrameId);
                this.animationFrameId = null;
            }
            return;
        }
        
        const now = Date.now();
        if (now - this.lastMove > this.dropInterval) {
            this.moveDown();
            this.lastMove = now;
        }
        
        this.draw();
        this.animationFrameId = requestAnimationFrame(this.gameLoop);
    }
    
    start() {
        if (this.gameOver) {
            this.reset();
        }
        if (!this.isRunning) {
            this.isRunning = true;
            this.isPaused = false;
            this.lastMove = Date.now();
            this.gameLoop();
        }
    }
    
    pause() {
        if (this.isRunning && !this.gameOver) {
            this.isPaused = true;
            this.draw();
        }
    }
    
    resume() {
        if (this.isRunning && !this.gameOver) {
            this.isPaused = false;
            this.lastMove = Date.now();
            this.gameLoop();
        }
    }
    
    restart() {
        this.reset();
        this.start();
    }
}
