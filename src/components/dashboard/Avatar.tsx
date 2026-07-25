import type { Agent } from "@/lib/dashboard-data";

type AvatarProps = {
  agent: Agent;
  size?: "sm" | "md" | "lg";
};

export default function Avatar({ agent, size = "md" }: AvatarProps) {
  const dimensions = size === "lg" ? "h-12 w-12 text-sm" : size === "sm" ? "h-8 w-8 text-[10px]" : "h-10 w-10 text-xs";

  return (
    <div
      className={`grid ${dimensions} shrink-0 place-items-center rounded-2xl ${agent.color} font-bold text-white shadow-lg shadow-slate-200`}
      aria-hidden="true"
    >
      {agent.initials}
    </div>
  );
}
