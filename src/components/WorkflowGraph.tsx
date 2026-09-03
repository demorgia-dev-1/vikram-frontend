"use client";

import { useMemo } from "react";
import {
  Background,
  Controls,
  Handle,
  Position,
  ReactFlow,
  type Edge,
  type Node,
  type NodeProps,
} from "@xyflow/react";
import "@xyflow/react/dist/style.css";
import { cn } from "@/components/ui";
import type { WorkflowStage, WorkflowTransition } from "@/types";

type StageNodeData = {
  label: string;
  current: boolean;
  initial: boolean;
  terminal: boolean;
};

const COLUMN_WIDTH = 150;
const ROW_HEIGHT = 60;

function StageNode({ data }: NodeProps) {
  const { label, current, initial, terminal } = data as StageNodeData;
  const tag = current ? "Current" : initial ? "Start" : terminal ? "End" : null;

  return (
    <div
      title={label}
      className={cn(
        "min-w-20 max-w-32 rounded-lg border px-2.5 py-1.5 text-center shadow-sm transition",
        current
          ? "border-sky-500 bg-sky-50 ring-2 ring-sky-500/20 dark:border-sky-400 dark:bg-sky-500/15"
          : "border-slate-200 bg-white dark:border-slate-700 dark:bg-slate-900",
      )}
    >
      <Handle
        type="target"
        position={Position.Left}
        className="!h-1.5 !w-1.5 !border-0 !bg-slate-400"
      />
      <p className="truncate text-xs font-medium text-slate-900 dark:text-slate-100">
        {label}
      </p>
      {tag ? (
        <p
          className={cn(
            "text-[9px] font-medium uppercase leading-tight tracking-wide",
            current
              ? "text-sky-600 dark:text-sky-400"
              : "text-slate-400 dark:text-slate-500",
          )}
        >
          {tag}
        </p>
      ) : null}
      <Handle
        type="source"
        position={Position.Right}
        className="!h-1.5 !w-1.5 !border-0 !bg-slate-400"
      />
    </div>
  );
}

const nodeTypes = { stage: StageNode };

/**
 * Lays stages out in columns by their distance from the initial stage, so the
 * graph reads left-to-right without needing stored coordinates from the API.
 */
function layout(stages: WorkflowStage[], transitions: WorkflowTransition[]) {
  const depths = new Map<string, number>();
  const start =
    stages.find((stage) => stage.isInitial)?.id ?? stages[0]?.id ?? null;

  if (start) {
    depths.set(start, 0);
    const queue = [start];

    while (queue.length) {
      const id = queue.shift() as string;
      const depth = depths.get(id) ?? 0;

      for (const transition of transitions) {
        if (transition.srcStage.id !== id) continue;

        const next = transition.destStage.id;
        if (!depths.has(next)) {
          depths.set(next, depth + 1);
          queue.push(next);
        }
      }
    }
  }

  // Anything unreachable from the start still needs a column.
  let fallback = Math.max(0, ...Array.from(depths.values())) + 1;
  for (const stage of stages) {
    if (!depths.has(stage.id)) depths.set(stage.id, fallback++);
  }

  const rows = new Map<number, number>();

  return stages.map((stage) => {
    const depth = depths.get(stage.id) ?? 0;
    const row = rows.get(depth) ?? 0;
    rows.set(depth, row + 1);

    return { stage, x: depth * COLUMN_WIDTH, y: row * ROW_HEIGHT };
  });
}

export default function WorkflowGraph({
  stages,
  transitions,
  currentStageId,
  className,
}: {
  stages: WorkflowStage[];
  transitions: WorkflowTransition[];
  currentStageId?: string | null;
  className?: string;
}) {
  const nodes = useMemo<Node[]>(
    () =>
      layout(stages, transitions).map(({ stage, x, y }) => ({
        id: stage.id,
        type: "stage",
        position: { x, y },
        data: {
          label: stage.name,
          current: stage.id === currentStageId,
          initial: stage.isInitial,
          terminal: stage.isTerminal,
        } satisfies StageNodeData,
      })),
    [stages, transitions, currentStageId],
  );

  const edges = useMemo<Edge[]>(
    () =>
      transitions.map((transition) => ({
        id: transition.id,
        source: transition.srcStage.id,
        target: transition.destStage.id,
        animated: transition.srcStage.id === currentStageId,
        style: {
          stroke:
            transition.srcStage.id === currentStageId ? "#0284c7" : "#94a3b8",
          strokeWidth: 1.5,
        },
      })),
    [transitions, currentStageId],
  );

  if (stages.length === 0) return null;

  return (
    <div className={cn("h-64 w-full", className)}>
      <ReactFlow
        nodes={nodes}
        edges={edges}
        nodeTypes={nodeTypes}
        fitView
        proOptions={{ hideAttribution: true }}
        nodesDraggable={false}
        nodesConnectable={false}
        edgesFocusable={false}
        className="rounded-b-xl"
      >
        <Background className="text-slate-200 dark:text-slate-800" />
        <Controls showInteractive={false} />
      </ReactFlow>
    </div>
  );
}
