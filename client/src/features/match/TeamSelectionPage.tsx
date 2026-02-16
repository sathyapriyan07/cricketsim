import { useEffect, useMemo, useState } from "react";
import { useLocation, useNavigate } from "react-router-dom";
import { DndContext, PointerSensor, useSensor, useSensors } from "@dnd-kit/core";
import { SortableContext, arrayMove, useSortable, verticalListSortingStrategy } from "@dnd-kit/sortable";
import { CSS } from "@dnd-kit/utilities";
import { apiFetch } from "services/api";
import { GlassCard } from "components/GlassCard";
import { RoleBadge } from "components/RoleBadge";
import { Player } from "lib/types";
import { useAppStore } from "store/useAppStore";
import { useCompetitionStore } from "store/competitionStore";
import { useMatchStore } from "store/matchStore";

function SortablePlayer({ player }: { player: Player }) {
  const { attributes, listeners, setNodeRef, transform, transition } = useSortable({ id: player.id });
  return (
    <div
      ref={setNodeRef}
      style={{ transform: CSS.Transform.toString(transform), transition }}
      {...attributes}
      {...listeners}
      className="mb-2 flex cursor-grab items-center justify-between rounded-xl bg-gray-100 p-3"
    >
      <span>{player.name}</span>
      <RoleBadge role={player.role} />
    </div>
  );
}

