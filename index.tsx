import { Chess, Square } from 'chess.js';
import { getBestMove } from './services/engine';
import { getGameCommentary, getHint } from './services/geminiService';
import { PIECE_IMAGES, INITIAL_FEN } from './constants';
import { PieceColor, PieceType, Difficulty } from './types';

// -- State --
let game = new Chess(INITIAL_FEN);
let boardOrientation: PieceColor = PieceColor.WHITE;
let difficulty: Difficulty = Difficulty.MEDIUM;
let selectedSquare: string | null = null;
let possibleMoves: string[] = [];
let lastMove: { from: string; to: string } | null = null;
let isAiThinking = false;

// -- DOM Elements --
const boardEl = document.getElementById('chessboard')!;
const commentaryEl = document.getElementById('commentary-text')!;
const thinkingEl = document.getElementById('thinking-indicator')!;
const statusEl = document.getElementById('game-status')!;
const capturedWhiteEl = document.getElementById('captured-white')!;
const capturedBlackEl = document.getElementById('captured-black')!;
const aiLevelDisplayEl = document.getElementById('ai-level-display')!;

// -- Initialization --
function init() {
    renderBoard();
    updateUI();
    setupControls();
}

function setupControls() {
    // Difficulty Buttons
    document.querySelectorAll('.difficulty-btn').forEach(btn => {
        btn.addEventListener('click', (e) => {
            const target = e.currentTarget as HTMLElement;
            const level = parseInt(target.getAttribute('data-level') || '2');
            setDifficulty(level);
        });
    });

    // Action Buttons
    document.getElementById('btn-reset')?.addEventListener('click', resetGame);
    document.getElementById('btn-hint')?.addEventListener('click', handleHint);
}

function setDifficulty(level: number) {
    difficulty = level;
    // Update UI buttons
    document.querySelectorAll('.difficulty-btn').forEach(btn => {
        const btnLevel = parseInt(btn.getAttribute('data-level') || '0');
        if (btnLevel === level) {
            btn.className = 'difficulty-btn py-2 px-3 text-xs font-medium rounded-lg bg-emerald-600 text-white shadow-lg transition-colors';
        } else {
            btn.className = 'difficulty-btn py-2 px-3 text-xs font-medium rounded-lg bg-gray-700 text-gray-400 hover:bg-gray-600 transition-colors';
        }
    });
    
    let levelName = 'Medium';
    if(level === 1) levelName = 'Easy';
    if(level === 3) levelName = 'Hard';
    aiLevelDisplayEl.textContent = `Level: ${levelName}`;
}

// -- Game Logic --

function handleSquareClick(square: string) {
    if (game.isGameOver() || isAiThinking) return;

    // 1. If clicking the already selected square, deselect
    if (selectedSquare === square) {
        clearSelection();
        renderBoard();
        return;
    }

    // 2. Check if clicked square is a valid move from current selection
    const moveAttempt = game.moves({ verbose: true }).find(m => m.from === selectedSquare && m.to === square);

    if (moveAttempt) {
        // EXECUTE MOVE
        makeMove(selectedSquare!, square);
        clearSelection();
    } else {
        // 3. If not a move, check if it's selecting a new piece
        const piece = game.get(square as Square);
        if (piece && piece.color === game.turn()) {
            selectedSquare = square;
            possibleMoves = game.moves({ square: square as Square, verbose: true }).map(m => m.to);
            renderBoard();
        } else {
            // Clicked empty square or opponent piece without valid move
            clearSelection();
            renderBoard();
        }
    }
}

function clearSelection() {
    selectedSquare = null;
    possibleMoves = [];
}

async function makeMove(from: string, to: string) {
    try {
        const move = game.move({ from, to, promotion: 'q' });
        if (!move) return;

        lastMove = { from, to };
        renderBoard();
        updateUI();
        
        // Gemini Commentary
        getGameCommentary(game.fen(), move.san, game.history()).then(text => {
            commentaryEl.textContent = `"${text}"`;
        });

        // AI Response
        if (!game.isGameOver()) {
            isAiThinking = true;
            thinkingEl.classList.remove('hidden');
            
            // Small delay for UX
            setTimeout(() => {
                makeAiMove();
            }, 500);
        }

    } catch (e) {
        console.error("Move error", e);
    }
}

