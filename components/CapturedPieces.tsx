import React from 'react';
import { PieceType, PieceColor } from '../types';
import { PIECE_IMAGES } from '../constants';

interface CapturedPiecesProps {
  pieces: PieceType[];
  color: PieceColor;
}

const CapturedPieces: React.FC<CapturedPiecesProps> = ({ pieces, color }) => {
  return (
    <div className="flex flex-wrap gap-1 h-8 items-center bg-gray-800/50 rounded-lg px-2 py-1 min-w-[100px]">
      {pieces.map((p, idx) => (
        <img 
            key={`${p}-${idx}`} 
            src={PIECE_IMAGES[`${color}${p}`]} 
            alt={p} 
            className="w-5 h-5 opacity-80"
        />
      ))}
      {pieces.length === 0 && <span className="text-xs text-gray-500">None</span>}
    </div>
  );
};

export default CapturedPieces;