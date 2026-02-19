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

// 难度显示名称
const difficultyNames = {
    easy: '简单 ⭐',
    medium: '中等 ⭐⭐',
    hard: '困难 ⭐⭐⭐'
};

// 成绩记录管理
const StatsManager = {
    STORAGE_KEY: 'sudoku_stats_v1',
    
    // 获取所有成绩记录
    getAllStats() {
        try {
            const data = localStorage.getItem(this.STORAGE_KEY);
            return data ? JSON.parse(data) : { records: [] };
        } catch (e) {
            console.error('读取成绩记录失败:', e);
            return { records: [] };
        }
    },
    
    // 保存成绩记录
    saveStats(stats) {
        try {
            localStorage.setItem(this.STORAGE_KEY, JSON.stringify(stats));
        } catch (e) {
            console.error('保存成绩记录失败:', e);
        }
    },
    
    // 添加新记录
    addRecord(time, mistakes, difficulty) {
        const stats = this.getAllStats();
        const record = {
            id: Date.now(),
            time: time,
            timeInSeconds: this.timeToSeconds(time),
            mistakes: mistakes,
            difficulty: difficulty,
            date: new Date().toISOString()
        };
        
        stats.records.unshift(record); // 新记录添加到前面
        
        // 只保留最近50条记录
        if (stats.records.length > 50) {
            stats.records = stats.records.slice(0, 50);
        }
        
        this.saveStats(stats);
        return record;
    },
    
    // 将时间字符串转换为秒数
    timeToSeconds(timeStr) {
        const [minutes, seconds] = timeStr.split(':').map(Number);
        return minutes * 60 + seconds;
    },
    
    // 获取各难度最佳成绩
    getBestScores() {
        const stats = this.getAllStats();
        const bestScores = {
            easy: null,
            medium: null,
            hard: null
        };
        
        stats.records.forEach(record => {
            if (!bestScores[record.difficulty] || 
                record.timeInSeconds < bestScores[record.difficulty].timeInSeconds) {
                bestScores[record.difficulty] = record;
            }
        });
        
        return bestScores;
    },
    
    // 获取最近游戏记录
    getRecentRecords(limit = 10) {
        const stats = this.getAllStats();
        return stats.records.slice(0, limit);
    },
    
    // 清除所有记录
    clearAllRecords() {
        this.saveStats({ records: [] });
    }
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
    
    // 保存成绩记录
    StatsManager.addRecord(finalTime, gameState.mistakes, gameState.difficulty);
    
    // 显示庆祝弹窗
    document.getElementById('finalTime').textContent = finalTime;
    document.getElementById('finalMistakes').textContent = gameState.mistakes;
    document.getElementById('finalDifficulty').textContent = difficultyNames[gameState.difficulty];
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

// 成绩统计功能
function showStatsModal() {
    updateStatsDisplay();
    document.getElementById('statsModal').classList.add('show');
}

function hideStatsModal() {
    document.getElementById('statsModal').classList.remove('show');
}

function updateStatsDisplay() {
    // 更新最佳成绩
    const bestScores = StatsManager.getBestScores();
    
    // 简单难度
    if (bestScores.easy) {
        document.getElementById('bestTimeEasy').textContent = bestScores.easy.time;
        document.getElementById('bestMistakesEasy').textContent = `${bestScores.easy.mistakes} 错误`;
    } else {
        document.getElementById('bestTimeEasy').textContent = '--:--';
        document.getElementById('bestMistakesEasy').textContent = '- 错误';
    }
    
    // 中等难度
    if (bestScores.medium) {
        document.getElementById('bestTimeMedium').textContent = bestScores.medium.time;
        document.getElementById('bestMistakesMedium').textContent = `${bestScores.medium.mistakes} 错误`;
    } else {
        document.getElementById('bestTimeMedium').textContent = '--:--';
        document.getElementById('bestMistakesMedium').textContent = '- 错误';
    }
    
    // 困难难度
    if (bestScores.hard) {
        document.getElementById('bestTimeHard').textContent = bestScores.hard.time;
        document.getElementById('bestMistakesHard').textContent = `${bestScores.hard.mistakes} 错误`;
    } else {
        document.getElementById('bestTimeHard').textContent = '--:--';
        document.getElementById('bestMistakesHard').textContent = '- 错误';
    }
    
    // 更新最近记录
    const recentRecords = StatsManager.getRecentRecords(10);
    const recentGamesList = document.getElementById('recentGamesList');
    
    if (recentRecords.length === 0) {
        recentGamesList.innerHTML = '<p class="no-records">暂无游戏记录，快来玩一局吧！</p>';
    } else {
        recentGamesList.innerHTML = recentRecords.map(record => {
            const date = new Date(record.date);
            const dateStr = `${date.getMonth() + 1}月${date.getDate()}日 ${String(date.getHours()).padStart(2, '0')}:${String(date.getMinutes()).padStart(2, '0')}`;
            return `
                <div class="game-record">
                    <div class="record-info">
                        <span class="record-difficulty ${record.difficulty}">${difficultyNames[record.difficulty]}</span>
                        <span class="record-date">${dateStr}</span>
                    </div>
                    <div class="record-stats">
                        <span class="record-time">⏱️ ${record.time}</span>
                        <span class="record-mistakes">❌ ${record.mistakes}</span>
                    </div>
                </div>
            `;
        }).join('');
    }
}

function clearAllStats() {
    if (confirm('确定要清除所有成绩记录吗？此操作不可恢复。')) {
        StatsManager.clearAllRecords();
        updateStatsDisplay();
        alert('成绩记录已清除！');
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
    
    // 成绩统计按钮
    document.getElementById('viewStatsBtn').addEventListener('click', showStatsModal);
    document.getElementById('closeStatsBtn').addEventListener('click', hideStatsModal);
    document.getElementById('clearStatsBtn').addEventListener('click', clearAllStats);
    
    // 点击弹窗外部关闭
    document.getElementById('statsModal').addEventListener('click', (e) => {
        if (e.target === document.getElementById('statsModal')) {
            hideStatsModal();
        }
    });
    
    // 开始新游戏
    initGame();
});