export function TeamSelectionPage() {
  const location = useLocation();
  const {
    players,
    teams,
    selectedCompetition: appCompetitionId,
    selectedTeam: appTeamId,
    competitionType: appCompetitionType,
    selectedFormat: appFormat,
    setSelectedTeam: setAppSelectedTeam,
    setSelectedCompetition: setAppSelectedCompetition,
    setCompetitionType: setAppCompetitionType,
    setSelectedFormat: setAppSelectedFormat,
    resetCompetitionSelection
  } = useAppStore();
  const {
    selectedCompetition,
    selectedTeam,
    competitionType,
    selectedFormat,
    setSelectedTeam,
    setSelectedCompetition,
    setCompetitionType,
    setSelectedFormat,
    resetCompetitionSelection: resetCompetitionSelectionPersisted
  } = useCompetitionStore();
  const { setMatchSetup } = useMatchStore();

  const navigate = useNavigate();
  const sensors = useSensors(useSensor(PointerSensor));

  const [selectedTeamId, setSelectedTeamId] = useState("");
  const [opponentTeamId, setOpponentTeamId] = useState("");
  const [selected, setSelected] = useState<Player[]>([]);
  const [captainId, setCaptainId] = useState("");
  const [viceCaptainId, setViceCaptainId] = useState("");
  const [allowedTeamIds, setAllowedTeamIds] = useState<string[] | null>(null);
  const resolvedCompetitionId = selectedCompetition || appCompetitionId;

  const availableTeams = useMemo(() => {
    if (!resolvedCompetitionId || !allowedTeamIds) return teams;
    const allowed = new Set(allowedTeamIds);
    return teams.filter((team) => allowed.has(team.id));
  }, [teams, resolvedCompetitionId, allowedTeamIds]);

  const selectedTeamData = useMemo(
    () => availableTeams.find((team) => team.id === selectedTeamId) || null,
    [availableTeams, selectedTeamId]
  );
  const opponentOptions = useMemo(
    () => availableTeams.filter((team) => team.id !== selectedTeamId),
    [availableTeams, selectedTeamId]
  );

  const squadPlayers = useMemo(() => {
    if (!selectedTeamData) return [];
    const squad = new Set(selectedTeamData.squad_player_ids || []);
    return players.filter((player) => squad.has(player.id));
  }, [players, selectedTeamData]);

  const availablePlayers = useMemo(() => {
    const selectedIds = new Set(selected.map((player) => player.id));
    return squadPlayers.filter((player) => !selectedIds.has(player.id));
  }, [squadPlayers, selected]);

  useEffect(() => {
    if (location.pathname === "/quick-match") {
      resetCompetitionSelection();
      resetCompetitionSelectionPersisted();
      setAllowedTeamIds(null);
    }
  }, [location.pathname, resetCompetitionSelection, resetCompetitionSelectionPersisted]);

  useEffect(() => {
    if (!resolvedCompetitionId || location.pathname === "/quick-match") {
      setAllowedTeamIds(null);
      return;
    }

    let active = true;
    apiFetch<{ team_ids: string[] }>(`/competition/${resolvedCompetitionId}`)
      .then((competition) => {
        if (active) setAllowedTeamIds(competition.team_ids || []);
      })
      .catch(() => {
        if (active) setAllowedTeamIds([]);
      });

    return () => {
      active = false;
    };
  }, [resolvedCompetitionId, location.pathname]);

  useEffect(() => {
    const resolvedTeam = selectedTeam || appTeamId;
    if (location.pathname === "/playing-xi" && resolvedTeam) {
      setSelectedTeamId(resolvedTeam);
      return;
    }

    if (!selectedTeamId && availableTeams.length) {
      setSelectedTeamId(availableTeams[0].id);
    }
  }, [availableTeams, selectedTeam, appTeamId, selectedTeamId, location.pathname]);

  useEffect(() => {
    if (location.pathname !== "/quick-match") return;
    if (!opponentOptions.length) {
      setOpponentTeamId("");
      return;
    }
    if (!opponentTeamId || opponentTeamId === selectedTeamId || !opponentOptions.some((team) => team.id === opponentTeamId)) {
      setOpponentTeamId(opponentOptions[0].id);
    }
  }, [location.pathname, opponentOptions, opponentTeamId, selectedTeamId]);

  useEffect(() => {
    if (!selectedTeamData) {
      setSelected([]);
      setCaptainId("");
      setViceCaptainId("");
      return;
    }

    const initialXI = squadPlayers.slice(0, 11);
    setSelected(initialXI);
    setCaptainId(initialXI[0]?.id || "");
    setViceCaptainId(initialXI[1]?.id || initialXI[0]?.id || "");
  }, [selectedTeamId, selectedTeamData, squadPlayers]);

  useEffect(() => {
    const ids = new Set(selected.map((player) => player.id));
    if (captainId && !ids.has(captainId)) setCaptainId(selected[0]?.id || "");
    if (viceCaptainId && !ids.has(viceCaptainId)) setViceCaptainId(selected[1]?.id || selected[0]?.id || "");
  }, [selected, captainId, viceCaptainId]);

  const validation = useMemo(() => {
    const wk = selected.filter((p) => p.role === "WK").length;
    const bowl = selected.filter((p) => p.role === "BOWL").length;
    const ar = selected.filter((p) => p.role === "AR").length;
    const hasEnoughSquad = squadPlayers.length >= 11;

    const rolesValid = selected.length === 11 && wk >= 1 && bowl >= 3 && bowl <= 5 && ar >= 1 && ar <= 3;
    const opponentValid = location.pathname !== "/quick-match" || (Boolean(opponentTeamId) && opponentTeamId !== selectedTeamId);

    return {
      valid: rolesValid && opponentValid,
      text: `${hasEnoughSquad ? "" : "Team squad needs at least 11 players. "}WK ${wk}/1+, Bowlers ${bowl}/3-5, AR ${ar}/1-3`
    };
  }, [selected, squadPlayers.length, location.pathname, opponentTeamId, selectedTeamId]);

  function addToXI(player: Player) {
    if (selected.length >= 11) return;
    setSelected((prev) => [...prev, player]);
    if (!captainId) setCaptainId(player.id);
    if (!viceCaptainId) setViceCaptainId(player.id);
  }

  function removeFromXI(playerId: string) {
    setSelected((prev) => prev.filter((player) => player.id !== playerId));
  }

  function startSimulation() {
    setSelectedTeam(selectedTeamId);
    setSelectedCompetition(selectedCompetition || appCompetitionId);
    setCompetitionType(competitionType || appCompetitionType);
    setSelectedFormat(selectedFormat || appFormat);
    setAppSelectedTeam(selectedTeamId);
    setAppSelectedCompetition(selectedCompetition || appCompetitionId);
    setAppCompetitionType(competitionType || appCompetitionType);
    setAppSelectedFormat(selectedFormat || appFormat);

    const setup = {
      competitionId: selectedCompetition || appCompetitionId,
      competitionType: competitionType || appCompetitionType,
      format: selectedFormat || appFormat,
      teamId: selectedTeamId,
      opponentTeamId: location.pathname === "/quick-match" ? opponentTeamId || null : null,
      playingXI: selected.map((p) => p.id),
      captainId,
      viceCaptainId
    };

    setMatchSetup(setup);
    localStorage.setItem("cricketsim_match_setup", JSON.stringify(setup));
    navigate("/simulate");
  }

  return (
    <div className="grid gap-4 lg:grid-cols-3">
      <GlassCard className="lg:col-span-2">
        <h1 className="mb-3 text-2xl font-semibold">Team & Playing XI Selection</h1>

        <label className="mb-2 block text-sm">Select Team</label>
        <select className="input-clean mb-4" value={selectedTeamId} onChange={(e) => setSelectedTeamId(e.target.value)}>
          {availableTeams.map((team) => (
            <option key={team.id} value={team.id}>
              {team.name}
            </option>
          ))}
        </select>

        {location.pathname === "/quick-match" && (
          <>
            <label className="mb-2 block text-sm">Select Opponent</label>
            <select className="input-clean mb-4" value={opponentTeamId} onChange={(e) => setOpponentTeamId(e.target.value)}>
              {opponentOptions.map((team) => (
                <option key={team.id} value={team.id}>
                  {team.name}
                </option>
              ))}
            </select>
          </>
        )}

        <div className="mb-4 flex flex-wrap gap-2">
          {availablePlayers.map((player) => (
            <button key={player.id} onClick={() => addToXI(player)} disabled={selected.length >= 11} className="rounded-full border border-gray-300 bg-white px-3 py-1 text-xs text-gray-700 hover:bg-gray-50 disabled:opacity-50">
              + {player.name}
            </button>
          ))}
          {!availablePlayers.length && <span className="text-xs text-gray-500">No more players to add</span>}
        </div>

        <DndContext
          sensors={sensors}
          onDragEnd={({ active, over }) => {
            if (!over || active.id === over.id) return;
            const oldIndex = selected.findIndex((p) => p.id === active.id);
            const newIndex = selected.findIndex((p) => p.id === over.id);
            setSelected(arrayMove(selected, oldIndex, newIndex));
          }}
        >
          <SortableContext items={selected.map((p) => p.id)} strategy={verticalListSortingStrategy}>
            {selected.map((player) => (
              <div key={player.id} className="group relative">
                <SortablePlayer player={player} />
                <button onClick={() => removeFromXI(player.id)} className="absolute right-16 top-2 rounded-lg border border-rose-200 bg-rose-50 px-2 py-1 text-xs text-rose-700 opacity-0 transition group-hover:opacity-100">
                  Remove
                </button>
              </div>
            ))}
          </SortableContext>
        </DndContext>
      </GlassCard>

      <GlassCard>
        <h2 className="mb-3 text-lg font-semibold">Selection Rules</h2>
        <p className={`mb-4 text-sm ${validation.valid ? "text-emerald-600" : "text-red-600"}`}>{validation.text}</p>

        <p className="mb-2 text-xs text-gray-500">Playing XI: {selected.length}/11</p>

        <label className="mb-2 block text-sm">Captain</label>
        <select className="input-clean mb-4" value={captainId} onChange={(e) => setCaptainId(e.target.value)}>
          {selected.map((p) => (
            <option key={p.id} value={p.id}>{p.name}</option>
          ))}
        </select>

        <label className="mb-2 block text-sm">Vice-Captain</label>
        <select className="input-clean mb-4" value={viceCaptainId} onChange={(e) => setViceCaptainId(e.target.value)}>
          {selected.map((p) => (
            <option key={p.id} value={p.id}>{p.name}</option>
          ))}
        </select>

        <button
          disabled={!validation.valid}
          onClick={startSimulation}
          className="btn-primary w-full py-3"
        >
          Start Simulation
        </button>
      </GlassCard>
    </div>
  );
}
