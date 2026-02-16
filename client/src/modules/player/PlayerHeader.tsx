import { Role } from "lib/types";

export function PlayerHeader({
  name,
  role,
  imageUrl,
  teamLogoUrl
}: {
  name: string;
  role: Role;
  imageUrl?: string;
  teamLogoUrl?: string;
}) {
  return (
    <div className="flex flex-col items-center justify-center rounded-xl border border-gray-200 bg-white p-6 text-gray-900 shadow-sm">
      <div className="mb-3 flex items-center gap-3">
        {teamLogoUrl ? (
          <img src={teamLogoUrl} alt="Team logo" className="h-10 w-10 rounded-full border border-gray-200 object-cover" />
        ) : null}
        {imageUrl ? (
          <img src={imageUrl} alt={name} className="h-28 w-28 rounded-full border-4 border-gray-200 object-cover shadow-sm" />
        ) : (
          <div className="flex h-28 w-28 items-center justify-center rounded-full border-4 border-gray-200 bg-gray-100 text-4xl font-bold">
            {name.slice(0, 1).toUpperCase()}
          </div>
        )}
      </div>
      <h1 className="text-3xl font-bold">{name}</h1>
      <span className="mt-2 rounded-full bg-gray-100 px-3 py-1 text-xs font-semibold tracking-wide text-gray-700">{role}</span>
    </div>
  );
}
