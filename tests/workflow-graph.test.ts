import assert from "node:assert/strict";
import test from "node:test";
import {
  InvalidWorkflowError,
  nextWorkflowNode,
  validateWorkflowGraph,
  type WorkflowGraph,
} from "../src/lib/workflows/graph";

const validGraph: WorkflowGraph = {
  nodes: [
    { key: "start", type: "START", title: "Start", config: {} },
    { key: "score", type: "CONDITION", title: "Score check", config: {} },
    { key: "approval", type: "HUMAN_APPROVAL", title: "Human approval", config: {} },
    { key: "end", type: "END", title: "Complete", config: {} },
  ],
  edges: [
    { sourceKey: "start", targetKey: "score" },
    { sourceKey: "score", targetKey: "approval", condition: true },
    { sourceKey: "score", targetKey: "end", condition: false },
    { sourceKey: "approval", targetKey: "end" },
  ],
};

test("validates a branched human approval workflow", () => {
  assert.doesNotThrow(() => validateWorkflowGraph(validGraph));
  assert.equal(nextWorkflowNode(validGraph, "score", true), "approval");
  assert.equal(nextWorkflowNode(validGraph, "score", false), "end");
  assert.equal(nextWorkflowNode(validGraph, "end"), null);
});

test("rejects cycles before execution", () => {
  const graph: WorkflowGraph = {
    nodes: [...validGraph.nodes],
    edges: [
      { sourceKey: "start", targetKey: "score" },
      { sourceKey: "score", targetKey: "approval", condition: true },
      { sourceKey: "score", targetKey: "end", condition: false },
      { sourceKey: "approval", targetKey: "score" },
    ],
  };
  assert.throws(() => validateWorkflowGraph(graph), InvalidWorkflowError);
});

test("rejects missing approval branch and unreachable nodes", () => {
  const missingBranch = {
    ...validGraph,
    edges: validGraph.edges.filter((edge) => edge.condition !== false),
  };
  assert.throws(() => validateWorkflowGraph(missingBranch), /true and a false/);

  const unreachable = {
    ...validGraph,
    edges: validGraph.edges
      .filter((edge) => edge.sourceKey !== "approval")
      .concat({
        sourceKey: "approval",
        targetKey: "end",
      }),
    nodes: [...validGraph.nodes, { key: "orphan", type: "END" as const, title: "Orphan", config: {} }],
  };
  assert.throws(() => validateWorkflowGraph(unreachable), /reachable/);
});