function makeAiMove() {
    if (game.isGameOver()) return;

    const bestMoveSan = getBestMove(game, difficulty);
    if (bestMoveSan) {
        const move = game.move(bestMoveSan);
        lastMove = { from: move.from, to: move.to };
        
        // Occasional AI commentary
        if (Math.random() > 0.6) {
             getGameCommentary(game.fen(), move.san, game.history()).then(text => {
                commentaryEl.textContent = `"${text}"`;
            });
        }
    }
    
    isAiThinking = false;
    thinkingEl.classList.add('hidden');
    renderBoard();
    updateUI();
}

async function handleHint() {
    if (game.isGameOver()) return;
    commentaryEl.textContent = "Coach is analyzing...";
    const hint = await getHint(game.fen(), game.turn());
    commentaryEl.textContent = `Coach Hint: "${hint}"`;
}

function resetGame() {
    game = new Chess();
    lastMove = null;
    clearSelection();
    commentaryEl.textContent = "New game started. Show me what you've got!";
    renderBoard();
    updateUI();
}

function updateUI() {
    // 1. Status
    if (game.isCheckmate()) {
        statusEl.textContent = `Checkmate! ${game.turn() === 'w' ? 'Black' : 'White'} wins.`;
        statusEl.className = "text-xs text-red-400 font-bold";
    } else if (game.isDraw()) {
        statusEl.textContent = 'Draw!';
        statusEl.className = "text-xs text-yellow-400 font-bold";
    } else if (game.inCheck()) {
        statusEl.textContent = 'Check!';
        statusEl.className = "text-xs text-red-400 font-bold animate-pulse";
    } else {
        statusEl.textContent = `${game.turn() === 'w' ? 'White' : 'Black'}'s Turn`;
        statusEl.className = "text-xs text-gray-400";
    }

    // 2. Captured Pieces
    renderCapturedPieces();
}

// -- Rendering --

function renderBoard() {
    boardEl.innerHTML = ''; // Clear board
    const boardState = game.board();

    // Determine loop order based on orientation
    const rows = boardOrientation === PieceColor.WHITE ? [0, 1, 2, 3, 4, 5, 6, 7] : [7, 6, 5, 4, 3, 2, 1, 0];
    const cols = boardOrientation === PieceColor.WHITE ? [0, 1, 2, 3, 4, 5, 6, 7] : [7, 6, 5, 4, 3, 2, 1, 0];

    rows.forEach(row => {
        cols.forEach(col => {
            const squareFile = String.fromCharCode(97 + col); // 'a' through 'h'
            const squareRank = 8 - row; // 8 through 1
            const squareId = `${squareFile}${squareRank}`;
            const piece = boardState[row][col];

            const cell = document.createElement('div');
            
            // Base classes
            let classes = ['square', 'w-full', 'h-full'];
            
            // Color
            const isDark = (row + col) % 2 !== 0;
            classes.push(isDark ? 'bg-board-dark' : 'bg-board-light');
            
            // Selection Highlight
            if (selectedSquare === squareId) {
                classes.push('ring-inset', 'ring-4', 'ring-yellow-400');
            }

            // Last Move Highlight
            if (lastMove && (lastMove.from === squareId || lastMove.to === squareId)) {
                // We create a child overlay for this usually, but simple background mix works too
                // For vanilla, let's append a highlight div
            }

            cell.className = classes.join(' ');
            cell.onclick = () => handleSquareClick(squareId);

            // -- Inner Elements --

            // 1. Rank/File Labels (Coordinates)
            if (col === (boardOrientation === 'w' ? 0 : 7)) {
                const rankLabel = document.createElement('span');
                rankLabel.className = `absolute top-0.5 left-0.5 text-[10px] font-bold ${!isDark ? 'text-board-dark' : 'text-board-light'}`;
                rankLabel.innerText = squareRank.toString();
                cell.appendChild(rankLabel);
            }
            if (row === (boardOrientation === 'w' ? 7 : 0)) {
                const fileLabel = document.createElement('span');
                fileLabel.className = `absolute bottom-0 right-0.5 text-[10px] font-bold ${!isDark ? 'text-board-dark' : 'text-board-light'}`;
                fileLabel.innerText = squareFile;
                cell.appendChild(fileLabel);
            }

            // 2. Last Move Overlay
            if (lastMove && (lastMove.from === squareId || lastMove.to === squareId)) {
                const overlay = document.createElement('div');
                overlay.className = "absolute inset-0 bg-yellow-200 opacity-40 mix-blend-multiply pointer-events-none";
                cell.appendChild(overlay);
            }

            // 3. Move Hints
            const isPossible = possibleMoves.includes(squareId);
            if (isPossible) {
                const hint = document.createElement('div');
                hint.className = piece ? 'capture-hint' : 'move-hint';
                cell.appendChild(hint);
            }

            // 4. Piece
            if (piece) {
                const img = document.createElement('img');
                img.src = PIECE_IMAGES[`${piece.color}${piece.type}`];
                img.className = 'piece';
                cell.appendChild(img);
            }

            boardEl.appendChild(cell);
        });
    });
}

