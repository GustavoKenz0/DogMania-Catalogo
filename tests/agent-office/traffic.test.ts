import assert from "node:assert/strict";
import { test } from "bun:test";
import {
  cornerPlants,
  meetingTables,
  officeDoors,
  roamAreas,
  workPlaces,
  type Position,
} from "../../Dogmania-Catalogo/src/features/admin/agent-office/officeLayout";
import {
  canWalk,
  distance,
  findOfficePath,
  nearestFloor,
  passesPet,
  petsOverlap,
} from "../../Dogmania-Catalogo/src/features/admin/agent-office/officeNavigation";
import {
  OfficeTraffic,
  type TrafficPlan,
} from "../../Dogmania-Catalogo/src/features/admin/agent-office/officeTraffic";

test("door openings connect the office, and an occupied door triggers a detour", () => {
  const spots: Position[] = [...roamAreas.flat(), ...meetingTables.flat()];
  for (let index = -1; index < 21; index++) spots.push(...workPlaces(index));
  const origin = nearestFloor(spots[0]);
  for (const point of spots) {
    const destination = nearestFloor(point);
    assert.ok(
      findOfficePath(origin, destination),
      "Unreachable destination: " + destination,
    );
  }

  for (const [x, y, length, axis] of officeDoors) {
    const from: Position =
      axis === "vertical" ? [x - 8, y + length / 2] : [x + length / 2, y - 8];
    const to: Position =
      axis === "vertical" ? [x + 8, y + length / 2] : [x + length / 2, y + 8];
    assert.ok(canWalk(from, to), "Door is too narrow: " + [x, y]);
  }

  const from: Position = [88.5, 76.5];
  const to: Position = [112.5, 58.5];
  const blocker: Position = [104.5, 76.5];
  const direct = findOfficePath(from, to);
  const detour = findOfficePath(from, to, [blocker]);
  assert.ok(direct?.every((point) => point[1] < 99));
  assert.ok(detour?.some((point) => point[1] > 100));
  assert.ok(
    detour?.every((point, index) => {
      const previous = detour[index - 1] ?? from;
      return canWalk(previous, point) && !passesPet(previous, point, blocker);
    }),
  );
});

test("a wide aisle lets an avatar pass beside an occupied center line", () => {
  const from: Position = [112.5, 109.5];
  const to: Position = [199.5, 109.5];
  const blocker: Position = [154.5, 109.5];
  const route = findOfficePath(from, to, [blocker]);
  assert.ok(route?.some((point) => point[1] >= 124.25));
  assert.ok(
    route?.every(
      (point, index) => !passesPet(route[index - 1] ?? from, point, blocker),
    ),
  );
});

for (const mode of ["rest", "work", "mixed"] as const) {
  test("22 avatars keep moving without overlap in " + mode + " mode", () => {
    const traffic = new OfficeTraffic();
    const plans: TrafficPlan[] = Array.from({ length: 22 }, (_, index) => {
      const working = mode === "work" || (mode === "mixed" && index % 2 === 0);
      const [seat, patrol] = workPlaces(index - 1);
      return {
        id: "pet-" + index,
        mode: working ? "work" : "rest",
        seat: working ? seat : undefined,
        patrol: working ? patrol : undefined,
      };
    });
    traffic.sync(plans);
    const pets = plans.map(({ id }) => traffic.get(id)!);
    assert.equal(new Set(pets.map(({ area }) => area)).size, 9);

    const traveled = pets.map(() => 0);
    const lastMovement = pets.map(() => 0);
    let doorCrossings = 0;
    for (let frame = 0; frame < 3600; frame++) {
      const before = pets.map(({ point }) => point);
      traffic.step(1 / 60);
      for (const [index, pet] of pets.entries()) {
        const previous = before[index];
        const length = distance(previous, pet.point);
        assert.ok(canWalk(previous, pet.point));
        traveled[index] += length;
        if (length > 0) lastMovement[index] = frame;
        assert.ok(
          frame - lastMovement[index] < 360,
          "Avatar stayed blocked: " + index,
        );

        for (let other = index + 1; other < pets.length; other++) {
          assert.ok(!petsOverlap(pet.point, pets[other].point));
        }
        const crossedDoor =
          (previous[0] - 98) * (pet.point[0] - 98) <= 0 &&
          previous[0] !== pet.point[0] &&
          ((pet.point[1] >= 70 && pet.point[1] <= 85) ||
            (pet.point[1] >= 104 && pet.point[1] <= 116));
        if (crossedDoor) doorCrossings++;
      }
      if (frame % 60 === 0) {
        const loads = new Map<number, number>();
        for (const { area } of pets)
          loads.set(area, (loads.get(area) ?? 0) + 1);
        assert.ok(loads.size >= 7 && Math.max(...loads.values()) <= 6);
      }
    }
    assert.ok(traveled.every((length) => length > 400));
    assert.ok(doorCrossings > 0);

    const stopped = pets.map(({ point }) => point);
    traffic.step(1 / 60, true);
    assert.deepEqual(
      pets.map(({ point }) => point),
      stopped,
    );
  });
}

