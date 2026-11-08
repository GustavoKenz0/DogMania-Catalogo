import { roamAreas, type Position } from "./officeLayout";
import {
  canWalk,
  distance,
  findOfficePath,
  nearestFloor,
  passesPet,
  petsOverlap,
} from "./officeNavigation";

export type TrafficPlan = {
  id: string;
  mode: "rest" | "work" | "meeting";
  seat?: Position;
  patrol?: Position;
};

type Walker = {
  plan: TrafficPlan;
  order: number;
  point: Position;
  area: number;
  trips: number;
  recentStops: Position[];
  goal?: Position;
  path: Position[];
  readyAt: number;
  planAfter: number;
  blocking?: Walker;
  blockedAt?: number;
  yielding: boolean;
  direction: "left" | "right" | "forward";
  moving: boolean;
  arrived: boolean;
};

const areas = roamAreas.map((area) => [...new Set(area.map(nearestFloor))]);
const restDestinations = areas.flatMap((area, index) => area.map((point) => ({ point, index })));
const speed = 38;
const retryDelay = 0.26;

function rememberStop(pet: Walker, point: Position) {
  pet.recentStops = [...pet.recentStops.filter((stop) => distance(stop, point) >= 9), point].slice(
    -5,
  );
}

function visitedRecently(pet: Walker, point: Position) {
  return pet.recentStops.some((stop) => distance(stop, point) < 9);
}

function samePoint(a: Position | undefined, b: Position | undefined) {
  return a === b || (a?.[0] === b?.[0] && a?.[1] === b?.[1]);
}

export class OfficeTraffic {
  private walkers = new Map<string, Walker>();
  private time = 0;
  private serial = 0;

  get(id: string) {
    return this.walkers.get(id);
  }

  sync(plans: TrafficPlan[]) {
    const ids = new Set(plans.map(({ id }) => id));
    for (const id of this.walkers.keys()) {
      if (!ids.has(id)) this.walkers.delete(id);
    }

    for (const plan of plans) {
      const pet = this.walkers.get(plan.id);
      if (pet) {
        const changed = pet.plan.mode !== plan.mode || !samePoint(pet.plan.seat, plan.seat);
        pet.plan = plan;
        if (changed) {
          pet.goal = undefined;
          pet.path = [];
          pet.planAfter = this.time;
          pet.readyAt = this.time;
          pet.blocking = undefined;
          pet.blockedAt = undefined;
          pet.yielding = false;
          pet.arrived = false;
        }
        continue;
      }

      const order = this.serial++;
      const others = [...this.walkers.values()];
      const initialArea = order % areas.length;
      const areaOrder = areas.map((_, i) => (i + initialArea) % areas.length);
      const area = areaOrder.find((i) =>
        areas[i].some((point) => others.every((other) => !petsOverlap(point, other.point))),
      );
      if (area === undefined) continue;
      const point = areas[area].find((spot) =>
        others.every((other) => !petsOverlap(spot, other.point)),
      )!;
      this.walkers.set(plan.id, {
        plan,
        order,
        point,
        area,
        trips: 0,
        recentStops: [point],
        path: [],
        readyAt: this.time + 0.17 + (order % 7) * 0.11,
        planAfter: 0,
        yielding: false,
        direction: "forward",
        moving: false,
        arrived: false,
      });
    }
  }

  step(seconds: number, paused = false) {
    const delta = Math.min(seconds, 0.06);
    if (!paused) this.time += delta;
    const pets = [...this.walkers.values()].sort(
      (a, b) => Number(b.plan.mode === "meeting") - Number(a.plan.mode === "meeting"),
    );
    for (const pet of pets) {
      pet.moving = false;
      if (paused || this.time < pet.readyAt) continue;
      this.advance(
        pet,
        pets.filter((other) => other !== pet),
        delta,
      );
    }
  }

