class Tetris {
    constructor(element) {
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
        
        // 初始化游戏状态
        this.board = Array(this.rows).fill().map(() => Array(this.cols).fill(0));
        this.score = 0;
        this.gameOver = false;
        this.lastMove = Date.now();
        
        // 定义方块形状和颜色
        this.pieces = [
            [[1, 1, 1, 1]],  // I
            [[1, 1], [1, 1]],  // O
            [[0, 1, 0], [1, 1, 1]],  // T
            [[1, 0], [1, 0], [1, 1]],  // L
            [[0, 1], [0, 1], [1, 1]],  // J
            [[1, 1, 0], [0, 1, 1]],  // S
            [[0, 1, 1], [1, 1, 0]]   // Z
        ];
        
        this.colors = [
            '#000000',  // background
            '#FF0000',  // red
            '#00FF00',  // green
            '#0000FF',  // blue
            '#FFFF00',  // yellow
            '#00FFFF',  // cyan
            '#FF00FF',  // magenta
            '#FFA500'   // orange
        ];
        
        // 创建第一个方块
        this.currentPiece = this.newPiece();
        
        // 添加键盘事件监听
        document.addEventListener('keydown', this.handleKeyPress.bind(this));
    }
    
    newPiece() {
        const piece = this.pieces[Math.floor(Math.random() * this.pieces.length)];
        const color = Math.floor(Math.random() * (this.colors.length - 1)) + 1;
        return {
            shape: piece,
            x: Math.floor((this.cols - piece[0].length) / 2),
            y: 0,
            color: color
        };
    }
    
    draw() {
        // 清空画布
        this.context.fillStyle = this.colors[0];
        this.context.fillRect(0, 0, this.canvas.width, this.canvas.height);
        
        // 绘制已固定的方块
        for(let y = 0; y < this.rows; y++) {
            for(let x = 0; x < this.cols; x++) {
                if(this.board[y][x]) {
                    this.drawBlock(x, y, this.board[y][x]);
                }
            }
        }
        
        // 绘制当前方块
        if(this.currentPiece) {
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
        
        // 游戏结束显示
        if(this.gameOver) {
            this.context.fillStyle = 'rgba(0, 0, 0, 0.5)';
            this.context.fillRect(0, 0, this.canvas.width, this.canvas.height);
            this.context.fillStyle = '#FFFFFF';
            this.context.font = '40px Arial';
            this.context.fillText('Game Over', 60, this.canvas.height / 2);
        }
    }
    
    drawBlock(x, y, color) {
        this.context.fillStyle = this.colors[color];
        this.context.fillRect(
            x * this.blockSize,
            y * this.blockSize,
            this.blockSize - 1,
            this.blockSize - 1
        );
    }
    
    moveDown() {
        this.currentPiece.y++;
        if(this.checkCollision()) {
            this.currentPiece.y--;
            this.mergePiece();
            this.clearLines();
            this.currentPiece = this.newPiece();
            if(this.checkCollision()) {
                this.gameOver = true;
            }
        }
    }
    
    moveLeft() {
        this.currentPiece.x--;
        if(this.checkCollision()) {
            this.currentPiece.x++;
        }
    }
    
    moveRight() {
        this.currentPiece.x++;
        if(this.checkCollision()) {
            this.currentPiece.x--;
        }
    }
    
    rotate() {
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
                y++;
            }
        }
        if(linesCleared > 0) {
            this.score += [40, 100, 300, 1200][linesCleared - 1];
        }
    }
    
    handleKeyPress(event) {
        if(!this.gameOver) {
            switch(event.keyCode) {
                case 37: // Left arrow
                    this.moveLeft();
                    break;
                case 39: // Right arrow
                    this.moveRight();
                    break;
                case 40: // Down arrow
                    this.moveDown();
                    break;
                case 38: // Up arrow
                    this.rotate();
                    break;
            }
            this.draw();
        }
    }
    
    gameLoop() {
        if(!this.gameOver) {
            if(Date.now() - this.lastMove > 1000) {
                this.moveDown();
                this.lastMove = Date.now();
            }
        }
        this.draw();
        requestAnimationFrame(this.gameLoop.bind(this));
    }
    
    start() {
        this.lastMove = Date.now();
        this.gameLoop();
    }
}