test("two pets heading in opposite directions can clear a narrow doorway", () => {
  const traffic = new OfficeTraffic();
  const from: Position = [88.5, 76.5];
  const to: Position = [112.5, 76.5];
  traffic.sync([
    { id: "out", mode: "meeting", seat: to },
    { id: "in", mode: "meeting", seat: from },
  ]);
  const first = traffic.get("out")!;
  const second = traffic.get("in")!;
  first.point = from;
  second.point = to;
  for (let frame = 0; frame < 720; frame++) {
    traffic.step(1 / 60);
    assert.ok(!petsOverlap(first.point, second.point));
  }
  assert.ok(first.arrived && second.arrived);
});

test("meeting participants can reach the table while the rest of the office is moving", () => {
  const traffic = new OfficeTraffic();
  const plans: TrafficPlan[] = Array.from({ length: 22 }, (_, index) => ({
    id: "pet-" + index,
    mode: "rest",
  }));
  traffic.sync(plans);
  for (let frame = 0; frame < 323; frame++) traffic.step(1 / 60);
  traffic.sync(
    plans.map((plan, index) => {
      if (index === 2)
        return { ...plan, mode: "meeting", seat: meetingTables[0][1] };
      if (index === 3)
        return { ...plan, mode: "meeting", seat: meetingTables[0][0] };
      return plan;
    }),
  );
  const pets = plans.map(({ id }) => traffic.get(id)!);
  for (let frame = 0; frame < 1080; frame++) {
    traffic.step(1 / 60);
    for (const [index, pet] of pets.entries()) {
      for (let other = index + 1; other < pets.length; other++) {
        assert.ok(!petsOverlap(pet.point, pets[other].point));
      }
    }
    if (pets[2].arrived && pets[3].arrived) break;
  }
  assert.ok(pets[2].arrived && pets[3].arrived);
});

test("corner plants block navigation and pets vary their recent destinations", () => {
  assert.equal(cornerPlants.length, 4);
  for (const [x, y] of cornerPlants) {
    assert.ok((x < 30 || x > 280) && (y < 30 || y > 275));
    assert.ok(!canWalk([x, y], [x, y]));
  }

  const traffic = new OfficeTraffic();
  traffic.sync([{ id: "walker", mode: "rest" }]);
  const pet = traffic.get("walker")!;
  const stops: Position[] = [pet.point];
  let trip = 0;
  for (let frame = 0; frame < 3600; frame++) {
    traffic.step(1 / 60);
    if (pet.trips === trip) continue;
    trip = pet.trips;
    assert.ok(
      stops.slice(-2).every((point) => distance(point, pet.point) >= 9),
    );
    stops.push(pet.point);
  }
  assert.ok(stops.length >= 12);
  assert.ok(new Set(stops.map(String)).size >= 8);
});