  private advance(pet: Walker, others: Walker[], delta: number) {
    if (!pet.goal) {
      const { mode, seat } = pet.plan;
      pet.arrived = false;
      if (mode === "meeting" && seat) {
        pet.goal = nearestFloor(seat);
      } else if (
        !(mode === "work" && pet.trips % 3 === 0 && this.planWorkVisit(pet, others)) &&
        !this.planOfficeTrip(pet, others)
      ) {
        pet.blockedAt ??= this.time;
        if (!this.planNearbyTrip(pet, others)) {
          pet.readyAt = this.time + 0.4 + (pet.order % 4) * 0.1;
          return;
        }
      }
    }
    if (!pet.goal) return;

    if (!pet.yielding && distance(pet.point, pet.goal) < 0.05) {
      pet.arrived = true;
      pet.blockedAt = undefined;
      pet.path = [];
      pet.blocking = undefined;
      if (pet.plan.mode !== "meeting") {
        rememberStop(pet, pet.goal);
        pet.goal = undefined;
        pet.trips++;
        pet.readyAt = this.time + 0.25 + ((pet.order + pet.trips) % 5) * 0.09;
      }
      return;
    }

    if (!pet.path.length && pet.yielding) {
      pet.yielding = false;
      if (pet.plan.mode !== "meeting") {
        rememberStop(pet, pet.goal);
        pet.goal = undefined;
        pet.blockedAt = undefined;
        pet.blocking = undefined;
      }
      pet.readyAt = this.time + 0.52;
      return;
    }

    if (!pet.path.length) {
      if (this.time < pet.planAfter) return;
      pet.planAfter = this.time + retryDelay + (pet.order % 4) * 0.025;
      const positions = others.map(({ point }) => point);
      const routeBlockers =
        pet.plan.mode === "meeting" ? (pet.blocking ? [pet.blocking.point] : []) : positions;
      const detour = findOfficePath(pet.point, pet.goal, routeBlockers);
      if (!detour) pet.blockedAt ??= this.time;
      const stalled = pet.blockedAt !== undefined && this.time - pet.blockedAt > 1.25;
      if (stalled && pet.plan.mode !== "meeting") {
        rememberStop(pet, pet.goal);
        if (this.planOfficeTrip(pet, others, pet.goal) || this.planNearbyTrip(pet, others)) return;
      }

      if (detour) {
        pet.path = detour;
      } else if (pet.blocking) {
        const blocker = pet.blocking;
        if (pet.plan.mode === "meeting") this.makeRoom(blocker, pet, others);
        const yields =
          (pet.plan.mode !== "meeting" && blocker.plan.mode === "meeting") ||
          (pet.plan.mode === blocker.plan.mode && pet.order > blocker.order) ||
          (pet.plan.mode !== "meeting" &&
            blocker.plan.mode !== "meeting" &&
            pet.order > blocker.order);
        const waitingForPassage =
          pet.plan.mode === "meeting" &&
          pet.blockedAt !== undefined &&
          this.time - pet.blockedAt > 2;
        if ((yields && blocker.goal) || waitingForPassage) {
          const refuge = this.stepAside(pet.point, blocker.point, positions);
          if (refuge) {
            pet.path = [refuge];
            pet.yielding = true;
          }
        }
        if (!pet.path.length) return;
      } else {
        pet.path = findOfficePath(pet.point, pet.goal) ?? [];
      }
      while (pet.path.length && distance(pet.point, pet.path[0]) < 0.05) pet.path.shift();
    }

    const next = pet.path[0];
    if (!next) return;
    const length = distance(pet.point, next);
    const velocity = pet.plan.mode === "meeting" ? 70 : speed;
    const ratio = Math.min(1, (velocity * delta) / length);
    const [x, y] = pet.point;
    if (pet.plan.mode === "meeting") {
      const lead = Math.min(1, 19 / length);
      const approaching: Position = [x + (next[0] - x) * lead, y + (next[1] - y) * lead];
      const ahead = others.find((other) => passesPet(pet.point, approaching, other.point));
      if (ahead) this.makeRoom(ahead, pet, others);
    }
    const proposal: Position = [x + (next[0] - x) * ratio, y + (next[1] - y) * ratio];
    const blocker = others.find((other) => passesPet(pet.point, proposal, other.point));
    if (blocker || !canWalk(pet.point, proposal)) {
      pet.blocking = blocker;
      pet.blockedAt ??= this.time;
      if (blocker && pet.plan.mode === "meeting") {
        this.makeRoom(blocker, pet, others);
        if (this.time - pet.blockedAt < 0.75) return;
      }
      pet.path = [];
      pet.yielding = false;
      return;
    }

    pet.blocking = undefined;
    if (pet.plan.mode === "meeting") pet.blockedAt = undefined;
    pet.point = proposal;
    pet.direction = proposal[0] < x - 0.05 ? "left" : proposal[0] > x + 0.05 ? "right" : "forward";
    pet.moving = true;
    if (ratio === 1) pet.path.shift();
  }

  private planWorkVisit(pet: Walker, others: Walker[]) {
    const seat = (pet.trips % 2 === 1 ? pet.plan.patrol : undefined) ?? pet.plan.seat;
    if (!seat) return false;
    const point = nearestFloor(seat);
    if (
      distance(pet.point, point) < 8 ||
      visitedRecently(pet, point) ||
      others.some(
        (other) =>
          petsOverlap(point, other.point) || (other.goal && petsOverlap(point, other.goal)),
      )
    )
      return false;
    const path = findOfficePath(
      pet.point,
      point,
      others.map(({ point }) => point),
    );
    if (!path) return false;
    pet.area = restDestinations.reduce((nearest, candidate) =>
      distance(point, candidate.point) < distance(point, nearest.point) ? candidate : nearest,
    ).index;
    this.setTrip(pet, point, path);
    return true;
  }

