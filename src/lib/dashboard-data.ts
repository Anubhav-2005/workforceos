export type AgentStatus = "Working" | "Waiting" | "Review needed";

export type Agent = {
  id: "recruiter" | "theo" | "nora";
  name: string;
  role: string;
  initials: string;
  color: string;
  glow: string;
  status: AgentStatus;
  task: string;
  completed: number;
  total: number;
  performance: string;
  description: string;
};

export type WorkItem = {
  id: string;
  agent: string;
  action: string;
  time: string;
  tone: "violet" | "amber" | "cyan" | "indigo";
};

const workItemTones: WorkItem["tone"][] = ["violet", "amber", "cyan", "indigo"];

export function isWorkItemList(value: unknown): value is WorkItem[] {
  return (
    Array.isArray(value) &&
    value.every(
      (item) =>
        typeof item === "object" &&
        item !== null &&
        typeof item.id === "string" &&
        typeof item.agent === "string" &&
        typeof item.action === "string" &&
        typeof item.time === "string" &&
        workItemTones.includes(item.tone as WorkItem["tone"]),
    )
  );
}

export const agents: Agent[] = [
  {
    id: "recruiter",
    name: "Maya",
    role: "AI Recruiter",
    initials: "MA",
    color: "bg-violet-500",
    glow: "from-violet-400/25",
    status: "Review needed",
    task: "Shortlisting Product Designers",
    completed: 18,
    total: 24,
    performance: "96% match quality",
    description:
      "Maya screens applications, ranks candidates against role requirements, and prepares interview-ready shortlists for your approval.",
  },
  {
    id: "theo",
    name: "Theo",
    role: "AI Sales Executive",
    initials: "TH",
    color: "bg-amber-500",
    glow: "from-amber-300/30",
    status: "Working",
    task: "Personalizing Q3 outreach",
    completed: 42,
    total: 60,
    performance: "34% reply rate",
    description:
      "Theo qualifies leads, writes contextual outreach, follows up with prospects, and puts important offers in front of you.",
  },
  {
    id: "nora",
    name: "Nora",
    role: "AI Customer Support",
    initials: "NO",
    color: "bg-cyan-500",
    glow: "from-cyan-300/30",
    status: "Waiting",
    task: "Monitoring priority inbox",
    completed: 12,
    total: 12,
    performance: "4.2 min response time",
    description:
      "Nora resolves common requests, triages escalations, and keeps the support queue moving with a clear human handoff.",
  },
];

export const initialWorkItems: WorkItem[] = [
  {
    id: "activity-maya-shortlist",
    agent: "Maya",
    action: "Shortlisted 6 candidates",
    time: "8 min ago",
    tone: "violet",
  },
  {
    id: "activity-theo-outreach",
    agent: "Theo",
    action: "Prepared 12 outreach drafts",
    time: "24 min ago",
    tone: "amber",
  },
  { id: "activity-nora-ticket", agent: "Nora", action: "Resolved ticket #4821", time: "42 min ago", tone: "cyan" },
  { id: "activity-maya-schedule", agent: "Maya", action: "Scheduled 2 interviews", time: "1 hr ago", tone: "violet" },
];

export function getAgent(id: string) {
  return agents.find((agent) => agent.id === id);
}
