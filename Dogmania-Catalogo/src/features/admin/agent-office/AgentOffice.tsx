import { useQuery } from "@tanstack/react-query";
import { Activity, Armchair, Bot, Clock3, Monitor, Pause, Play, UsersRound } from "lucide-react";
import { useCallback, useState, type CSSProperties } from "react";
import { api } from "@/lib/api";
import { buildTeam, describeActivity, getMeetings, type OfficeAgent } from "./model";
import { OfficeMap } from "./OfficeMap";
import { Sprite } from "./PixelArt";
import { meetingTables, officeSize, petSize, workPlaces } from "./officeLayout";
import { useOfficeWalk, type RegisterAvatar } from "./useOfficeWalk";
import type { TrafficPlan } from "./officeTraffic";
import "./agent-office.css";

const time = new Intl.DateTimeFormat("pt-BR", {
  hour: "2-digit",
  minute: "2-digit",
  second: "2-digit",
});

function Character({
  agent,
  register,
  facing,
  selected,
  speech,
  onSelect,
}: {
  agent: OfficeAgent;
  register: RegisterAvatar;
  facing?: "left" | "right";
  selected: boolean;
  speech: string;
  onSelect: () => void;
}) {
  const ref = useCallback(
    (node: HTMLButtonElement | null) => register(agent.slot, node),
    [register, agent.slot],
  );
  return (
    <button
      type="button"
      className="office-character"
      data-working={agent.working}
      data-facing={facing}
      ref={ref}
      data-pet={agent.shape}
      aria-label={agent.name + (agent.working ? ", trabalhando" : ", em repouso")}
      aria-pressed={selected}
      onClick={onSelect}
    >
      <span className="office-character-shadow" />
      <span className="office-character-sprite">
        <Sprite agent={agent} />
      </span>
      <span className="office-speech" aria-hidden="true">
        <strong className="office-speech-name">{agent.name}</strong>
        <span className="office-speech-text">{speech}</span>
      </span>
    </button>
  );
}

