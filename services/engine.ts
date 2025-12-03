import { Chess, Move } from 'chess.js';
import { Difficulty } from '../types';

// Piece values for evaluation
const PIECE_VALUES: Record<string, number> = {
  p: 100,
  n: 320,
  b: 330,
  r: 500,
  q: 900,
  k: 20000,
};

// Simplified Piece-Square Tables (Mid-game)
const PAWN_PST = [
  0,  0,  0,  0,  0,  0,  0,  0,
  50, 50, 50, 50, 50, 50, 50, 50,
  10, 10, 20, 30, 30, 20, 10, 10,
  5,  5, 10, 25, 25, 10,  5,  5,
  0,  0,  0, 20, 20,  0,  0,  0,
  5, -5,-10,  0,  0,-10, -5,  5,
  5, 10, 10,-20,-20, 10, 10,  5,
  0,  0,  0,  0,  0,  0,  0,  0
];

const KNIGHT_PST = [
  -50,-40,-30,-30,-30,-30,-40,-50,
  -40,-20,  0,  0,  0,  0,-20,-40,
  -30,  0, 10, 15, 15, 10,  0,-30,
  -30,  5, 15, 20, 20, 15,  5,-30,
  -30,  0, 15, 20, 20, 15,  0,-30,
  -30,  5, 10, 15, 15, 10,  5,-30,
  -40,-20,  0,  5,  5,  0,-20,-40,
  -50,-40,-30,-30,-30,-30,-40,-50
];

const BISHOP_PST = [
  -20,-10,-10,-10,-10,-10,-10,-20,
  -10,  0,  0,  0,  0,  0,  0,-10,
  -10,  0,  5, 10, 10,  5,  0,-10,
  -10,  5,  5, 10, 10,  5,  5,-10,
  -10,  0, 10, 10, 10, 10,  0,-10,
  -10, 10, 10, 10, 10, 10, 10,-10,
  -10,  5,  0,  0,  0,  0,  5,-10,
  -20,-10,-10,-10,-10,-10,-10,-20
];

const PSTS: Record<string, number[]> = {
  p: PAWN_PST,
  n: KNIGHT_PST,
  b: BISHOP_PST,
};

const evaluateBoard = (game: Chess): number => {
  let totalEvaluation = 0;
  const board = game.board();

  for (let i = 0; i < 8; i++) {
    for (let j = 0; j < 8; j++) {
      const piece = board[i][j];
      if (piece) {
        const value = PIECE_VALUES[piece.type];
        
        // Calculate PST index
        // For white, index is straight forward (0-63)
        // For black, we need to mirror the index
        let pstValue = 0;
        if (PSTS[piece.type]) {
            const index = piece.color === 'w' ? (i * 8 + j) : ((7 - i) * 8 + j);
            pstValue = PSTS[piece.type][index];
        }

        const absoluteValue = value + pstValue;
        totalEvaluation += piece.color === 'w' ? absoluteValue : -absoluteValue;
      }
    }
  }
  return totalEvaluation;
};

const minimax = (
  game: Chess,
  depth: number,
  alpha: number,
  beta: number,
  isMaximizingPlayer: boolean
): number => {
  if (depth === 0 || game.isGameOver()) {
    return -evaluateBoard(game); // Negate because the evaluation function is usually white-centric
  }

  const moves = game.moves();

  if (isMaximizingPlayer) {
    let maxEval = -Infinity;
    for (const move of moves) {
      game.move(move);
      const evalValue = minimax(game, depth - 1, alpha, beta, false);
      game.undo();
      maxEval = Math.max(maxEval, evalValue);
      alpha = Math.max(alpha, evalValue);
      if (beta <= alpha) break;
    }
    return maxEval;
  } else {
    let minEval = Infinity;
    for (const move of moves) {
      game.move(move);
      const evalValue = minimax(game, depth - 1, alpha, beta, true);
      game.undo();
      minEval = Math.min(minEval, evalValue);
      beta = Math.min(beta, evalValue);
      if (beta <= alpha) break;
    }
    return minEval;
  }
};

export const getBestMove = (game: Chess, difficulty: Difficulty): string | null => {
  const possibleMoves = game.moves();
  if (possibleMoves.length === 0) return null;

  // Random move for very easy or start
  if (difficulty === Difficulty.EASY && Math.random() < 0.3) {
      return possibleMoves[Math.floor(Math.random() * possibleMoves.length)];
  }

  let bestMove = null;
  let bestValue = -Infinity;
  
  // Scramble moves slightly for variety at lower levels
  possibleMoves.sort(() => Math.random() - 0.5);

  const searchDepth = difficulty; 

  for (const move of possibleMoves) {
    game.move(move);
    // AI plays Black usually, so it wants to minimize White's score (which is Max in eval). 
    // But minimax implementation above is generic.
    // Let's assume AI is 'Black' in this context (minimizing white score).
    // The evaluator returns +ve for White advantage.
    // So if AI is Black, it wants the LOWEST score from the evaluator.
    // However, usually Minimax is implemented such that the current player tries to MAXIMIZE their own score.
    // Let's simplify: Standard Minimax.
    // If AI is moving, we want to pick the move that results in the best state for AI.
    
    // We use a simplified Negamax approach concept here:
    // Calling minimax with isMaximizingPlayer = false (opponent's turn)
    const boardValue = minimax(game, searchDepth - 1, -100000, 100000, false);
    
    game.undo();

    if (boardValue > bestValue) {
      bestValue = boardValue;
      bestMove = move;
    }
  }

  return bestMove || possibleMoves[0];
};