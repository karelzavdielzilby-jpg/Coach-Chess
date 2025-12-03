import { PieceType, PieceColor } from './types';

// Standard SVG chess pieces
export const PIECE_IMAGES: Record<string, string> = {
  [`${PieceColor.WHITE}${PieceType.PAWN}`]: 'https://upload.wikimedia.org/wikipedia/commons/4/45/Chess_plt45.svg',
  [`${PieceColor.WHITE}${PieceType.KNIGHT}`]: 'https://upload.wikimedia.org/wikipedia/commons/7/70/Chess_nlt45.svg',
  [`${PieceColor.WHITE}${PieceType.BISHOP}`]: 'https://upload.wikimedia.org/wikipedia/commons/b/b1/Chess_blt45.svg',
  [`${PieceColor.WHITE}${PieceType.ROOK}`]: 'https://upload.wikimedia.org/wikipedia/commons/7/72/Chess_rlt45.svg',
  [`${PieceColor.WHITE}${PieceType.QUEEN}`]: 'https://upload.wikimedia.org/wikipedia/commons/1/15/Chess_qlt45.svg',
  [`${PieceColor.WHITE}${PieceType.KING}`]: 'https://upload.wikimedia.org/wikipedia/commons/4/42/Chess_klt45.svg',
  [`${PieceColor.BLACK}${PieceType.PAWN}`]: 'https://upload.wikimedia.org/wikipedia/commons/c/c7/Chess_pdt45.svg',
  [`${PieceColor.BLACK}${PieceType.KNIGHT}`]: 'https://upload.wikimedia.org/wikipedia/commons/e/ef/Chess_ndt45.svg',
  [`${PieceColor.BLACK}${PieceType.BISHOP}`]: 'https://upload.wikimedia.org/wikipedia/commons/9/98/Chess_bdt45.svg',
  [`${PieceColor.BLACK}${PieceType.ROOK}`]: 'https://upload.wikimedia.org/wikipedia/commons/f/ff/Chess_rdt45.svg',
  [`${PieceColor.BLACK}${PieceType.QUEEN}`]: 'https://upload.wikimedia.org/wikipedia/commons/4/47/Chess_qdt45.svg',
  [`${PieceColor.BLACK}${PieceType.KING}`]: 'https://upload.wikimedia.org/wikipedia/commons/f/f0/Chess_kdt45.svg',
};

export const INITIAL_FEN = 'rnbqkbnr/pppppppp/8/8/8/8/PPPPPPPP/RNBQKBNR w KQkq - 0 1';
