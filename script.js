document.addEventListener('DOMContentLoaded', () => {
    // DOM Elements
    const cells = document.querySelectorAll('.cell');
    const statusDisplay = document.querySelector('#status');
    const resetButton = document.querySelector('#reset-btn');
    const humanBtn = document.querySelector('#human-btn');
    const aiBtn = document.querySelector('#ai-btn');
    const difficultySelector = document.querySelector('#difficulty');
    const xScoreDisplay = document.querySelector('#x-score .score-value');
    const oScoreDisplay = document.querySelector('#o-score .score-value');
    const tiesDisplay = document.querySelector('#ties .score-value');
    
    // Audio elements
    const placeSound = document.getElementById('place-sound');
    const winSound = document.getElementById('win-sound');
    const drawSound = document.getElementById('draw-sound');
    
    // Game state
    let gameState = ['', '', '', '', '', '', '', '', ''];
    let currentPlayer = 'X';
    let gameActive = true;
    let vsAI = false;
    let aiDifficulty = 'hard'; // Default to hard
    
    // Scores
    let scores = {
        X: 0,
        O: 0,
        ties: 0
    };
    
    // Winning conditions
    const winningConditions = [
        [0, 1, 2], [3, 4, 5], [6, 7, 8], // rows
        [0, 3, 6], [1, 4, 7], [2, 5, 8], // columns
        [0, 4, 8], [2, 4, 6]             // diagonals
    ];
    
    // Event Listeners
    cells.forEach(cell => cell.addEventListener('click', handleCellClick));
    resetButton.addEventListener('click', resetGame);
    humanBtn.addEventListener('click', () => setGameMode(false));
    aiBtn.addEventListener('click', () => setGameMode(true));
    document.querySelectorAll('.difficulty-btn').forEach(btn => {
        btn.addEventListener('click', (e) => {
            aiDifficulty = e.target.dataset.difficulty;
            difficultySelector.classList.add('hidden');
            resetGame();
        });
    });
    
    // Functions
    function handleCellClick(e) {
        const clickedCell = e.target;
        const clickedCellIndex = parseInt(clickedCell.getAttribute('data-index'));
        
        // If cell already played or game not active, ignore
        if (gameState[clickedCellIndex] !== '' || !gameActive) return;
        
        // Play the move
        handleCellPlayed(clickedCell, clickedCellIndex);
        placeSound.play();
        
        // Check result
        const result = handleResultValidation();
        
        // If game is still active and vs AI, let AI play
        if (gameActive && vsAI && currentPlayer === 'O' && result === 'continue') {
            setTimeout(() => {
                const aiMove = getAIMove();
                const aiCell = document.querySelector(`[data-index="${aiMove}"]`);
                handleCellPlayed(aiCell, aiMove);
                placeSound.play();
                handleResultValidation();
            }, 500);
        }
    }
    
    function handleCellPlayed(clickedCell, clickedCellIndex) {
        gameState[clickedCellIndex] = currentPlayer;
        clickedCell.textContent = currentPlayer;
        clickedCell.classList.add(currentPlayer.toLowerCase());
    }
    
    function handleResultValidation() {
        // Check for win
        for (let i = 0; i < winningConditions.length; i++) {
            const [a, b, c] = winningConditions[i];
            if (gameState[a] && gameState[a] === gameState[b] && gameState[a] === gameState[c]) {
                // Win found
                gameActive = false;
                document.querySelectorAll(`[data-index="${a}"], [data-index="${b}"], [data-index="${c}"]`)
                    .forEach(cell => cell.classList.add('winning-cell'));
                
                // Update score
                scores[currentPlayer]++;
                updateScores();
                
                statusDisplay.textContent = `Player ${currentPlayer} wins!`;
                winSound.play();
                return 'win';
            }
        }
        
        // Check for draw
        if (!gameState.includes('')) {
            gameActive = false;
            scores.ties++;
            updateScores();
            statusDisplay.textContent = "Game ended in a draw!";
            drawSound.play();
            return 'draw';
        }
        
        // Continue game
        handlePlayerChange();
        return 'continue';
    }
    
    function handlePlayerChange() {
        currentPlayer = currentPlayer === 'X' ? 'O' : 'X';
        statusDisplay.textContent = `Player ${currentPlayer}'s turn`;
    }
    
    function resetGame() {
        gameState = ['', '', '', '', '', '', '', '', ''];
        gameActive = true;
        currentPlayer = 'X';
        statusDisplay.textContent = `Player ${currentPlayer}'s turn`;
        
        cells.forEach(cell => {
            cell.textContent = '';
            cell.classList.remove('x', 'o', 'winning-cell');
        });
        
        // If vs AI and AI goes first
        if (vsAI && currentPlayer === 'O') {
            setTimeout(() => {
                const aiMove = getAIMove();
                const aiCell = document.querySelector(`[data-index="${aiMove}"]`);
                handleCellPlayed(aiCell, aiMove);
                placeSound.play();
                handleResultValidation();
            }, 500);
        }
    }
    
    function updateScores() {
        xScoreDisplay.textContent = scores.X;
        oScoreDisplay.textContent = scores.O;
        tiesDisplay.textContent = scores.ties;
    }
    
    function setGameMode(aiMode) {
        vsAI = aiMode;
        if (aiMode) {
            difficultySelector.classList.remove('hidden');
            humanBtn.classList.remove('btn-primary');
            humanBtn.classList.add('btn-secondary');
            aiBtn.classList.remove('btn-secondary');
            aiBtn.classList.add('btn-primary');
        } else {
            difficultySelector.classList.add('hidden');
            humanBtn.classList.remove('btn-secondary');
            humanBtn.classList.add('btn-primary');
            aiBtn.classList.remove('btn-primary');
            aiBtn.classList.add('btn-secondary');
        }
        resetGame();
    }
    
    // AI Logic
    function getAIMove() {
        switch (aiDifficulty) {
            case 'easy':
                return getRandomMove();
            case 'medium':
                return Math.random() < 0.7 ? getBestMove() : getRandomMove();
            case 'hard':
                return getBestMove();
            default:
                return getBestMove();
        }
    }
    
    function getRandomMove() {
        const emptyCells = gameState.map((cell, index) => cell === '' ? index : null)
                                   .filter(val => val !== null);
        return emptyCells[Math.floor(Math.random() * emptyCells.length)];
    }
    
    function getBestMove() {
        // Check for immediate win
        for (let i = 0; i < gameState.length; i++) {
            if (gameState[i] === '') {
                gameState[i] = 'O';
                if (checkWin('O')) {
                    gameState[i] = '';
                    return i;
                }
                gameState[i] = '';
            }
        }
        
        // Block opponent's immediate win
        for (let i = 0; i < gameState.length; i++) {
            if (gameState[i] === '') {
                gameState[i] = 'X';
                if (checkWin('X')) {
                    gameState[i] = '';
                    return i;
                }
                gameState[i] = '';
            }
        }
        
        // Try to take center
        if (gameState[4] === '') return 4;
        
        // Try to take corners
        const corners = [0, 2, 6, 8];
        const emptyCorners = corners.filter(index => gameState[index] === '');
        if (emptyCorners.length > 0) {
            return emptyCorners[Math.floor(Math.random() * emptyCorners.length)];
        }
        
        // Take any available edge
        const edges = [1, 3, 5, 7];
        const emptyEdges = edges.filter(index => gameState[index] === '');
        if (emptyEdges.length > 0) {
            return emptyEdges[Math.floor(Math.random() * emptyEdges.length)];
        }
        
        // Fallback to random move (shouldn't happen)
        return getRandomMove();
    }
    
    function checkWin(player) {
        return winningConditions.some(condition => {
            return condition.every(index => gameState[index] === player);
        });
    }
    
    // Initialize game
    updateScores();
});