function renderCapturedPieces() {
    // Logic: Compare current board counts vs initial counts
    const boardState = game.board();
    const currentCounts: Record<string, number> = {};
    
    boardState.flat().forEach(p => {
        if(p) {
            const key = `${p.color}${p.type}`;
            currentCounts[key] = (currentCounts[key] || 0) + 1;
        }
    });

    const initialCounts: Record<string, number> = {
        [`${PieceColor.WHITE}${PieceType.PAWN}`]: 8, [`${PieceColor.WHITE}${PieceType.ROOK}`]: 2, [`${PieceColor.WHITE}${PieceType.KNIGHT}`]: 2, [`${PieceColor.WHITE}${PieceType.BISHOP}`]: 2, [`${PieceColor.WHITE}${PieceType.QUEEN}`]: 1,
        [`${PieceColor.BLACK}${PieceType.PAWN}`]: 8, [`${PieceColor.BLACK}${PieceType.ROOK}`]: 2, [`${PieceColor.BLACK}${PieceType.KNIGHT}`]: 2, [`${PieceColor.BLACK}${PieceType.BISHOP}`]: 2, [`${PieceColor.BLACK}${PieceType.QUEEN}`]: 1
    };

    const wCaps: PieceType[] = []; // White pieces captured by Black
    const bCaps: PieceType[] = []; // Black pieces captured by White

    // Missing White pieces
    Object.keys(initialCounts).forEach(key => {
        if (key.startsWith('w')) {
            const count = currentCounts[key] || 0;
            const missing = initialCounts[key] - count;
            for(let i=0; i<missing; i++) wCaps.push(key[1] as PieceType);
        }
    });
     // Missing Black pieces
     Object.keys(initialCounts).forEach(key => {
        if (key.startsWith('b')) {
            const count = currentCounts[key] || 0;
            const missing = initialCounts[key] - count;
            for(let i=0; i<missing; i++) bCaps.push(key[1] as PieceType);
        }
    });

    const createImgs = (container: HTMLElement, pieces: PieceType[], color: string) => {
        container.innerHTML = '';
        if(pieces.length === 0) {
            const span = document.createElement('span');
            span.className = "text-xs text-gray-500";
            span.innerText = "None";
            container.appendChild(span);
            return;
        }
        pieces.forEach(p => {
            const img = document.createElement('img');
            img.src = PIECE_IMAGES[`${color}${p}`];
            img.className = "w-5 h-5 opacity-80";
            container.appendChild(img);
        });
    };

    createImgs(capturedWhiteEl, wCaps, 'w');
    createImgs(capturedBlackEl, bCaps, 'b');
}

// Start
init();