  private setTrip(pet: Walker, goal: Position, path: Position[]) {
    pet.goal = goal;
    pet.path = path.filter((point) => distance(pet.point, point) >= 0.05);
    pet.blockedAt = undefined;
    pet.blocking = undefined;
  }

  private planOfficeTrip(pet: Walker, others: Walker[], avoid?: Position) {
    const loads = areas.map(
      (_, index) =>
        others.filter((other) => other.plan.mode !== "meeting" && other.area === index).length,
    );
    const available = restDestinations.filter(
      ({ point }) =>
        distance(pet.point, point) >= 12 &&
        !samePoint(point, avoid) &&
        others.every(
          (other) =>
            !petsOverlap(point, other.point) &&
            (!other.goal || !petsOverlap(point, other.goal)) &&
            (other.plan.mode !== "meeting" ||
              !other.plan.seat ||
              !petsOverlap(point, nearestFloor(other.plan.seat))),
        ),
    );
    const score = ({ point, index }: (typeof available)[number]) =>
      loads[index] * 95 +
      distance(pet.point, point) * 0.34 +
      (pet.trips % 3 === 2 ? Number(index === pet.area) * 70 : Number(index !== pet.area) * 46);
    const fresh = available.filter(({ point }) => !visitedRecently(pet, point));
    fresh.sort((a, b) => score(a) - score(b));
    const closest = [...fresh].sort(
      (a, b) => distance(pet.point, a.point) - distance(pet.point, b.point),
    );
    const lastTwo = pet.recentStops.slice(-2);
    const older = available.filter(
      ({ point }) =>
        visitedRecently(pet, point) && lastTwo.every((stop) => distance(stop, point) >= 9),
    );
    older.sort((a, b) => score(a) - score(b));
    const positions = others.map(({ point }) => point);
    for (const candidate of new Set([
      ...fresh.slice(0, 6),
      ...closest.slice(0, 4),
      ...older.slice(0, 3),
    ])) {
      const path = findOfficePath(pet.point, candidate.point, positions);
      if (!path) continue;
      pet.area = candidate.index;
      this.setTrip(pet, candidate.point, path);
      return true;
    }
    return false;
  }

  private planNearbyTrip(pet: Walker, others: Walker[]) {
    const [x, y] = pet.point;
    const crowded = pet.blockedAt !== undefined && this.time - pet.blockedAt > 2;
    let fallback: Position | undefined;
    for (const reach of [25, 19, 13, 8]) {
      for (let turn = 0; turn < 16; turn++) {
        const angle = ((pet.order + pet.trips + turn) % 16) * (Math.PI / 8);
        const point = nearestFloor([x + reach * Math.cos(angle), y + reach * Math.sin(angle)]);
        if (
          !point ||
          distance(pet.point, point) < 7 ||
          !canWalk(pet.point, point) ||
          others.some(
            (other) =>
              passesPet(pet.point, point, other.point) ||
              (other.goal && petsOverlap(point, other.goal)),
          )
        )
          continue;
        if (!visitedRecently(pet, point)) {
          this.setTrip(pet, point, [point]);
          return true;
        }
        if (crowded && !fallback && distance(point, pet.recentStops.at(-1) ?? pet.point) >= 9) {
          fallback = point;
        }
      }
    }
    if (!fallback) return false;
    this.setTrip(pet, fallback, [fallback]);
    return true;
  }

  private makeRoom(blocker: Walker, passing: Walker, nearby: Walker[]) {
    if (blocker.plan.mode === "meeting" || blocker.yielding) return;
    const positions = [
      passing.point,
      ...nearby.filter((other) => other !== blocker).map(({ point }) => point),
    ];
    const refuge = this.stepAside(blocker.point, passing.point, positions);
    if (!refuge) return;
    blocker.goal ??= blocker.point;
    blocker.path = [refuge];
    blocker.yielding = true;
    blocker.readyAt = this.time;
    blocker.arrived = false;
  }

  private stepAside(from: Position, blocker: Position, others: Position[]) {
    const [x, y] = from;
    const away = Math.atan2(y - blocker[1], x - blocker[0]);
    for (const length of [13, 8, 5]) {
      for (const angle of [Math.PI / 2, -Math.PI / 2, Math.PI / 4, -Math.PI / 4, 0]) {
        const point: Position = [
          x + length * Math.cos(away + angle),
          y + length * Math.sin(away + angle),
        ];
        if (canWalk(from, point) && others.every((other) => !passesPet(from, point, other))) {
          return point;
        }
      }
    }
    return undefined;
  }
}
