import React, { useState, useEffect } from 'react';
import { Chess, Square, Move } from 'chess.js';
import { PIECE_IMAGES } from '../constants';
import { PieceColor, PieceType } from '../types';

interface BoardProps {
  game: Chess;
  onMove: (from: string, to: string) => void;
  orientation: PieceColor;
  lastMove: { from: string; to: string } | null;
}

const Board: React.FC<BoardProps> = ({ game, onMove, orientation, lastMove }) => {
  const [selectedSquare, setSelectedSquare] = useState<string | null>(null);
  const [possibleMoves, setPossibleMoves] = useState<string[]>([]);

  const board = game.board(); // 8x8 array

  // Helper to get square color
  const getSquareColor = (row: number, col: number) => {
    return (row + col) % 2 === 0 ? 'bg-board-light' : 'bg-board-dark';
  };

  // Handle square click
  const handleSquareClick = (square: string) => {
    // If we have a selected square, try to move there
    if (selectedSquare) {
      // If clicking the same square, deselect
      if (square === selectedSquare) {
        setSelectedSquare(null);
        setPossibleMoves([]);
        return;
      }

      // Check if it's a valid move
      const moves = game.moves({ square: selectedSquare as Square, verbose: true });
      const move = moves.find((m) => m.to === square);

      if (move) {
        onMove(selectedSquare, square);
        setSelectedSquare(null);
        setPossibleMoves([]);
      } else {
        // If invalid move, but clicked on own piece, select that instead
        const piece = game.get(square as Square);
        if (piece && piece.color === game.turn()) {
          setSelectedSquare(square);
          const newMoves = game.moves({ square: square as Square, verbose: true }).map(m => m.to);
          setPossibleMoves(newMoves);
        } else {
          // Deselect
          setSelectedSquare(null);
          setPossibleMoves([]);
        }
      }
    } else {
      // Select a piece
      const piece = game.get(square as Square);
      if (piece && piece.color === game.turn()) {
        setSelectedSquare(square);
        const moves = game.moves({ square: square as Square, verbose: true }).map(m => m.to);
        setPossibleMoves(moves);
      }
    }
  };

  // Render the board depending on orientation
  const rows = orientation === PieceColor.WHITE ? [0, 1, 2, 3, 4, 5, 6, 7] : [7, 6, 5, 4, 3, 2, 1, 0];
  const cols = orientation === PieceColor.WHITE ? [0, 1, 2, 3, 4, 5, 6, 7] : [7, 6, 5, 4, 3, 2, 1, 0];

  return (
    <div className="select-none shadow-2xl rounded-sm overflow-hidden border-4 border-gray-700">
      <div className="grid grid-cols-8 grid-rows-8 w-full max-w-[600px] aspect-square">
        {rows.map((row) => (
          cols.map((col) => {
            const squareFile = String.fromCharCode(97 + col);
            const squareRank = 8 - row;
            const squareId = `${squareFile}${squareRank}`;
            const piece = board[row][col];
            
            const isSelected = selectedSquare === squareId;
            const isPossibleMove = possibleMoves.includes(squareId);
            const isLastMove = lastMove && (lastMove.from === squareId || lastMove.to === squareId);
            const isCapture = isPossibleMove && piece !== null;

            return (
              <div
                key={squareId}
                onClick={() => handleSquareClick(squareId)}
                className={`
                  relative flex items-center justify-center cursor-pointer
                  ${getSquareColor(row, col)}
                  ${isSelected ? 'ring-inset ring-4 ring-yellow-400' : ''}
                `}
              >
                {/* Rank/File Indicators */}
                {col === (orientation === 'w' ? 0 : 7) && (
                  <span className={`absolute top-0.5 left-0.5 text-[10px] font-bold ${getSquareColor(row, col).includes('light') ? 'text-board-dark' : 'text-board-light'}`}>
                    {squareRank}
                  </span>
                )}
                {row === (orientation === 'w' ? 7 : 0) && (
                  <span className={`absolute bottom-0 right-0.5 text-[10px] font-bold ${getSquareColor(row, col).includes('light') ? 'text-board-dark' : 'text-board-light'}`}>
                    {squareFile}
                  </span>
                )}

                {/* Last Move Highlight */}
                {isLastMove && <div className="absolute inset-0 bg-yellow-200 opacity-40 mix-blend-multiply" />}

                {/* Move Hints */}
                {isPossibleMove && !isCapture && (
                  <div className="absolute w-3 h-3 bg-black/20 rounded-full" />
                )}
                 {isCapture && (
                  <div className="absolute w-full h-full border-4 border-black/20 rounded-full" />
                )}

                {/* Piece */}
                {piece && (
                  <img
                    src={PIECE_IMAGES[`${piece.color}${piece.type}`]}
                    alt={`${piece.color} ${piece.type}`}
                    className="w-4/5 h-4/5 z-10 hover:scale-105 transition-transform"
                  />
                )}
              </div>
            );
          })
        ))}
      </div>
    </div>
  );
};

export default Board;