import { cellsOf, COLS, drop, dropInterval, fits, hardDrop, move, newGame, PIECES, rotate, ROWS, type Game, type PieceKind } from './blocks';

/** Same "random" sequence every run. */
const seeded = (seed = 1) => () => {
  seed = (seed * 16807) % 2147483647;
  return (seed - 1) / 2147483646;
};

const withPiece = (kind: PieceKind, over: Partial<Game> = {}): Game => {
  const g = newGame(seeded());
  return { ...g, piece: { kind, rot: 0, x: 3, y: 0 }, ...over };
};

describe('Block Drop', () => {
  it('starts with an empty board and a piece near the middle', () => {
    const g = newGame(seeded());
    expect(g.board).toHaveLength(ROWS);
    expect(g.board.every((row) => row.length === COLS && row.every((c) => c === 0))).toBe(true);
    expect(fits(g.board, g.piece)).toBe(true);
    expect(PIECES).toContain(g.next);
  });

  it('deals every shape once per set of seven', () => {
    let g = newGame(seeded(7));
    const seen: PieceKind[] = [g.piece.kind];
    for (let i = 0; i < 6; i++) {
      g = hardDrop(g, seeded(7)).game;
      seen.push(g.piece.kind);
    }
    expect(new Set(seen).size).toBe(7);
  });

  it('stops at the walls', () => {
    let g = withPiece('box');
    for (let i = 0; i < 20; i++) g = move(g, -1);
    expect(Math.min(...cellsOf(g.piece).map(([x]) => x))).toBe(0);
    for (let i = 0; i < 20; i++) g = move(g, 1);
    expect(Math.max(...cellsOf(g.piece).map(([x]) => x))).toBe(COLS - 1);
  });

  it('turns a piece and nudges it off a wall', () => {
    const g = withPiece('bar', { piece: { kind: 'bar', rot: 1, x: -2, y: 4 } });
    expect(fits(g.board, g.piece)).toBe(true);
    const turned = rotate(g);
    expect(turned.piece.rot).toBe(2);
    expect(fits(turned.board, turned.piece)).toBe(true);
  });

  it('a box turns in place', () => {
    const g = withPiece('box');
    expect(cellsOf(rotate(g).piece).sort()).toEqual(cellsOf(g.piece).sort());
  });

  it('lands a piece at the bottom and brings in the next one', () => {
    const g = withPiece('box');
    const { game, locked, cleared } = hardDrop(g, seeded());
    expect(locked).toBe(true);
    expect(cleared).toBe(0);
    expect(game.board[ROWS - 1].filter(Boolean)).toHaveLength(2);
    expect(game.piece.kind).toBe(g.next);
  });

  it('clears a full row and counts it', () => {
    const board = Array.from({ length: ROWS }, () => Array<number>(COLS).fill(0));
    // Bottom row full except two cells where a box will land.
    board[ROWS - 1] = Array(COLS).fill(1);
    board[ROWS - 1][3] = 0;
    board[ROWS - 1][4] = 0;
    const result = hardDrop(withPiece('box', { board, piece: { kind: 'box', rot: 0, x: 3, y: 0 } }), seeded());
    expect(result.cleared).toBe(1);
    expect(result.game.lines).toBe(1);
    // The box's top half drops into the bottom row.
    expect(result.game.board[ROWS - 1].filter(Boolean)).toHaveLength(2);
  });

  it('starts a fresh board instead of ending when there is no room', () => {
    // Blocks sit where the next piece appears; the current piece lands elsewhere without clearing a row.
    const board = Array.from({ length: ROWS }, () => Array<number>(COLS).fill(0));
    for (const y of [0, 1]) for (const x of [3, 4, 5, 6]) board[y][x] = 2;
    const g = withPiece('box', { board, next: 'box', piece: { kind: 'box', rot: 0, x: 0, y: 0 } });
    const { game, locked } = hardDrop(g, seeded());
    expect(locked).toBe(true);
    expect(game.resets).toBe(1);
    expect(game.board.every((row) => row.every((c) => c === 0))).toBe(true);
    expect(fits(game.board, game.piece)).toBe(true);
  });

  it('speeds up every 30 seconds and eases off after a fresh board', () => {
    expect([0, 29_999, 30_000, 90_000, 180_000].map((t) => dropInterval(t, 0))).toEqual([800, 800, 700, 500, 200]);
    expect(dropInterval(90_000, 1)).toBe(600);
    expect(dropInterval(10_000, 3)).toBe(800);
  });

  it('moves down one row at a time until it lands', () => {
    const g = withPiece('fork');
    const once = drop(g, seeded());
    expect(once.locked).toBe(false);
    expect(once.game.piece.y).toBe(1);
  });
});
