import React, { useState, useEffect, useRef, useCallback } from 'react';
import { Chess, Move } from 'chess.js';
import { PieceColor, Difficulty, PieceType } from './types';
import Board from './components/Board';
import CapturedPieces from './components/CapturedPieces';
import { getBestMove } from './services/engine';
import { getGameCommentary, getHint } from './services/geminiService';
import { INITIAL_FEN } from './constants';

const App: React.FC = () => {
  const [game, setGame] = useState(new Chess(INITIAL_FEN));
  const [fen, setFen] = useState(INITIAL_FEN);
  const [difficulty, setDifficulty] = useState<Difficulty>(Difficulty.MEDIUM);
  const [playerColor, setPlayerColor] = useState<PieceColor>(PieceColor.WHITE);
  const [isAiThinking, setIsAiThinking] = useState(false);
  const [lastMove, setLastMove] = useState<{ from: string; to: string } | null>(null);
  const [commentary, setCommentary] = useState<string>("Welcome to Grandmaster AI Chess. Good luck!");
  const [capturedWhite, setCapturedWhite] = useState<PieceType[]>([]);
  const [capturedBlack, setCapturedBlack] = useState<PieceType[]>([]);
  const [gameStatus, setGameStatus] = useState<string>('Active');
  
  // Ref to track latest game instance in timeouts
  const gameRef = useRef(game);

  useEffect(() => {
    gameRef.current = game;
  }, [game]);

  const updateCapturedPieces = useCallback((currentHistory: string[]) => {
      // Basic Diffing to find captured pieces is complex with just history strings
      // Instead, we count material on board vs initial
      const board = game.board();
      const currentPieces: Record<string, number> = {};
      
      board.flat().forEach(p => {
          if(p) {
              const key = `${p.color}${p.type}`;
              currentPieces[key] = (currentPieces[key] || 0) + 1;
          }
      });

      const initialCounts: Record<string, number> = {
          [`${PieceColor.WHITE}${PieceType.PAWN}`]: 8, [`${PieceColor.WHITE}${PieceType.ROOK}`]: 2, [`${PieceColor.WHITE}${PieceType.KNIGHT}`]: 2, [`${PieceColor.WHITE}${PieceType.BISHOP}`]: 2, [`${PieceColor.WHITE}${PieceType.QUEEN}`]: 1,
          [`${PieceColor.BLACK}${PieceType.PAWN}`]: 8, [`${PieceColor.BLACK}${PieceType.ROOK}`]: 2, [`${PieceColor.BLACK}${PieceType.KNIGHT}`]: 2, [`${PieceColor.BLACK}${PieceType.BISHOP}`]: 2, [`${PieceColor.BLACK}${PieceType.QUEEN}`]: 1
      };

      const wCaps: PieceType[] = [];
      const bCaps: PieceType[] = [];

      // Calculate missing white pieces (captured by black)
      Object.keys(initialCounts).forEach(key => {
          if (key.startsWith('w')) {
              const count = currentPieces[key] || 0;
              const missing = initialCounts[key] - count;
              for(let i=0; i<missing; i++) wCaps.push(key[1] as PieceType);
          }
      });
       // Calculate missing black pieces (captured by white)
       Object.keys(initialCounts).forEach(key => {
        if (key.startsWith('b')) {
            const count = currentPieces[key] || 0;
            const missing = initialCounts[key] - count;
            for(let i=0; i<missing; i++) bCaps.push(key[1] as PieceType);
        }
    });

    setCapturedWhite(wCaps);
    setCapturedBlack(bCaps);
  }, [game]);


  const checkGameOver = useCallback(() => {
    if (game.isCheckmate()) {
        setGameStatus(`Checkmate! ${game.turn() === 'w' ? 'Black' : 'White'} wins.`);
    } else if (game.isDraw()) {
        setGameStatus('Draw!');
    } else if (game.isStalemate()) {
        setGameStatus('Stalemate!');
    } else if (game.inCheck()) {
        setGameStatus('Check!');
    } else {
        setGameStatus('Active');
    }
  }, [game]);

  const handleMove = async (from: string, to: string) => {
    if (game.isGameOver() || isAiThinking) return;

    try {
      const move = game.move({ from, to, promotion: 'q' });
      if (!move) return; // Invalid move

      setFen(game.fen());
      setLastMove({ from, to });
      updateCapturedPieces(game.history());
      checkGameOver();
      
      // Update Commentary (Async)
      getGameCommentary(game.fen(), move.san, game.history()).then(setCommentary);

      // AI Turn
      if (!game.isGameOver()) {
        setIsAiThinking(true);
        setTimeout(() => {
          makeAiMove();
        }, 500); // Small delay for realism
      }
    } catch (e) {
      console.error(e);
    }
  };

  const makeAiMove = useCallback(() => {
    const currentGame = gameRef.current; // Use ref to get latest state
    if (currentGame.isGameOver()) {
        setIsAiThinking(false);
        return;
    }

    // Run engine in a small timeout to not block UI rendering of the player move
    setTimeout(() => {
        const bestMoveSan = getBestMove(currentGame, difficulty);
        if (bestMoveSan) {
            const move = currentGame.move(bestMoveSan);
            setFen(currentGame.fen());
            setLastMove({ from: move.from, to: move.to });
            updateCapturedPieces(currentGame.history());
            checkGameOver();
            
            // AI Commentary occasionally
            if (Math.random() > 0.5) {
                getGameCommentary(currentGame.fen(), move.san, currentGame.history()).then(setCommentary);
            }
        }
        setIsAiThinking(false);
    }, 100);

  }, [difficulty, updateCapturedPieces, checkGameOver]);

  const resetGame = () => {
    const newGame = new Chess();
    setGame(newGame);
    setFen(newGame.fen());
    setLastMove(null);
    setCapturedWhite([]);
    setCapturedBlack([]);
    setCommentary("New game started. Show me what you've got!");
    setGameStatus("Active");
    setIsAiThinking(false);
  };

  const handleHint = async () => {
    const hint = await getHint(game.fen(), game.turn());
    setCommentary(`Coach: ${hint}`);
  };

  return (
    <div className="min-h-screen bg-gray-900 text-white flex flex-col items-center py-8 px-4">
      
      {/* Header */}
      <header className="mb-8 text-center">
        <h1 className="text-4xl font-extrabold tracking-tight bg-clip-text text-transparent bg-gradient-to-r from-emerald-400 to-cyan-500">
          Chess Practice
        </h1>
        <p className="text-gray-400 mt-2 text-sm">Powered by Gemini AI</p>
      </header>

      <div className="flex flex-col lg:flex-row gap-8 w-full max-w-6xl items-start justify-center">
        
        {/* Main Board Area */}
        <div className="flex flex-col gap-4 items-center w-full lg:w-auto">
            {/* Top Player Info (AI usually) */}
            <div className="w-full max-w-[600px] flex justify-between items-end px-2">
                <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-full bg-gradient-to-br from-red-500 to-purple-600 flex items-center justify-center text-xs font-bold shadow-lg">
                        Coach
                    </div>
                    <div>
                        <div className="font-semibold text-sm">Coach Bot</div>
                        <div className="text-xs text-gray-400">Level: {Difficulty[difficulty]}</div>
                    </div>
                </div>
                <CapturedPieces pieces={capturedWhite} color={PieceColor.WHITE} />
            </div>

            {/* The Board */}
            <Board 
                game={game} 
                onMove={handleMove} 
                orientation={playerColor} 
                lastMove={lastMove}
            />

            {/* Bottom Player Info (You) */}
            <div className="w-full max-w-[600px] flex justify-between items-start px-2">
                 <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-full bg-gradient-to-br from-blue-400 to-indigo-600 flex items-center justify-center text-xs font-bold shadow-lg">
                        You
                    </div>
                    <div>
                        <div className="font-semibold text-sm">You</div>
                        <div className="text-xs text-gray-400">{gameStatus}</div>
                    </div>
                </div>
                 <CapturedPieces pieces={capturedBlack} color={PieceColor.BLACK} />
            </div>
        </div>

        {/* Sidebar Controls */}
        <div className="w-full lg:w-80 flex flex-col gap-6">
            
            {/* Commentary Box */}
            <div className="bg-gray-800 rounded-xl p-6 border border-gray-700 shadow-xl relative overflow-hidden group">
                <div className="absolute top-0 right-0 p-4 opacity-10 group-hover:opacity-20 transition-opacity">
                    <svg className="w-16 h-16" fill="currentColor" viewBox="0 0 24 24"><path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm1 17h-2v-2h2v2zm2.07-7.75l-.9.92C13.45 12.9 13 13.5 13 15h-2v-.5c0-1.1.45-2.1 1.17-2.83l1.24-1.26c.37-.36.59-.86.59-1.41 0-1.1-.9-2-2-2s-2 .9-2 2H8c0-2.21 1.79-4 4-4s4 1.79 4 4c0 .88-.36 1.68-.93 2.25z"/></svg>
                </div>
                <h3 className="text-emerald-400 font-bold mb-2 flex items-center gap-2">
                    <span className="animate-pulse">●</span> Coach Commentary
                </h3>
                <p className="text-gray-300 text-sm leading-relaxed min-h-[60px] italic">
                    "{commentary}"
                </p>
                {isAiThinking && <p className="text-xs text-gray-500 mt-2 animate-pulse">Coach is thinking...</p>}
            </div>

            {/* Controls */}
            <div className="bg-gray-800 rounded-xl p-6 border border-gray-700 shadow-xl space-y-4">
                <h3 className="text-white font-bold mb-4">Game Controls</h3>
                
                <div>
                    <label className="text-xs text-gray-400 block mb-2">Difficulty</label>
                    <div className="grid grid-cols-3 gap-2">
                        {[Difficulty.EASY, Difficulty.MEDIUM, Difficulty.HARD].map((d) => (
                            <button
                                key={d}
                                onClick={() => setDifficulty(d)}
                                className={`
                                    py-2 px-3 text-xs font-medium rounded-lg transition-colors
                                    ${difficulty === d 
                                        ? 'bg-emerald-600 text-white shadow-lg' 
                                        : 'bg-gray-700 text-gray-400 hover:bg-gray-600'}
                                `}
                            >
                                {Difficulty[d]}
                            </button>
                        ))}
                    </div>
                </div>

                <div className="flex gap-2 pt-2">
                    <button 
                        onClick={resetGame}
                        className="flex-1 bg-red-500/10 hover:bg-red-500/20 text-red-400 border border-red-500/50 py-3 rounded-lg text-sm font-semibold transition-all hover:shadow-red-900/20"
                    >
                        Reset Game
                    </button>
                     <button 
                        onClick={handleHint}
                        className="flex-1 bg-indigo-500/10 hover:bg-indigo-500/20 text-indigo-400 border border-indigo-500/50 py-3 rounded-lg text-sm font-semibold transition-all"
                    >
                        Ask for Hint
                    </button>
                </div>

                 <div className="text-center mt-4 pt-4 border-t border-gray-700">
                    <p className="text-xs text-gray-500">
                        {gameStatus === 'Active' 
                            ? `${game.turn() === 'w' ? 'White' : 'Black'}'s Turn` 
                            : gameStatus}
                    </p>
                </div>
            </div>

        </div>
      </div>
    </div>
  );
};

export default App;