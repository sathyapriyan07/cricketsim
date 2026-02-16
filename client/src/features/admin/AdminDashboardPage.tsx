import { useEffect, useMemo, useState } from "react";
import { GlassCard } from "components/GlassCard";
import { Player } from "lib/types";
import { apiFetch } from "services/api";
import { supabase } from "services/supabase";
import { useAppStore } from "store/useAppStore";
import { AuthUser, useAuthStore } from "store/useAuthStore";

type StatusKind = "idle" | "success" | "error" | "loading";

export function AdminDashboardPage() {
  const { teams, players, setTeams, setPlayers } = useAppStore();
  const { user, role, loading, setLoading, setAuth, clearAuth } = useAuthStore();

  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [displayName, setDisplayName] = useState("");

  const [playerName, setPlayerName] = useState("");
  const [playerImageUrl, setPlayerImageUrl] = useState("");
  const [playerRole, setPlayerRole] = useState("BAT");
  const [editPlayerId, setEditPlayerId] = useState("");
  const [editPlayerName, setEditPlayerName] = useState("");
  const [editPlayerImageUrl, setEditPlayerImageUrl] = useState("");
  const [editPlayerRole, setEditPlayerRole] = useState("BAT");

  const [teamName, setTeamName] = useState("");
  const [teamLogoUrl, setTeamLogoUrl] = useState("");
  const [selectedPlayerId, setSelectedPlayerId] = useState("");
  const [selectedPlayerIds, setSelectedPlayerIds] = useState<string[]>([]);

  const [editTeamId, setEditTeamId] = useState("");
  const [editTeamName, setEditTeamName] = useState("");
  const [editTeamLogoUrl, setEditTeamLogoUrl] = useState("");
  const [editTeamApproved, setEditTeamApproved] = useState(false);
  const [editSelectedPlayerId, setEditSelectedPlayerId] = useState("");
  const [editTeamPlayerIds, setEditTeamPlayerIds] = useState<string[]>([]);

  const [competitionName, setCompetitionName] = useState("Premier Bracket Cup");
  const [competitionType, setCompetitionType] = useState<"tournament" | "series" | "league">("tournament");
  const [competitionFormat, setCompetitionFormat] = useState("T20");
  const [selectedCompetitionTeamIds, setSelectedCompetitionTeamIds] = useState<string[]>([]);
  const [seriesLength, setSeriesLength] = useState(3);
  const [competitionsCount, setCompetitionsCount] = useState(0);

  const [status, setStatus] = useState("");
  const [statusKind, setStatusKind] = useState<StatusKind>("idle");

  function setStatusMessage(message: string, kind: StatusKind) {
    setStatus(message);
    setStatusKind(kind);
  }

  const approvedTeams = useMemo(() => teams.filter((team) => Boolean(team.approved)), [teams]);
  const selectedPlayers = useMemo(
    () => selectedPlayerIds.map((id) => players.find((player) => player.id === id)).filter(Boolean) as Player[],
    [selectedPlayerIds, players]
  );
  const editTeamPlayers = useMemo(
    () => editTeamPlayerIds.map((id) => players.find((player) => player.id === id)).filter(Boolean) as Player[],
    [editTeamPlayerIds, players]
  );

  async function fetchPlayers() {
    const playerData = await apiFetch<any[]>("/players");
    setPlayers(playerData);
  }

  async function fetchTeams() {
    const teamData = await apiFetch<any[]>("/teams");
    setTeams(teamData);
  }

  async function fetchCompetitions() {
    const list = await apiFetch<any[]>("/competition");
    setCompetitionsCount(list.length);
  }

  async function refetchAdminData() {
    await Promise.all([fetchPlayers(), fetchTeams(), fetchCompetitions()]);
  }

  async function syncSessionAndProfile() {
    const { data } = await supabase.auth.getSession();
    const token = data.session?.access_token || null;
    if (!token) {
      clearAuth();
      return;
    }

    try {
      const me = await apiFetch<{
        id: string;
        email: string;
        role: "admin" | "moderator" | "user";
        display_name: string;
      }>("/auth/me");

      const nextUser: AuthUser = {
        id: me.id,
        email: me.email,
        role: me.role,
        display_name: me.display_name
      };
      setAuth({ user: nextUser, token });
    } catch {
      clearAuth();
    }
  }

  useEffect(() => {
    setLoading(true);
    Promise.all([syncSessionAndProfile(), refetchAdminData()])
      .catch(() => {
        setStatusMessage("Failed to load admin data.", "error");
      })
      .finally(() => setLoading(false));

    const {
      data: { subscription }
    } = supabase.auth.onAuthStateChange(async (_event, session) => {
      if (!session?.access_token) {
        clearAuth();
        return;
      }
      await syncSessionAndProfile();
      await refetchAdminData();
    });

    return () => subscription.unsubscribe();
  }, []);

  useEffect(() => {
    if (!selectedPlayerId && players.length) setSelectedPlayerId(players[0].id);
    if (!editSelectedPlayerId && players.length) setEditSelectedPlayerId(players[0].id);
    if (!editPlayerId && players.length) setEditPlayerId(players[0].id);
  }, [players, selectedPlayerId, editSelectedPlayerId, editPlayerId]);

  useEffect(() => {
    if (!editPlayerId) return;
    const player = players.find((entry) => entry.id === editPlayerId);
    if (!player) return;
    setEditPlayerName(player.name);
    setEditPlayerImageUrl(player.image_url || "");
    setEditPlayerRole(player.role);
  }, [editPlayerId, players]);

  useEffect(() => {
    if (!editTeamId && teams.length) {
      setEditTeamId(teams[0].id);
      return;
    }
    const team = teams.find((entry) => entry.id === editTeamId);
    if (!team) return;
    setEditTeamName(team.name);
    setEditTeamLogoUrl(team.logo_url || "");
    setEditTeamApproved(Boolean(team.approved));
    setEditTeamPlayerIds(team.squad_player_ids || []);
  }, [editTeamId, teams]);

  useEffect(() => {
    setSelectedCompetitionTeamIds((prev) => prev.filter((id) => approvedTeams.some((team) => team.id === id)));
  }, [approvedTeams]);

  async function signup() {
    setStatusMessage("Creating account...", "loading");
    setLoading(true);
    const { error } = await supabase.auth.signUp({
      email,
      password,
      options: { data: { name: displayName || "User" } }
    });
    if (error) {
      setStatusMessage(error.message, "error");
      setLoading(false);
      return;
    }
    await syncSessionAndProfile();
    await refetchAdminData();
    setStatusMessage("Signup successful. Check email if confirmation is enabled.", "success");
    setLoading(false);
  }

  async function login() {
    setStatusMessage("Logging in...", "loading");
    setLoading(true);
    const { error } = await supabase.auth.signInWithPassword({ email, password });
    if (error) {
      setStatusMessage(error.message, "error");
      setLoading(false);
      return;
    }
    await syncSessionAndProfile();
    await refetchAdminData();
    setStatusMessage("Logged in.", "success");
    setLoading(false);
  }

  async function logout() {
    setLoading(true);
    await supabase.auth.signOut();
    clearAuth();
    setStatusMessage("Logged out.", "success");
    setLoading(false);
  }

  async function createPlayer() {
    setStatusMessage("Saving player...", "loading");
    setLoading(true);
    try {
      await apiFetch("/players", {
        method: "POST",
        body: JSON.stringify({
          name: playerName,
          role: playerRole,
          image_url: playerImageUrl.trim() || null
        })
      });
      setPlayerName("");
      setPlayerImageUrl("");
      await refetchAdminData();
      setStatusMessage("Player created.", "success");
    } catch (error) {
      setStatusMessage(error instanceof Error ? error.message : "Failed to create player.", "error");
    } finally {
      setLoading(false);
    }
  }

  async function updatePlayer() {
    if (!editPlayerId) return;
    setStatusMessage("Updating player...", "loading");
    setLoading(true);
    try {
      await apiFetch(`/players/${editPlayerId}`, {
        method: "PUT",
        body: JSON.stringify({
          name: editPlayerName.trim(),
          role: editPlayerRole,
          image_url: editPlayerImageUrl.trim() || null
        })
      });
      await refetchAdminData();
      setStatusMessage("Player updated.", "success");
    } catch (error) {
      setStatusMessage(error instanceof Error ? error.message : "Failed to update player.", "error");
    } finally {
      setLoading(false);
    }
  }

  function addPlayerToCreateTeam() {
    if (!selectedPlayerId || selectedPlayerIds.includes(selectedPlayerId)) return;
    setSelectedPlayerIds((prev) => [...prev, selectedPlayerId]);
  }

  function removePlayerFromCreateTeam(playerId: string) {
    setSelectedPlayerIds((prev) => prev.filter((id) => id !== playerId));
  }

  async function createTeam() {
    setStatusMessage("Creating team...", "loading");
    if (!teamName.trim()) return setStatusMessage("Team name is required.", "error");
    if (!selectedPlayerIds.length) return setStatusMessage("Add at least one player to the team.", "error");
    setLoading(true);
    try {
      await apiFetch("/teams", {
        method: "POST",
        body: JSON.stringify({
          name: teamName.trim(),
          logo_url: teamLogoUrl.trim() || null,
          squad_player_ids: selectedPlayerIds
        })
      });
      setTeamName("");
      setTeamLogoUrl("");
      setSelectedPlayerIds([]);
      await refetchAdminData();
      setStatusMessage("Team created.", "success");
    } catch (error) {
      setStatusMessage(error instanceof Error ? error.message : "Failed to create team.", "error");
    } finally {
      setLoading(false);
    }
  }

  function addPlayerToEditTeam() {
    if (!editSelectedPlayerId || editTeamPlayerIds.includes(editSelectedPlayerId)) return;
    setEditTeamPlayerIds((prev) => [...prev, editSelectedPlayerId]);
  }

  function removePlayerFromEditTeam(playerId: string) {
    setEditTeamPlayerIds((prev) => prev.filter((id) => id !== playerId));
  }

  async function updateTeam() {
    if (!editTeamId) return;
    if (!editTeamName.trim()) return setStatusMessage("Team name is required.", "error");
    if (!editTeamPlayerIds.length) return setStatusMessage("Team should have at least one player.", "error");
    setStatusMessage("Updating team...", "loading");
    setLoading(true);
    try {
      await apiFetch(`/teams/${editTeamId}`, {
        method: "PUT",
        body: JSON.stringify({
          name: editTeamName.trim(),
          logo_url: editTeamLogoUrl.trim() || null,
          approved: editTeamApproved,
          squad_player_ids: editTeamPlayerIds
        })
      });
      await refetchAdminData();
      setStatusMessage("Team updated.", "success");
    } catch (error) {
      setStatusMessage(error instanceof Error ? error.message : "Failed to update team.", "error");
    } finally {
      setLoading(false);
    }
  }

  function toggleCompetitionTeam(teamId: string) {
    setSelectedCompetitionTeamIds((prev) =>
      prev.includes(teamId) ? prev.filter((id) => id !== teamId) : [...prev, teamId]
    );
  }

  async function generateCompetitionSchedule() {
    if (approvedTeams.length < 2) return setStatusMessage("No approved teams available.", "error");
    if (selectedCompetitionTeamIds.length < 2) return setStatusMessage("Select at least 2 teams.", "error");
    if (competitionType === "series" && selectedCompetitionTeamIds.length !== 2) {
      return setStatusMessage("Series requires exactly 2 teams.", "error");
    }

    setStatusMessage("Generating schedule...", "loading");
    setLoading(true);
    try {
      const response = await apiFetch<{ id: string; schedule_json?: any[]; fixtures_json?: any[] }>("/competition/create", {
        method: "POST",
        body: JSON.stringify({
          name: competitionName,
          type: competitionType,
          format: competitionFormat,
          team_ids: selectedCompetitionTeamIds,
          seriesLength,
          startDate: new Date().toISOString()
        })
      });
      await fetchCompetitions();
      setStatusMessage(`Competition created (${response.id}) with ${(response.fixtures_json || response.schedule_json || []).length} fixtures.`, "success");
    } catch (error) {
      setStatusMessage(error instanceof Error ? error.message : "Failed to generate competition.", "error");
    } finally {
      setLoading(false);
    }
  }

  const statusClass = statusKind === "error" ? "text-red-600" : statusKind === "success" ? "text-emerald-600" : "text-gray-600";
  const canManage = role === "admin" || role === "moderator";

  return (
    <div className="space-y-4">
      <h1 className="text-2xl font-semibold">Admin Panel</h1>

      <GlassCard>
        <h2 className="mb-3 font-semibold">Supabase Auth (Email + Password)</h2>
        {user ? (
          <div className="flex flex-wrap items-center gap-3">
            <div className="rounded-xl bg-emerald-500/20 px-3 py-2 text-sm">{user.display_name} ({user.role.toUpperCase()})</div>
            <button onClick={logout} disabled={loading} className="rounded-xl bg-gray-200 px-3 py-2 text-sm disabled:opacity-60">Logout</button>
          </div>
        ) : (
          <div className="grid gap-2 md:grid-cols-3">
            <input value={displayName} onChange={(e) => setDisplayName(e.target.value)} placeholder="Display name" className="input-clean" />
            <input value={email} onChange={(e) => setEmail(e.target.value)} placeholder="email@example.com" className="input-clean" />
            <input value={password} type="password" onChange={(e) => setPassword(e.target.value)} placeholder="password" className="input-clean" />
            <button onClick={signup} disabled={loading} className="rounded-xl bg-emerald-600/80 px-4 py-2 text-sm text-white disabled:opacity-60">Sign Up</button>
            <button onClick={login} disabled={loading} className="btn-primary disabled:opacity-60">Login</button>
          </div>
        )}
      </GlassCard>

      <div className="grid gap-4 xl:grid-cols-3">
        <GlassCard>
          <h2 className="mb-3 font-semibold">Players (Create + Edit)</h2>
          <input value={playerName} onChange={(e) => setPlayerName(e.target.value)} placeholder="New player name" className="input-clean mb-2" />
          <input value={playerImageUrl} onChange={(e) => setPlayerImageUrl(e.target.value)} placeholder="Player image URL (optional)" className="input-clean mb-2" />
          <select value={playerRole} onChange={(e) => setPlayerRole(e.target.value)} className="input-clean mb-2">
            <option>BAT</option><option>BOWL</option><option>AR</option><option>WK</option>
          </select>
          <button onClick={createPlayer} disabled={loading || !canManage} className="btn-primary mb-4 w-full py-3 disabled:opacity-60">Create Player</button>

          <select value={editPlayerId} onChange={(e) => setEditPlayerId(e.target.value)} className="input-clean mb-2">
            {players.map((player) => (
              <option key={player.id} value={player.id}>{player.name}</option>
            ))}
          </select>
          <input value={editPlayerName} onChange={(e) => setEditPlayerName(e.target.value)} placeholder="Edit player name" className="input-clean mb-2" />
          <input value={editPlayerImageUrl} onChange={(e) => setEditPlayerImageUrl(e.target.value)} placeholder="Edit player image URL" className="input-clean mb-2" />
          <select value={editPlayerRole} onChange={(e) => setEditPlayerRole(e.target.value)} className="input-clean mb-2">
            <option>BAT</option><option>BOWL</option><option>AR</option><option>WK</option>
          </select>
          <button onClick={updatePlayer} disabled={loading || !canManage} className="btn-secondary w-full py-3 disabled:opacity-60">Update Player</button>
        </GlassCard>

        <GlassCard>
          <h2 className="mb-3 font-semibold">Teams (Create + Edit)</h2>
          <input value={teamName} onChange={(e) => setTeamName(e.target.value)} placeholder="New team name" className="input-clean mb-2" />
          <input value={teamLogoUrl} onChange={(e) => setTeamLogoUrl(e.target.value)} placeholder="Team logo URL (optional)" className="input-clean mb-2" />
          <div className="mb-2 flex gap-2">
            <select value={selectedPlayerId} onChange={(e) => setSelectedPlayerId(e.target.value)} className="input-clean">
              {players.map((player) => (
                <option key={player.id} value={player.id}>{player.name} ({player.role})</option>
              ))}
            </select>
            <button onClick={addPlayerToCreateTeam} disabled={loading} className="btn-primary disabled:opacity-60">Add</button>
          </div>
          <div className="mb-2 flex min-h-8 flex-wrap gap-2">
            {selectedPlayers.map((player) => (
              <button key={player.id} onClick={() => removePlayerFromCreateTeam(player.id)} className="rounded-full bg-gray-200 px-3 py-1 text-xs">{player.name} x</button>
            ))}
            {!selectedPlayers.length && <p className="text-xs text-gray-500">No players selected</p>}
          </div>
          <button onClick={createTeam} disabled={loading} className="btn-primary mb-4 w-full py-3 disabled:opacity-60">Create Team</button>

          <select value={editTeamId} onChange={(e) => setEditTeamId(e.target.value)} className="input-clean mb-2">
            {teams.map((team) => (
              <option key={team.id} value={team.id}>{team.name}</option>
            ))}
          </select>
          <input value={editTeamName} onChange={(e) => setEditTeamName(e.target.value)} placeholder="Edit team name" className="input-clean mb-2" />
          <input value={editTeamLogoUrl} onChange={(e) => setEditTeamLogoUrl(e.target.value)} placeholder="Edit team logo URL" className="input-clean mb-2" />
          <label className="mb-2 flex items-center gap-2 rounded-lg bg-gray-100 p-2 text-sm">
            <input type="checkbox" checked={editTeamApproved} onChange={(e) => setEditTeamApproved(e.target.checked)} />
            Approved Team
          </label>
          <div className="mb-2 flex gap-2">
            <select value={editSelectedPlayerId} onChange={(e) => setEditSelectedPlayerId(e.target.value)} className="input-clean">
              {players.map((player) => (
                <option key={player.id} value={player.id}>{player.name} ({player.role})</option>
              ))}
            </select>
            <button onClick={addPlayerToEditTeam} disabled={loading} className="btn-secondary disabled:opacity-60">Add</button>
          </div>
          <div className="mb-2 flex min-h-8 flex-wrap gap-2">
            {editTeamPlayers.map((player) => (
              <button key={player.id} onClick={() => removePlayerFromEditTeam(player.id)} className="rounded-full bg-gray-200 px-3 py-1 text-xs">{player.name} x</button>
            ))}
            {!editTeamPlayers.length && <p className="text-xs text-gray-500">No players in squad</p>}
          </div>
          <button onClick={updateTeam} disabled={loading || !canManage} className="btn-secondary w-full py-3 disabled:opacity-60">Update Team</button>
        </GlassCard>

        <GlassCard>
          <h2 className="mb-3 font-semibold">Series / League / Tournament</h2>
          <p className="mb-2 text-xs text-gray-500">Competitions loaded: {competitionsCount}</p>
          <input value={competitionName} onChange={(e) => setCompetitionName(e.target.value)} placeholder="Competition name" className="input-clean mb-2" />
          <select value={competitionType} onChange={(e) => setCompetitionType(e.target.value as "tournament" | "series" | "league")} className="input-clean mb-2">
            <option value="tournament">Tournament</option>
            <option value="series">Series</option>
            <option value="league">League</option>
          </select>
          <select value={competitionFormat} onChange={(e) => setCompetitionFormat(e.target.value)} className="input-clean mb-2">
            <option value="T20">T20</option>
            <option value="ODI">ODI</option>
            <option value="TEST">Test</option>
          </select>

          <div className="mb-2 max-h-36 space-y-1 overflow-y-auto rounded-lg bg-gray-50 p-2">
            {approvedTeams.map((team) => (
              <label key={team.id} className="flex cursor-pointer items-center gap-2 rounded-md px-2 py-1 hover:bg-gray-100">
                <input type="checkbox" checked={selectedCompetitionTeamIds.includes(team.id)} onChange={() => toggleCompetitionTeam(team.id)} />
                <span className="text-sm">{team.name}</span>
              </label>
            ))}
            {!approvedTeams.length && <p className="text-xs text-gray-500">No approved teams available</p>}
          </div>

          <input value={seriesLength} type="number" min={1} max={9} onChange={(e) => setSeriesLength(Number(e.target.value))} placeholder="Series length" className="input-clean mb-3" />
          <button onClick={generateCompetitionSchedule} disabled={loading || !canManage} className="btn-primary w-full py-3 disabled:opacity-60">Generate</button>
        </GlassCard>
      </div>

      {loading && <p className="text-sm text-gray-500">Loading...</p>}
      {!!status && <p className={`text-sm ${statusClass}`}>{status}</p>}
    </div>
  );
}

