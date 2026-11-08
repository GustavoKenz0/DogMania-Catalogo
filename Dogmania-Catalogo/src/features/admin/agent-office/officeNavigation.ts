import {
  furniture,
  interiorWindows,
  officePartitions,
  officeSize,
  petSize,
  plantFootprints,
  type Position,
  type Rect,
} from "./officeLayout";

const tileSize = 3;
const columns = officeSize / tileSize;
const cells = columns * columns;
const wallClearance = petSize / 2;
export const petClearance = petSize + 0.75;
const walls: readonly Rect[] = [
  ...officePartitions,
  ...interiorWindows.map(([x, y, width]): Rect => [x, y, width, 7]),
  ...furniture,
  ...plantFootprints,
];

export function distance(from: Position, to: Position) {
  return Math.hypot(to[0] - from[0], to[1] - from[1]);
}

export function petsOverlap(from: Position, to: Position) {
  return Math.abs(from[0] - to[0]) < petClearance && Math.abs(from[1] - to[1]) < petClearance;
}

function crossesBox(
  [ax, ay]: Position,
  [bx, by]: Position,
  left: number,
  top: number,
  right: number,
  bottom: number,
) {
  const dx = bx - ax;
  const dy = by - ay;
  if ((!dx && (ax <= left || ax >= right)) || (!dy && (ay <= top || ay >= bottom))) return false;
  const x1 = dx ? (left - ax) / dx : -Infinity;
  const x2 = dx ? (right - ax) / dx : Infinity;
  const y1 = dy ? (top - ay) / dy : -Infinity;
  const y2 = dy ? (bottom - ay) / dy : Infinity;
  return (
    Math.max(0, Math.min(x1, x2), Math.min(y1, y2)) <
    Math.min(1, Math.max(x1, x2), Math.max(y1, y2))
  );
}

export function canWalk(from: Position, to: Position) {
  const [x, y] = to;
  if (
    x < 14 + wallClearance ||
    x > 298 - wallClearance ||
    y < 14 + wallClearance ||
    y > 294 - wallClearance
  ) {
    return false;
  }
  return !walls.some(([left, top, width, height]) =>
    crossesBox(
      from,
      to,
      left - wallClearance,
      top - wallClearance,
      left + width + wallClearance,
      top + height + wallClearance,
    ),
  );
}

export function passesPet(from: Position, to: Position, [x, y]: Position) {
  return (
    petsOverlap(to, [x, y]) ||
    crossesBox(from, to, x - petClearance, y - petClearance, x + petClearance, y + petClearance)
  );
}

const points: Position[] = Array.from({ length: cells }, (_, cell) => [
  ((cell % columns) + 0.5) * tileSize,
  (Math.floor(cell / columns) + 0.5) * tileSize,
]);

const floor = Uint8Array.from(points, (point) => Number(canWalk(point, point)));
const graph = points.map((_, cell) => {
  if (!floor[cell]) return [];
  const column = cell % columns;
  return [
    column > 0 ? cell - 1 : -1,
    column < columns - 1 ? cell + 1 : -1,
    cell - columns,
    cell + columns,
  ].filter((next) => floor[next]);
});

function closestCell(point: Position, open: (cell: number) => boolean) {
  const centerX = Math.floor(point[0] / tileSize);
  const centerY = Math.floor(point[1] / tileSize);
  let closest = -1;
  let best = Infinity;
  for (let y = Math.max(0, centerY - 5); y <= Math.min(columns - 1, centerY + 5); y++) {
    for (let x = Math.max(0, centerX - 5); x <= Math.min(columns - 1, centerX + 5); x++) {
      const cell = y * columns + x;
      const length = distance(point, points[cell]);
      if (length < best && floor[cell] && open(cell)) {
        closest = cell;
        best = length;
      }
    }
  }
  return closest;
}

const floorByPoint = new WeakMap<Position, Position>();

