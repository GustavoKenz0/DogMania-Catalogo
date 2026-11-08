export type ActivityType = "started" | "stopped" | "ended" | "delegated" | "working" | "contact";

export type OfficeSnapshot = {
  participants: { id: string; profile: string; working: boolean; at: number }[];
  activities: { id: string; actor: string; peer?: string; type: ActivityType; at: number }[];
  lastEventAt?: number;
  now: number;
};

const profiles = [
  ["orchestrator", "Orquestrador", "dog", "#e8a752", "star"],
  ["software-engineering", "Engenharia", "dog", "#ea886a", "gear"],
  ["frontend", "Front-end", "cat", "#ed8ac7", "brush"],
  ["backend", "Back-end", "dog", "#70b5ed", "code"],
  ["database", "Banco de dados", "cat", "#7ccb91", "stack"],
  ["qa-sdet", "Testes", "dog", "#d4b18a", "check"],
  ["tech-lead", "Liderança técnica", "cat", "#a999f0", "star"],
  ["senior-development", "Dev sênior", "dog", "#e29a6c", "code"],
  ["mid-development", "Dev pleno", "dog", "#83c8d7", "code"],
  ["junior-development", "Dev júnior", "cat", "#a4d77e", "code"],
  ["product-design", "Design de produto", "cat", "#b493ed", "brush"],
  ["product-owner", "Produto", "dog", "#f0be7b", "star"],
  ["product-data-analytics", "Análise de dados", "cat", "#75d5c9", "stack"],
  ["requirements-engineering", "Requisitos", "cat", "#8ebee9", "page"],
  ["appsec-security", "Segurança", "dog", "#8e99ec", "shield"],
  ["devops-sre", "DevOps / SRE", "dog", "#63cfc6", "gear"],
  ["code-reviewer", "Revisão de código", "cat", "#d797e9", "check"],
  ["quality-auditor", "Auditoria de qualidade", "dog", "#f19da2", "check"],
  ["technical-writing", "Documentação", "cat", "#aeb5ef", "page"],
  ["scrum-master", "Scrum Master", "cat", "#f4b980", "star"],
  ["engineering-management", "Gestão de engenharia", "dog", "#dc9aba", "gear"],
  ["legal-counsel", "Jurídico", "cat", "#c2a4f1", "shield"],
] as const;

const aliases: Record<string, string> = {
  engineer: "software-engineering",
  engenheiro: "software-engineering",
  tester: "qa-sdet",
  qa: "qa-sdet",
  front_end: "frontend",
  "front-end": "frontend",
  back_end: "backend",
  "back-end": "backend",
  db: "database",
};

const resolveProfile = (profile: string) =>
  Object.hasOwn(aliases, profile) ? aliases[profile] : profile;

type Profile = (typeof profiles)[number];
export type Creature = Profile[2];
export type Badge = Profile[4];
export type OfficeAgent = {
  id: string;
  slot: string;
  name: string;
  shape: Creature;
  color: string;
  badge: Badge;
  working: boolean;
};

const genericShapes = ["cat", "dog"] as const;
const genericColors = ["#e09ad6", "#91bef1", "#a9d389", "#bca7ef", "#f6af80"];

function character(
  id: string,
  slot: string,
  profile: Profile | undefined,
  name: string,
  working: boolean,
): OfficeAgent {
  const variant = Number.parseInt(id.slice(0, 2), 16) % genericShapes.length || 0;
  return {
    id,
    slot,
    name,
    shape: profile?.[2] ?? genericShapes[variant],
    color: profile?.[3] ?? genericColors[variant],
    badge: profile?.[4] ?? "star",
    working,
  };
}

export function buildTeam(snapshot: OfficeSnapshot | undefined) {
  const participants = snapshot?.participants ?? [];
  const claimed = new Set<string>();
  const names = new Map<string, string>();
  const team = profiles.map((profile) => {
    const matches = participants.filter((agent) => resolveProfile(agent.profile) === profile[0]);
    matches.sort((a, b) => Number(b.working) - Number(a.working) || b.at - a.at);
    const primary = matches[0];
    if (primary) {
      claimed.add(primary.id);
      names.set(primary.id, profile[1]);
    }
    return character(
      primary?.id ?? profile[0],
      profile[0],
      profile,
      profile[1],
      primary?.working ?? false,
    );
  });

  for (const agent of participants) {
    if (claimed.has(agent.id)) continue;
    const profile = profiles.find(([key]) => key === resolveProfile(agent.profile));
    const name = [profile?.[1] ?? "Subagente", agent.id.slice(0, 4).toUpperCase()].join(" · ");
    names.set(agent.id, name);
    if (agent.working || (snapshot && agent.at > snapshot.now - 30 * 60_000)) {
      team.push(character(agent.id, agent.id, profile, name, agent.working));
    }
  }

  return { team, names };
}

const meetingDuration = 24_000;
const meetingHistory = 90_000;

export function getMeetings(snapshot: OfficeSnapshot | undefined, team: OfficeAgent[]) {
  if (!snapshot) return [];
  const working = new Set(team.filter((agent) => agent.working).map((agent) => agent.id));
  const lastRest = new Map<string, number>();
  for (const event of snapshot.activities) {
    if ((event.type === "stopped" || event.type === "ended") && !lastRest.has(event.actor)) {
      lastRest.set(event.actor, event.at);
    }
  }

  const busyUntil = new Map<string, number>();
  const rooms = [0, 0];
  const meetings: { first: string; second: string; lane: number; incoming: boolean }[] = [];

  // Queue overlaps so a character is in at most one meeting at a time.
  for (const event of [...snapshot.activities].reverse()) {
    if (snapshot.now - event.at > meetingHistory) continue;
    if (event.type !== "delegated" && event.type !== "contact") continue;
    const peer = event.peer;
    if (!peer || !working.has(event.actor) || !working.has(peer)) continue;
    if (event.at <= Math.max(lastRest.get(event.actor) ?? 0, lastRest.get(peer) ?? 0)) continue;
    const lane = rooms[0] <= rooms[1] ? 0 : 1;
    const start = Math.max(
      event.at,
      rooms[lane],
      busyUntil.get(event.actor) ?? 0,
      busyUntil.get(peer) ?? 0,
    );
    const end = start + meetingDuration;
    rooms[lane] = end;
    busyUntil.set(event.actor, end);
    busyUntil.set(peer, end);
    if (start > snapshot.now || end <= snapshot.now) continue;
    const delegated = event.type === "delegated";
    meetings.push({
      first: delegated ? peer : event.actor,
      second: delegated ? event.actor : peer,
      lane,
      incoming: snapshot.now - start >= meetingDuration / 2,
    });
  }

  return meetings;
}

export function describeActivity(
  activity: OfficeSnapshot["activities"][number],
  names: Map<string, string>,
) {
  const actor = names.get(activity.actor) ?? "Subagente";
  const peer = activity.peer ? (names.get(activity.peer) ?? "outro agente") : "outro agente";
  switch (activity.type) {
    case "delegated":
      return actor + " recebeu uma tarefa de " + peer + ".";
    case "contact":
      return actor + " solicitou contato com " + peer + ".";
    case "working":
    case "started":
      return actor + " começou a trabalhar.";
    case "stopped":
      return actor + " encerrou a atividade.";
    case "ended":
      return actor + " encerrou a sessão.";
  }
}
