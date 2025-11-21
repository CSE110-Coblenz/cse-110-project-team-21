// Minimal-change WordBlockDrop core logic.
// Grid = 10x15, orthogonal (4-connected) clear, +1 point per clear, +1 heart every 5 points.

export type Category = "noun" | "verb" | "adj";

export interface WordBlock {
  id: string;
  word: string;
  cat: Category;
  row: number;
  col: number;
  settled: boolean;
}

const GRID_COLS = 8;
const GRID_ROWS = 10;

// Tiny word bank (you can swap in your own later)
const NOUNS = ["cat","tree","river","cloud","lemon","desk","book","music","stone","car"];
const VERBS = ["run","jump","read","code","sing","draw","spin","bake","swim","play"];
const ADJS  = ["red","fast","soft","loud","bright","sweet","round","cold","brave","clean"];

function randCat(): Category {
  return (["noun","verb","adj"] as Category[])[Math.floor(Math.random()*3)];
}
function wordFor(cat: Category): string {
  if (cat === "noun") return NOUNS[Math.floor(Math.random()*NOUNS.length)];
  if (cat === "verb") return VERBS[Math.floor(Math.random()*VERBS.length)];
  return ADJS[Math.floor(Math.random()*ADJS.length)];
}

export class WordsDropGameModel {
  grid: (WordBlock | null)[][];
  current: WordBlock | null = null;

  score = 0;
  hearts = 0;
  timeLeft = 90;      // seconds
  running = false;

  constructor(startTimeSec = 90) {
    this.grid = Array.from({ length: GRID_ROWS }, () =>
      Array.from({ length: GRID_COLS }, () => null)
    );
    this.timeLeft = startTimeSec;
  }

  get cols() { return GRID_COLS; }
  get rows() { return GRID_ROWS; }

  spawn(): WordBlock | null {
    const cat = randCat();
    const word = wordFor(cat);
    const col = Math.floor(GRID_COLS / 2);
    if (this.grid[0][col]) return null; // overflow
    const block: WordBlock = {
      id: crypto.randomUUID(),
      word, cat, row: 0, col, settled: false
    };
    this.current = block;
    return block;
  }

  move(dx: number) {
    if (!this.current) return;
    const next = this.current.col + dx;
    if (next < 0 || next >= GRID_COLS) return;
    this.current.col = next;
  }

  hardDrop(): { cleared: number; overflow: boolean } {
    if (!this.current) return { cleared: 0, overflow: false };

    // find landing row in same column
    let r = 0;
    while (r + 1 < GRID_ROWS && !this.grid[r + 1][this.current.col]) r++;

    if (this.grid[0][this.current.col] && r === 0) {
      // target column top is already occupied -> overflow
      return { cleared: 0, overflow: true };
    }

    this.current.row = r;
    this.current.settled = true;
    this.grid[r][this.current.col] = this.current;

    const cleared = this.clearClustersAt(r, this.current.col);

    this.current = null;
    return { cleared, overflow: false };
  }

  private clearClustersAt(row: number, col: number): number {
    const start = this.grid[row][col];
    if (!start) return 0;

    const targetCat = start.cat;
    const visited = new Set<string>();
    const stack: [number, number][] = [[row, col]];
    const cluster: [number, number][] = [];
    const key = (r: number, c: number) => `${r}:${c}`;

    while (stack.length) {
      const [r, c] = stack.pop()!;
      if (r < 0 || r >= GRID_ROWS || c < 0 || c >= GRID_COLS) continue;
      const k = key(r, c);
      if (visited.has(k)) continue;
      visited.add(k);

      const cell = this.grid[r][c];
      if (!cell || cell.cat !== targetCat) continue;

      cluster.push([r, c]);
      // orthogonal neighbors only
      stack.push([r - 1, c], [r + 1, c], [r, c - 1], [r, c + 1]);
    }

    if (cluster.length >= 4) {
      // clear
      for (const [r, c] of cluster) this.grid[r][c] = null;
      // gravity collapse each column
      for (let c = 0; c < GRID_COLS; c++) this.collapseColumn(c);
      return 1; // one clear event yields +1 point
    }
    return 0;
  }

  private collapseColumn(c: number) {
    let write = GRID_ROWS - 1;
    for (let r = GRID_ROWS - 1; r >= 0; r--) {
      const cell = this.grid[r][c];
      if (cell) {
        if (write !== r) {
          this.grid[write][c] = cell;
          cell.row = write;
          this.grid[r][c] = null;
        }
        write--;
      }
    }
  }
}
