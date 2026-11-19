/**
 * Block Drop: a 3-minute falling-block puzzle that keeps visuospatial working memory busy, the
 * mechanism behind the craving-puzzle findings (docs/RESEARCH_QUIT_EVIDENCE.md, section 3).
 * Original names and art; no trademarked game. Pure: the screen only draws the state and calls
 * these functions. A full board never ends the session in failure: it clears and play goes on.
 */

export const COLS = 10;
export const ROWS = 20;
export const SESSION_MS = 3 * 60_000;

export const PIECES = ['bar', 'box', 'fork', 'hook', 'crook', 'zig', 'zag'] as const;
export type PieceKind = (typeof PIECES)[number];

type Cell = readonly [x: number, y: number];

/** Each shape inside its own square box (size n), so rotation turns it about the box. */
const SHAPES: Record<PieceKind, { n: number; cells: Cell[] }> = {
  bar: { n: 4, cells: [[0, 1], [1, 1], [2, 1], [3, 1]] },
  box: { n: 2, cells: [[0, 0], [1, 0], [0, 1], [1, 1]] },
  fork: { n: 3, cells: [[1, 0], [0, 1], [1, 1], [2, 1]] },
  hook: { n: 3, cells: [[2, 0], [0, 1], [1, 1], [2, 1]] },
  crook: { n: 3, cells: [[0, 0], [0, 1], [1, 1], [2, 1]] },
  zig: { n: 3, cells: [[1, 0], [2, 0], [0, 1], [1, 1]] },
  zag: { n: 3, cells: [[0, 0], [1, 0], [1, 1], [2, 1]] },
};

export interface Piece {
  kind: PieceKind;
  /** Quarter turns clockwise, 0..3. */
  rot: number;
  x: number;
  y: number;
}

export interface Game {
  /** ROWS rows of COLS cells, top row first: 0 = empty, otherwise 1 + the piece's index in PIECES. */
  board: number[][];
  piece: Piece;
  next: PieceKind;
  /** The rest of the current shuffled set of seven, so every shape comes up regularly. */
  bag: PieceKind[];
  lines: number;
  /** Times the board filled up and started fresh. Slows the speed back down. */
  resets: number;
}

export type Random = () => number;

const emptyBoard = () => Array.from({ length: ROWS }, () => Array<number>(COLS).fill(0));

function shuffledBag(random: Random): PieceKind[] {
  const bag = [...PIECES];
  for (let i = bag.length - 1; i > 0; i--) {
    const j = Math.floor(random() * (i + 1));
    [bag[i], bag[j]] = [bag[j], bag[i]];
  }
  return bag;
}

function take(bag: PieceKind[], random: Random): [PieceKind, PieceKind[]] {
  const pool = bag.length ? bag : shuffledBag(random);
  return [pool[0], pool.slice(1)];
}

function spawn(kind: PieceKind): Piece {
  return { kind, rot: 0, x: Math.floor((COLS - SHAPES[kind].n) / 2), y: 0 };
}

/** The board cells a piece covers. */
export function cellsOf(piece: Piece): Cell[] {
  const { n, cells } = SHAPES[piece.kind];
  return cells.map(([cx, cy]) => {
    let [x, y] = [cx, cy];
    for (let r = 0; r < ((piece.rot % 4) + 4) % 4; r++) [x, y] = [n - 1 - y, x];
    return [piece.x + x, piece.y + y] as const;
  });
}

export function fits(board: number[][], piece: Piece): boolean {
  return cellsOf(piece).every(([x, y]) => x >= 0 && x < COLS && y >= 0 && y < ROWS && board[y][x] === 0);
}

export function newGame(random: Random = Math.random): Game {
  const [first, bag1] = take([], random);
  const [next, bag] = take(bag1, random);
  return { board: emptyBoard(), piece: spawn(first), next, bag, lines: 0, resets: 0 };
}

export function move(game: Game, dx: number): Game {
  const piece = { ...game.piece, x: game.piece.x + dx };
  return fits(game.board, piece) ? { ...game, piece } : game;
}

/** Turns the piece clockwise, nudging it sideways if a wall or block is in the way. */
export function rotate(game: Game): Game {
  for (const kick of [0, -1, 1, -2, 2]) {
    const piece = { ...game.piece, rot: (game.piece.rot + 1) % 4, x: game.piece.x + kick };
    if (fits(game.board, piece)) return { ...game, piece };
  }
  return game;
}

export interface DropResult {
  game: Game;
  /** The piece landed and the next one appeared. */
  locked: boolean;
  /** Full rows removed by this landing. */
  cleared: number;
}

/** One row down; if it can't go further, the piece lands, full rows clear and the next piece comes in. */
export function drop(game: Game, random: Random = Math.random): DropResult {
  const lower = { ...game.piece, y: game.piece.y + 1 };
  if (fits(game.board, lower)) return { game: { ...game, piece: lower }, locked: false, cleared: 0 };

  const board = game.board.map((row) => row.slice());
  const colour = PIECES.indexOf(game.piece.kind) + 1;
  for (const [x, y] of cellsOf(game.piece)) board[y][x] = colour;
  const kept = board.filter((row) => row.some((c) => c === 0));
  const cleared = ROWS - kept.length;
  const settled = [...Array.from({ length: cleared }, () => Array<number>(COLS).fill(0)), ...kept];

  const [after, bag] = take(game.bag, random);
  const piece = spawn(game.next);
  const landed: Game = { ...game, board: settled, piece, next: after, bag, lines: game.lines + cleared };
  // No room for the next piece: start a fresh board rather than ending the session.
  if (!fits(settled, piece)) return { game: { ...landed, board: emptyBoard(), resets: game.resets + 1 }, locked: true, cleared };
  return { game: landed, locked: true, cleared };
}

/** Drops the piece straight to where it lands. */
export function hardDrop(game: Game, random: Random = Math.random): DropResult {
  let current = game;
  for (let i = 0; i <= ROWS; i++) {
    const result = drop(current, random);
    if (result.locked) return result;
    current = result.game;
  }
  return drop(current, random);
}

/**
 * Milliseconds between automatic steps down: faster every 30 seconds so it stays demanding, and a
 * level slower after each fresh board so it stays possible.
 */
export function dropInterval(elapsedMs: number, resets: number): number {
  const level = Math.max(0, Math.floor(Math.max(0, elapsedMs) / 30_000) - resets);
  return Math.max(200, 800 - level * 100);
}
