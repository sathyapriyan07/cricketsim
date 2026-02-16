import { ReactNode } from "react";

export function Tabs({ children }: { children: ReactNode }) {
  return <div className="space-y-2">{children}</div>;
}

export function TabsList({ children }: { children: ReactNode }) {
  return <div className="flex flex-wrap gap-2">{children}</div>;
}

export function TabsTrigger({ active, children, onClick }: { active?: boolean; children: ReactNode; onClick?: () => void }) {
  return (
    <button onClick={onClick} className={`rounded-lg px-3 py-1.5 text-sm ${active ? "bg-blue-100" : "bg-gray-100"}`}>
      {children}
    </button>
  );
}

export function TabsContent({ children }: { children: ReactNode }) {
  return <div className="rounded-xl bg-gray-50 p-3">{children}</div>;
}
