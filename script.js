// 游戏状态
let gameState = {
    board: [],
    solution: [],
    selectedCell: null,
    difficulty: 'easy',
    mistakes: 0,
    startTime: null,
    timerInterval: null,
    isComplete: false
};

// 难度配置（移除的数字数量）
const difficultyConfig = {
    easy: 30,
    medium: 40,
    hard: 50
};

// 初始化游戏
function initGame() {
    gameState.mistakes = 0;
    gameState.isComplete = false;
    document.getElementById('mistakes').textContent = '0';
    
    generateSudoku();
    renderGrid();
    startTimer();
    
    document.getElementById('celebration').classList.remove('show');
}

// 生成数独
function generateSudoku() {
    // 创建一个有效的完整数独解决方案
    gameState.solution = createFullSudoku();
    
    // 复制解决方案到游戏板
    gameState.board = gameState.solution.map(row => [...row]);
    
    // 根据难度移除数字
    const cellsToRemove = difficultyConfig[gameState.difficulty];
    removeCells(cellsToRemove);
}

// 创建完整的数独（使用回溯算法）
function createFullSudoku() {
    const board = Array(9).fill(0).map(() => Array(9).fill(0));
    
    // 填充对角线的3x3宫格（它们互不影响）
    for (let box = 0; box < 9; box += 3) {
        fillBox(board, box, box);
    }
    
    // 使用回溯填充剩余单元格
    solveSudoku(board);
    
    return board;
}

// 填充3x3宫格
function fillBox(board, row, col) {
    const nums = shuffle([1, 2, 3, 4, 5, 6, 7, 8, 9]);
    let idx = 0;
    
    for (let i = 0; i < 3; i++) {
        for (let j = 0; j < 3; j++) {
            board[row + i][col + j] = nums[idx++];
        }
    }
}

// 洗牌算法
function shuffle(array) {
    for (let i = array.length - 1; i > 0; i--) {
        const j = Math.floor(Math.random() * (i + 1));
        [array[i], array[j]] = [array[j], array[i]];
    }
    return array;
}

// 检查数字是否可以放置在指定位置
function isValid(board, row, col, num) {
    // 检查行
    for (let x = 0; x < 9; x++) {
        if (board[row][x] === num) return false;
    }
    
    // 检查列
    for (let x = 0; x < 9; x++) {
        if (board[x][col] === num) return false;
    }
    
    // 检查3x3宫格
    const startRow = row - row % 3;
    const startCol = col - col % 3;
    for (let i = 0; i < 3; i++) {
        for (let j = 0; j < 3; j++) {
            if (board[i + startRow][j + startCol] === num) return false;
        }
    }
    
    return true;
}

// 使用回溯算法解决数独
function solveSudoku(board) {
    for (let row = 0; row < 9; row++) {
        for (let col = 0; col < 9; col++) {
            if (board[row][col] === 0) {
                const numbers = shuffle([1, 2, 3, 4, 5, 6, 7, 8, 9]);
                
                for (let num of numbers) {
                    if (isValid(board, row, col, num)) {
                        board[row][col] = num;
                        
                        if (solveSudoku(board)) {
                            return true;
                        }
                        
                        board[row][col] = 0;
                    }
                }
                
                return false;
            }
        }
    }
    
    return true;
}

// 移除单元格中的数字
function removeCells(count) {
    let removed = 0;
    
    while (removed < count) {
        const row = Math.floor(Math.random() * 9);
        const col = Math.floor(Math.random() * 9);
        
        if (gameState.board[row][col] !== 0) {
            gameState.board[row][col] = 0;
            removed++;
        }
    }
}

// 渲染网格
function renderGrid() {
    const grid = document.getElementById('sudokuGrid');
    grid.innerHTML = '';
    
    for (let row = 0; row < 9; row++) {
        for (let col = 0; col < 9; col++) {
            const cell = document.createElement('div');
            cell.className = 'cell';
            cell.dataset.row = row;
            cell.dataset.col = col;
            
            const value = gameState.board[row][col];
            
            if (value !== 0) {
                cell.textContent = value;
                cell.classList.add('fixed');
            }
            
            cell.addEventListener('click', () => selectCell(row, col));
            
            grid.appendChild(cell);
        }
    }
}

// 选择单元格
function selectCell(row, col) {
    if (gameState.isComplete) return;
    
    // 移除之前的选择
    document.querySelectorAll('.cell').forEach(cell => {
        cell.classList.remove('selected');
    });
    
    const cell = document.querySelector(`[data-row="${row}"][data-col="${col}"]`);
    
    if (!cell.classList.contains('fixed')) {
        cell.classList.add('selected');
        gameState.selectedCell = { row, col };
    } else {
        gameState.selectedCell = null;
    }
}

// 放置数字
function placeNumber(num) {
    if (!gameState.selectedCell || gameState.isComplete) return;
    
    const { row, col } = gameState.selectedCell;
    const cell = document.querySelector(`[data-row="${row}"][data-col="${col}"]`);
    
    if (num === 0) {
        // 擦除
        gameState.board[row][col] = 0;
        cell.textContent = '';
        cell.classList.remove('correct', 'wrong');
    } else {
        // 放置数字
        gameState.board[row][col] = num;
        cell.textContent = num;
        
        // 检查是否正确
        if (num === gameState.solution[row][col]) {
            cell.classList.add('correct');
            cell.classList.remove('wrong');
            
            // 检查是否完成
            setTimeout(checkCompletion, 300);
        } else {
            cell.classList.add('wrong');
            cell.classList.remove('correct');
            gameState.mistakes++;
            document.getElementById('mistakes').textContent = gameState.mistakes;
        }
    }
}

