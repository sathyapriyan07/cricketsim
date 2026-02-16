import { useEffect, useState } from "react";
import { apiFetch } from "services/api";
import { Competition, CompetitionType } from "lib/types";
import { supabase } from "services/supabase";

export function useCompetitions(type: CompetitionType) {
  const [competitions, setCompetitions] = useState<Competition[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let active = true;

    async function load() {
      try {
        setLoading(true);
        const data = await apiFetch<Competition[]>(`/competition?type=${type}`);
        if (active) {
          setCompetitions(data);
          setError(null);
        }
      } catch {
        if (active) setError("Failed to load competitions");
      } finally {
        if (active) setLoading(false);
      }
    }

    load();

    const channel = supabase
      .channel(`competitions-${type}`)
      .on("postgres_changes", { event: "*", schema: "public", table: "competitions" }, () => {
        load();
      })
      .subscribe();

    return () => {
      active = false;
      supabase.removeChannel(channel);
    };
  }, [type]);

  return { competitions, loading, error };
}

export function useCompetition(id?: string) {
  const [competition, setCompetition] = useState<Competition | null>(null);
  const [loading, setLoading] = useState(Boolean(id));
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!id) {
      setCompetition(null);
      setLoading(false);
      return;
    }

    let active = true;

    async function load() {
      try {
        setLoading(true);
        const data = await apiFetch<Competition>(`/competition/${id}`);
        if (active) {
          setCompetition(data);
          setError(null);
        }
      } catch {
        if (active) {
          setError("Failed to load competition");
          setCompetition(null);
        }
      } finally {
        if (active) setLoading(false);
      }
    }

    load();

    const channel = supabase
      .channel(`competition-${id}`)
      .on("postgres_changes", { event: "*", schema: "public", table: "competitions", filter: `id=eq.${id}` }, () => {
        load();
      })
      .subscribe();

    return () => {
      active = false;
      supabase.removeChannel(channel);
    };
  }, [id]);

  return { competition, loading, error, setCompetition };
}

export function usePlayCompetitionMatch(id?: string) {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function playMatch(fixtureId: string, userTeamId?: string | null) {
    if (!id) throw new Error("Missing competition id");
    setLoading(true);
    setError(null);
    try {
      return await apiFetch<{
        competition: Competition;
        fixture_id: string;
        result: string;
        auto_simulated: boolean;
        summary: Record<string, unknown>;
      }>(`/competition/${id}/play-match`, {
        method: "POST",
        body: JSON.stringify({ fixture_id: fixtureId, user_team_id: userTeamId || null })
      });
    } catch (err) {
      const message = err instanceof Error ? err.message : "Failed to play fixture";
      setError(message);
      throw err;
    } finally {
      setLoading(false);
    }
  }

  return { playMatch, loading, error };
}
