export const workflowNodeTypes = [
  "START",
  "AI_EMPLOYEE",
  "HUMAN_APPROVAL",
  "CONDITION",
  "ACTION",
  "DELAY",
  "END",
] as const;

export type WorkflowNodeType = (typeof workflowNodeTypes)[number];

export type WorkflowGraphNode = {
  key: string;
  type: WorkflowNodeType;
  title: string;
  config: Record<string, unknown>;
};

export type WorkflowGraphEdge = {
  sourceKey: string;
  targetKey: string;
  condition?: boolean | null;
};

export type WorkflowGraph = {
  nodes: WorkflowGraphNode[];
  edges: WorkflowGraphEdge[];
};

export class InvalidWorkflowError extends Error {
  constructor(message: string) {
    super(message);
    this.name = "InvalidWorkflowError";
  }
}

/** Validate a small directed graph before it can be activated or executed. */
export function validateWorkflowGraph(graph: WorkflowGraph): void {
  if (graph.nodes.length < 2 || graph.nodes.length > 40) {
    throw new InvalidWorkflowError("A workflow needs 2 to 40 nodes.");
  }
  if (graph.edges.length > 80) throw new InvalidWorkflowError("A workflow can have at most 80 connections.");

  const keys = new Set<string>();
  for (const node of graph.nodes) {
    if (!/^[a-zA-Z][a-zA-Z0-9_-]{0,63}$/.test(node.key)) {
      throw new InvalidWorkflowError(`Invalid node key: ${node.key}`);
    }
    if (keys.has(node.key)) throw new InvalidWorkflowError(`Duplicate node key: ${node.key}`);
    if (!workflowNodeTypes.includes(node.type)) throw new InvalidWorkflowError(`Unsupported node type: ${node.type}`);
    keys.add(node.key);
  }

  const starts = graph.nodes.filter((node) => node.type === "START");
  const ends = graph.nodes.filter((node) => node.type === "END");
  if (starts.length !== 1 || ends.length < 1) {
    throw new InvalidWorkflowError("A workflow needs exactly one start and at least one end node.");
  }

  const outgoing = new Map<string, WorkflowGraphEdge[]>();
  const incoming = new Map<string, WorkflowGraphEdge[]>();
  const pairs = new Set<string>();
  for (const edge of graph.edges) {
    if (!keys.has(edge.sourceKey) || !keys.has(edge.targetKey)) {
      throw new InvalidWorkflowError("A connection refers to a missing node.");
    }
    if (edge.sourceKey === edge.targetKey) throw new InvalidWorkflowError("A node cannot connect to itself.");
    const pair = `${edge.sourceKey}\0${edge.targetKey}`;
    if (pairs.has(pair)) throw new InvalidWorkflowError("Duplicate workflow connection.");
    pairs.add(pair);
    outgoing.set(edge.sourceKey, [...(outgoing.get(edge.sourceKey) ?? []), edge]);
    incoming.set(edge.targetKey, [...(incoming.get(edge.targetKey) ?? []), edge]);
  }

  if (incoming.has(starts[0].key)) throw new InvalidWorkflowError("The start node cannot have incoming connections.");
  for (const node of graph.nodes) {
    const next = outgoing.get(node.key) ?? [];
    if (node.type === "END" && next.length)
      throw new InvalidWorkflowError("An end node cannot have outgoing connections.");
    if (node.type !== "END" && !next.length) throw new InvalidWorkflowError(`${node.title} has no next step.`);
    if (node.type !== "CONDITION" && next.length > 1) {
      throw new InvalidWorkflowError(`${node.title} can only have one next step.`);
    }
    if (node.type === "CONDITION") {
      if (
        next.length !== 2 ||
        new Set(next.map((edge) => edge.condition)).size !== 2 ||
        !next.some((edge) => edge.condition === true) ||
        !next.some((edge) => edge.condition === false)
      ) {
        throw new InvalidWorkflowError(`${node.title} needs a true and a false connection.`);
      }
    }
  }

  const active = new Set<string>();
  const visited = new Set<string>();
  const walk = (key: string) => {
    if (active.has(key)) throw new InvalidWorkflowError("Workflow cycles are not supported.");
    if (visited.has(key)) return;
    active.add(key);
    for (const edge of outgoing.get(key) ?? []) walk(edge.targetKey);
    active.delete(key);
    visited.add(key);
  };
  walk(starts[0].key);
  if (visited.size !== graph.nodes.length) throw new InvalidWorkflowError("Every node must be reachable from start.");
}

export function nextWorkflowNode(graph: WorkflowGraph, key: string, condition?: boolean): string | null {
  const node = graph.nodes.find((item) => item.key === key);
  if (!node) throw new InvalidWorkflowError("The current workflow node no longer exists.");
  if (node.type === "END") return null;
  const edges = graph.edges.filter((edge) => edge.sourceKey === key);
  const next = node.type === "CONDITION" ? edges.find((edge) => edge.condition === condition) : edges[0];
  if (!next) throw new InvalidWorkflowError("The workflow has no valid next step.");
  return next.targetKey;
}