// 提示功能
function giveHint() {
    if (gameState.isComplete) return;
    
    // 找到所有空单元格
    const emptyCells = [];
    for (let row = 0; row < 9; row++) {
        for (let col = 0; col < 9; col++) {
            if (gameState.board[row][col] === 0 || 
                gameState.board[row][col] !== gameState.solution[row][col]) {
                emptyCells.push({ row, col });
            }
        }
    }
    
    if (emptyCells.length === 0) return;
    
    // 随机选择一个单元格给出提示
    const { row, col } = emptyCells[Math.floor(Math.random() * emptyCells.length)];
    const cell = document.querySelector(`[data-row="${row}"][data-col="${col}"]`);
    
    gameState.board[row][col] = gameState.solution[row][col];
    cell.textContent = gameState.solution[row][col];
    cell.classList.add('correct', 'hint');
    
    setTimeout(() => {
        cell.classList.remove('hint');
        checkCompletion();
    }, 1000);
}

// 检查答案
function checkAnswer() {
    if (gameState.isComplete) return;
    
    let allCorrect = true;
    let hasEmpty = false;
    
    for (let row = 0; row < 9; row++) {
        for (let col = 0; col < 9; col++) {
            const cell = document.querySelector(`[data-row="${row}"][data-col="${col}"]`);
            
            if (!cell.classList.contains('fixed')) {
                if (gameState.board[row][col] === 0) {
                    hasEmpty = true;
                } else if (gameState.board[row][col] !== gameState.solution[row][col]) {
                    allCorrect = false;
                    cell.classList.add('wrong');
                    cell.classList.remove('correct');
                } else {
                    cell.classList.add('correct');
                    cell.classList.remove('wrong');
                }
            }
        }
    }
    
    if (hasEmpty) {
        alert('还有空格没填哦! 继续加油! 💪');
    } else if (allCorrect) {
        gameComplete();
    } else {
        alert('有些数字不对哦,再检查一下吧! 🤔');
    }
}

// 检查是否完成
function checkCompletion() {
    for (let row = 0; row < 9; row++) {
        for (let col = 0; col < 9; col++) {
            if (gameState.board[row][col] !== gameState.solution[row][col]) {
                return;
            }
        }
    }
    
    gameComplete();
}

// 游戏完成
function gameComplete() {
    gameState.isComplete = true;
    stopTimer();
    
    const finalTime = document.getElementById('time').textContent;
    document.getElementById('finalTime').textContent = finalTime;
    document.getElementById('celebration').classList.add('show');
    
    // 添加庆祝效果
    createConfetti();
}

// 创建五彩纸屑效果
function createConfetti() {
    const colors = ['#ff6b6b', '#4ecdc4', '#45b7d1', '#ffd93d', '#6bcf7f'];
    const confettiCount = 50;
    
    for (let i = 0; i < confettiCount; i++) {
        setTimeout(() => {
            const confetti = document.createElement('div');
            confetti.style.position = 'fixed';
            confetti.style.left = Math.random() * window.innerWidth + 'px';
            confetti.style.top = '-10px';
            confetti.style.width = '10px';
            confetti.style.height = '10px';
            confetti.style.backgroundColor = colors[Math.floor(Math.random() * colors.length)];
            confetti.style.borderRadius = '50%';
            confetti.style.zIndex = '9999';
            confetti.style.pointerEvents = 'none';
            
            document.body.appendChild(confetti);
            
            const animation = confetti.animate([
                { transform: 'translateY(0) rotate(0deg)', opacity: 1 },
                { transform: `translateY(${window.innerHeight}px) rotate(${Math.random() * 360}deg)`, opacity: 0 }
            ], {
                duration: 2000 + Math.random() * 1000,
                easing: 'cubic-bezier(0.25, 0.46, 0.45, 0.94)'
            });
            
            animation.onfinish = () => confetti.remove();
        }, i * 30);
    }
}

// 计时器
function startTimer() {
    stopTimer();
    gameState.startTime = Date.now();
    
    gameState.timerInterval = setInterval(() => {
        const elapsed = Date.now() - gameState.startTime;
        const minutes = Math.floor(elapsed / 60000);
        const seconds = Math.floor((elapsed % 60000) / 1000);
        
        document.getElementById('time').textContent = 
            `${String(minutes).padStart(2, '0')}:${String(seconds).padStart(2, '0')}`;
    }, 1000);
}

function stopTimer() {
    if (gameState.timerInterval) {
        clearInterval(gameState.timerInterval);
        gameState.timerInterval = null;
    }
}

// 事件监听器
document.addEventListener('DOMContentLoaded', () => {
    // 难度选择
    document.querySelectorAll('.difficulty-btn').forEach(btn => {
        btn.addEventListener('click', () => {
            document.querySelectorAll('.difficulty-btn').forEach(b => 
                b.classList.remove('active'));
            btn.classList.add('active');
            gameState.difficulty = btn.dataset.level;
            initGame();
        });
    });
    
    // 数字输入
    document.querySelectorAll('.number-btn').forEach(btn => {
        btn.addEventListener('click', () => {
            const num = parseInt(btn.dataset.number);
            placeNumber(num);
        });
    });
    
    // 键盘输入
    document.addEventListener('keydown', (e) => {
        if (e.key >= '1' && e.key <= '9') {
            placeNumber(parseInt(e.key));
        } else if (e.key === 'Backspace' || e.key === 'Delete' || e.key === '0') {
            placeNumber(0);
        }
    });
    
    // 按钮功能
    document.getElementById('hintBtn').addEventListener('click', giveHint);
    document.getElementById('checkBtn').addEventListener('click', checkAnswer);
    document.getElementById('newGameBtn').addEventListener('click', initGame);
    document.getElementById('playAgainBtn').addEventListener('click', initGame);
    
    // 开始新游戏
    initGame();
});