export function nearestFloor(point: Position) {
  const cached = floorByPoint.get(point);
  if (cached) return cached;
  const result = points[closestCell(point, () => true)];
  floorByPoint.set(point, result);
  return result;
}

class Frontier {
  private nodes: { cell: number; score: number }[] = [];

  push(cell: number, score: number) {
    const item = { cell, score };
    let index = this.nodes.length;
    this.nodes.push(item);
    while (index > 0) {
      const parent = Math.floor((index - 1) / 2);
      if (this.nodes[parent].score <= score) break;
      this.nodes[index] = this.nodes[parent];
      index = parent;
    }
    this.nodes[index] = item;
  }

  pop() {
    const first = this.nodes[0];
    const last = this.nodes.pop();
    if (!last || !this.nodes.length) return first;
    let index = 0;
    while (index * 2 + 1 < this.nodes.length) {
      const left = index * 2 + 1;
      const right = left + 1;
      const child =
        right < this.nodes.length && this.nodes[right].score < this.nodes[left].score
          ? right
          : left;
      if (this.nodes[child].score >= last.score) break;
      this.nodes[index] = this.nodes[child];
      index = child;
    }
    this.nodes[index] = last;
    return first;
  }
}

function blockedCells(blockers: readonly Position[]) {
  const blocked = new Uint8Array(cells);
  for (const [x, y] of blockers) {
    const left = Math.max(0, Math.floor((x - petClearance) / tileSize));
    const right = Math.min(columns - 1, Math.floor((x + petClearance) / tileSize));
    const top = Math.max(0, Math.floor((y - petClearance) / tileSize));
    const bottom = Math.min(columns - 1, Math.floor((y + petClearance) / tileSize));
    for (let row = top; row <= bottom; row++) {
      for (let col = left; col <= right; col++) {
        const cell = row * columns + col;
        if (petsOverlap(points[cell], [x, y])) blocked[cell] = 1;
      }
    }
  }
  return blocked;
}

function smoothPath(from: Position, route: Position[], blockers: readonly Position[]) {
  const smoothed: Position[] = [];
  let point = from;
  for (let index = 0; index < route.length;) {
    let next = Math.min(route.length - 1, index + 12);
    while (
      next > index &&
      (!canWalk(point, route[next]) || blockers.some((pet) => passesPet(point, route[next], pet)))
    )
      next--;
    point = route[next];
    smoothed.push(point);
    index = next + 1;
  }
  return smoothed;
}

export function findOfficePath(from: Position, to: Position, blockers: readonly Position[] = []) {
  const blocked = blockedCells(blockers);
  const start = closestCell(
    from,
    (cell) =>
      !blocked[cell] &&
      canWalk(from, points[cell]) &&
      !blockers.some((pet) => passesPet(from, points[cell], pet)),
  );
  const goal = closestCell(to, () => true);
  if (start < 0 || goal < 0 || blocked[goal]) return undefined;
  const [gx, gy] = points[goal];
  const costs = new Float32Array(cells).fill(Infinity);
  const parents = new Int32Array(cells).fill(-1);
  const settled = new Uint8Array(cells);
  const frontier = new Frontier();
  costs[start] = 0;
  frontier.push(start, 0);
  for (let item = frontier.pop(); item; item = frontier.pop()) {
    const { cell } = item;
    if (settled[cell]) continue;
    if (cell === goal) {
      const route: Position[] = [];
      for (let next = goal; next >= 0; next = parents[next]) route.push(points[next]);
      return smoothPath(from, route.reverse(), blockers);
    }
    settled[cell] = 1;
    for (const next of graph[cell]) {
      if (blocked[next] || settled[next] || costs[next] <= costs[cell] + tileSize) continue;
      costs[next] = costs[cell] + tileSize;
      parents[next] = cell;
      const [x, y] = points[next];
      frontier.push(next, costs[next] + Math.abs(gx - x) + Math.abs(gy - y));
    }
  }
  return undefined;
}