export function AgentOffice() {
  const query = useQuery({
    queryKey: ["admin", "agent-office"],
    queryFn: api.fetchAgentOffice,
    refetchInterval: 1500,
    retry: false,
    gcTime: 0,
  });
  const [selectedId, setSelectedId] = useState<string>();
  const snapshot = query.data;
  const { team, names } = buildTeam(snapshot);
  const working = team.filter((agent) => agent.working);
  const resting = team.filter((agent) => !agent.working);
  const meetings = getMeetings(snapshot, team);
  const selected = team.find((agent) => agent.slot === selectedId);
  const [walkingPaused, setWalkingPaused] = useState(false);
  const stations = new Map(
    working
      .filter((agent) => agent.slot !== "orchestrator")
      .map((agent, index) => [agent.id, workPlaces(index)]),
  );
  const visits = team.map((agent) => {
    const meeting = meetings.find(({ first, second }) => first === agent.id || second === agent.id);
    const speaker = meeting?.first === agent.id;
    const station = agent.slot === "orchestrator" ? workPlaces(-1) : stations.get(agent.id);
    const mode = meeting ? "meeting" : agent.working ? "work" : "rest";
    const plan: TrafficPlan = {
      id: agent.slot,
      mode,
      seat: meeting
        ? meetingTables[meeting.lane][speaker ? 0 : 1]
        : agent.working
          ? station?.[0]
          : undefined,
      patrol: mode === "work" ? station?.[1] : undefined,
    };
    const facing: "left" | "right" | undefined = meeting ? (speaker ? "right" : "left") : undefined;
    const speech = meeting
      ? meeting.incoming === speaker
        ? "…"
        : speaker
          ? "Vamos alinhar?"
          : "Estou ouvindo!"
      : agent.working
        ? "Em atividade"
        : "Em repouso";
    return { agent, plan, facing, speech };
  });
  const { register } = useOfficeWalk(
    visits.map(({ plan }) => plan),
    walkingPaused,
  );

  let connection = "Aguardando eventos do Codex";
  if (query.isPending) connection = "Conectando ao painel…";
  else if (query.isError) connection = "Conexão interrompida";
  else if (snapshot?.lastEventAt)
    connection = "Último sinal às " + time.format(snapshot.lastEventAt);

  function roster(label: string, agents: OfficeAgent[], state: "work" | "rest") {
    return (
      <section className="office-roster-group" data-state={state} aria-label={label}>
        <div className="office-roster-heading">
          <span className="office-led" />
          <h2>{label}</h2>
          <strong>{agents.length}</strong>
        </div>
        <div className="office-roster-list">
          {agents.length === 0 && <span className="office-empty">Nenhum agente</span>}
          {agents.map((agent) => (
            <button
              type="button"
              key={agent.slot}
              className="office-agent-chip"
              aria-pressed={selectedId === agent.slot}
              onClick={() => setSelectedId(selectedId === agent.slot ? undefined : agent.slot)}
              style={{ "--agent-color": agent.color } as CSSProperties}
            >
              <span aria-hidden="true" />
              {agent.name}
            </button>
          ))}
        </div>
      </section>
    );
  }

  return (
    <div className="agent-office" data-walking-paused={walkingPaused}>
      <header className="office-intro">
        <div className="office-intro-copy">
          <p className="office-eyebrow">
            <Bot size={15} /> BASTIDORES DOGMANIA
          </p>
          <h1>
            Sala dos Agentes<span>.</span>
          </h1>
          <p>Veja quem está em ação, em reunião ou fazendo uma pausa.</p>
        </div>
        <p
          className="office-connection"
          data-live={!query.isError && Boolean(snapshot?.lastEventAt)}
        >
          <span className="office-led" /> {connection}
        </p>
      </header>

      {query.isError && (
        <p role="alert" className="office-alert">
          A Sala dos Agentes perdeu a conexão. O painel vai tentar atualizar novamente.
        </p>
      )}

      <div className="office-roster" aria-label="Status dos agentes">
        {roster("Trabalhando", working, "work")}
        {roster("Em repouso", resting, "rest")}
      </div>

      <div className="office-content">
        <section className="office-panel office-map-panel" aria-labelledby="office-map-title">
          <div className="office-panel-header">
            <h2 id="office-map-title">
              <Monitor size={17} /> Mapa do escritório
            </h2>
            <div className="office-map-actions">
              <span>
                {meetings.length} {meetings.length === 1 ? "reunião" : "reuniões"} em andamento
              </span>
              <button
                type="button"
                className="office-walk-toggle"
                aria-controls="office-walk-scene"
                onClick={() => setWalkingPaused((paused) => !paused)}
              >
                {walkingPaused ? <Play size={14} /> : <Pause size={14} />}
                {walkingPaused ? "Retomar caminhada" : "Pausar caminhada"}
              </button>
            </div>
          </div>
          <div
            className="office-map-scroll"
            role="region"
            aria-label="Cenário pixelado do escritório"
            tabIndex={0}
          >
            <div
              id="office-walk-scene"
              className="office-scene"
              style={{ "--office-pet-size": (petSize / officeSize) * 100 + "%" } as CSSProperties}
            >
              <OfficeMap />
              {visits.map(({ agent, facing, speech }) => (
                <Character
                  key={agent.slot}
                  agent={agent}
                  register={register}
                  facing={facing}
                  selected={selectedId === agent.slot}
                  speech={speech}
                  onSelect={() => setSelectedId(selectedId === agent.slot ? undefined : agent.slot)}
                />
              ))}
            </div>
          </div>
          <div className="office-map-footer">
            {selected ? (
              <span>
                <strong>{selected.name}</strong> ·{" "}
                {meetings.some(
                  ({ first, second }) => first === selected.id || second === selected.id,
                )
                  ? "Em reunião"
                  : selected.working
                    ? "Trabalhando"
                    : "Em repouso"}
              </span>
            ) : (
              <span>Selecione um avatar para ver seu status.</span>
            )}
            <span className="office-mobile-tip">Deslize para explorar →</span>
          </div>
        </section>

        <section className="office-panel office-timeline" aria-labelledby="office-activity-title">
          <div className="office-panel-header">
            <h2 id="office-activity-title">
              <Activity size={17} /> Atividade recente
            </h2>
          </div>
          {snapshot?.activities.length ? (
            <ol className="office-events">
              {snapshot.activities.map((event) => (
                <li key={event.id}>
                  <span className="office-event-icon">
                    {event.type === "contact" || event.type === "delegated" ? (
                      <UsersRound size={14} />
                    ) : event.type === "stopped" || event.type === "ended" ? (
                      <Armchair size={14} />
                    ) : (
                      <Activity size={14} />
                    )}
                  </span>
                  <div>
                    <p>{describeActivity(event, names)}</p>
                    <time dateTime={new Date(event.at).toISOString()}>{time.format(event.at)}</time>
                  </div>
                </li>
              ))}
            </ol>
          ) : (
            <div className="office-no-events">
              <Clock3 size={25} />
              <strong>Nenhuma atividade registrada</strong>
              <p>As atividades aparecem aqui quando o Codex envia eventos deste projeto.</p>
            </div>
          )}
        </section>
      </div>
    </div>
  );
}
