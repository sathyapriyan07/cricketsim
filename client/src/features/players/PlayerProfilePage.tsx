import { useParams } from "react-router-dom";
import { PlayerCareer } from "modules/player/PlayerCareer";

export function PlayerProfilePage() {
  const { id } = useParams();

  if (!id) {
    return <div className="rounded-xl bg-white p-4 text-rose-600 shadow-sm">Player not found.</div>;
  }

  return <PlayerCareer playerId={id} />;
}
