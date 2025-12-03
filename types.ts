export enum PieceColor {
  WHITE = 'w',
  BLACK = 'b',
}

export enum PieceType {
  PAWN = 'p',
  KNIGHT = 'n',
  BISHOP = 'b',
  ROOK = 'r',
  QUEEN = 'q',
  KING = 'k',
}

export interface Piece {
  type: PieceType;
  color: PieceColor;
}

export interface BoardSquare {
  square: string;
  type: PieceType;
  color: PieceColor;
}

export enum Difficulty {
  EASY = 1,
  MEDIUM = 2,
  HARD = 3,
}

export interface GameState {
  fen: string;
  isGameOver: boolean;
  turn: PieceColor;
  history: string[];
  captured: { w: PieceType[]; b: PieceType[] };
  inCheck: boolean;
  winner: PieceColor | 'draw' | null;
}

export interface AnalysisResult {
  text: string;
  isLoading: boolean;
}