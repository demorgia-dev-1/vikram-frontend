"use client";

import { useCallback, useMemo } from "react";
import {
  Background,
  BackgroundVariant,
  BaseEdge,
  ConnectionLineType,
  ControlButton,
  Controls,
  EdgeLabelRenderer,
  Handle,
  MarkerType,
  Position,
  ReactFlow,
  ReactFlowProvider,
  getSmoothStepPath,
  useEdgesState,
  useNodesState,
  type Connection,
  type Edge,
  type EdgeProps,
  type Node,
  type NodeProps,
} from "@xyflow/react";
import "@xyflow/react/dist/style.css";
import { PencilIcon, PlusIcon, TrashIcon } from "@/components/icons";
import type { WorkflowStage, WorkflowTransition } from "@/types";

const NODE_WIDTH = 190;
const COLUMN_GAP = 240;
const ROW_GAP = 92;

type StageNodeData = {
  stage: WorkflowStage;
  current: boolean;
  readOnly: boolean;
  onEdit?: (stage: WorkflowStage) => void;
  onDelete?: (stage: WorkflowStage) => void;
};

type TransitionEdgeData = {
  performable?: boolean;
  onPerform?: () => void;
};

/**
 * Lays stages out in columns by distance from the initial stage, centring each
 * column against the tallest — the API stores no coordinates.
 */
export function layout(
  stages: WorkflowStage[],
  transitions: WorkflowTransition[],
) {
  const outgoing = new Map<string, string[]>();
  for (const transition of transitions) {
    const list = outgoing.get(transition.srcStage.id) ?? [];
    list.push(transition.destStage.id);
    outgoing.set(transition.srcStage.id, list);
  }

  const hasIncoming = new Set(transitions.map((t) => t.destStage.id));
  // Prefer the declared initial stage; fall back to anything unreachable.
  const roots = stages.filter(
    (stage) => stage.isInitial || !hasIncoming.has(stage.id),
  );
  const seeds = roots.length > 0 ? roots : stages.slice(0, 1);

  const depth = new Map<string, number>();
  const queue: string[] = [];
  for (const stage of seeds) {
    depth.set(stage.id, 0);
    queue.push(stage.id);
  }

  while (queue.length > 0) {
    const id = queue.shift() as string;
    const current = depth.get(id) ?? 0;
    for (const next of outgoing.get(id) ?? []) {
      if (!depth.has(next)) {
        depth.set(next, current + 1);
        queue.push(next);
      }
    }
  }

  // Anything the walk never reached (disconnected) goes in its own column.
  const maxDepth = Math.max(0, ...depth.values());
  for (const stage of stages) {
    if (!depth.has(stage.id)) depth.set(stage.id, maxDepth + 1);
  }

  const columns = new Map<number, string[]>();
  for (const stage of stages) {
    const column = depth.get(stage.id) ?? 0;
    const list = columns.get(column) ?? [];
    list.push(stage.id);
    columns.set(column, list);
  }

  const positions = new Map<string, { x: number; y: number }>();
  const tallest = Math.max(...[...columns.values()].map((c) => c.length), 1);
  for (const [column, ids] of columns) {
    // Centre each column against the tallest one.
    const offset = ((tallest - ids.length) * ROW_GAP) / 2;
    ids.forEach((id, row) => {
      positions.set(id, { x: column * COLUMN_GAP, y: offset + row * ROW_GAP });
    });
  }

  return positions;
}

/** One stage, drawn as a card with a target handle left and source right. */
function StageNodeCard({ data, selected }: NodeProps) {
  const { stage, current, readOnly, onEdit, onDelete } =
    data as unknown as StageNodeData;

  return (
    <div
      style={{ width: NODE_WIDTH }}
      className={`group rounded-lg border bg-surface px-3 py-2.5 shadow-sm transition-colors ${
        selected
          ? "border-primary ring-2 ring-ring/30"
          : current
            ? "border-primary ring-2 ring-primary/20"
            : stage.isInitial
              ? "border-primary/50"
              : "border-border-subtle"
      }`}
    >
      <Handle
        type="target"
        position={Position.Left}
        className="h-3! w-3! border-2! border-surface! bg-border-strong!"
      />

      <div className="flex items-center gap-1.5">
        <p
          title={stage.name}
          className="min-w-0 flex-1 truncate text-sm font-medium text-foreground"
        >
          {stage.name}
        </p>
        {!readOnly && (onEdit || onDelete) ? (
          <div className="flex shrink-0 gap-0.5 opacity-0 transition-opacity group-hover:opacity-100">
            {onEdit ? (
              <button
                type="button"
                onClick={() => onEdit(stage)}
                title="Edit stage"
                aria-label={`Edit ${stage.name}`}
                className="rounded p-1 text-muted transition-colors hover:bg-surface-muted hover:text-foreground"
              >
                <PencilIcon className="h-3.5 w-3.5" />
              </button>
            ) : null}
            {onDelete ? (
              <button
                type="button"
                onClick={() => onDelete(stage)}
                title="Delete stage"
                aria-label={`Delete ${stage.name}`}
                className="rounded p-1 text-muted transition-colors hover:bg-danger-soft hover:text-danger"
              >
                <TrashIcon className="h-3.5 w-3.5" />
              </button>
            ) : null}
          </div>
        ) : null}
      </div>

      {stage.isInitial || stage.isTerminal || current ? (
        <div className="mt-1.5 flex flex-wrap gap-1">
          {current ? (
            <span className="rounded border border-primary/40 bg-primary/10 px-1.5 py-0.5 text-[10px] font-semibold uppercase tracking-wide text-primary">
              Current
            </span>
          ) : null}
          {stage.isInitial ? (
            <span className="rounded border border-primary/40 bg-primary/10 px-1.5 py-0.5 text-[10px] font-semibold uppercase tracking-wide text-primary">
              Initial
            </span>
          ) : null}
          {stage.isTerminal ? (
            <span className="rounded border border-success/40 bg-success-soft px-1.5 py-0.5 text-[10px] font-semibold uppercase tracking-wide text-success">
              Terminal
            </span>
          ) : null}
        </div>
      ) : null}

      {/*
        The source handle is the one users must find, so outside read-only it
        stays visible and carries a + glyph naming it as the way to connect.
      */}
      {readOnly ? (
        <Handle
          type="source"
          position={Position.Right}
          isConnectable={false}
          className="h-3! w-3! border-2! border-surface! bg-border-strong!"
        />
      ) : (
        <Handle
          type="source"
          position={Position.Right}
          title="Drag to another stage to connect"
          className="flex! h-5! w-5! cursor-grab! items-center! justify-center! border-2! border-surface! bg-primary! text-[11px]! font-bold! text-primary-foreground! shadow-sm transition-transform hover:scale-125! active:cursor-grabbing!"
        >
          <span aria-hidden className="pointer-events-none leading-none">
            +
          </span>
        </Handle>
      )}
    </div>
  );
}

/** Draws the edge, plus a Perform button when this transition can be run now. */
function TransitionEdge({
  id,
  sourceX,
  sourceY,
  targetX,
  targetY,
  sourcePosition,
  targetPosition,
  style,
  markerEnd,
  data,
}: EdgeProps) {
  const [path, labelX, labelY] = getSmoothStepPath({
    sourceX,
    sourceY,
    sourcePosition,
    targetX,
    targetY,
    targetPosition,
  });

  const { performable, onPerform } = (data ?? {}) as TransitionEdgeData;

  return (
    <>
      <BaseEdge id={id} path={path} style={style} markerEnd={markerEnd} />
      {performable ? (
        <EdgeLabelRenderer>
          <button
            type="button"
            style={{
              transform: `translate(-50%, -50%) translate(${labelX}px, ${labelY}px)`,
            }}
            onClick={(event) => {
              event.stopPropagation();
              onPerform?.();
            }}
            className="nodrag nopan pointer-events-auto absolute rounded-md bg-primary px-2 py-0.5 text-[10px] font-semibold text-primary-foreground shadow-sm transition-colors hover:bg-primary-hover"
          >
            Perform
          </button>
        </EdgeLabelRenderer>
      ) : null}
    </>
  );
}

const nodeTypes = { stage: StageNodeCard };
const edgeTypes = { transition: TransitionEdge };

export type WorkflowGraphProps = {
  stages: WorkflowStage[];
  transitions: WorkflowTransition[];
  /** A published snapshot renders the same graph with every write removed. */
  readOnly?: boolean;
  heightClass?: string;
  /** Highlights where a product currently sits. */
  currentStageId?: string | null;
  canPerform?: (transitionId: string) => boolean;
  onPerform?: (transitionId: string) => void;
  onEditStage?: (stage: WorkflowStage) => void;
  onDeleteStage?: (stage: WorkflowStage) => void;
  onDeleteTransition?: (transition: WorkflowTransition) => void;
  onConnectStages?: (srcStageId: string, destStageId: string) => void;
  onAddStage?: () => void;
};

function Graph({
  stages,
  transitions,
  readOnly = false,
  heightClass = "h-[26rem] sm:h-[32rem]",
  currentStageId,
  canPerform,
  onPerform,
  onEditStage,
  onDeleteStage,
  onDeleteTransition,
  onConnectStages,
  onAddStage,
}: WorkflowGraphProps) {
  const positions = useMemo(
    () => layout(stages, transitions),
    [stages, transitions],
  );

  const initialNodes = useMemo<Node[]>(
    () =>
      stages.map((stage) => ({
        id: stage.id,
        type: "stage",
        position: positions.get(stage.id) ?? { x: 0, y: 0 },
        data: {
          stage,
          current: stage.id === currentStageId,
          readOnly,
          onEdit: onEditStage,
          onDelete: onDeleteStage,
        } as unknown as Record<string, unknown>,
      })),
    [stages, positions, currentStageId, readOnly, onEditStage, onDeleteStage],
  );

  const initialEdges = useMemo<Edge[]>(
    () =>
      transitions.map((transition) => {
        const fromCurrent = transition.srcStage.id === currentStageId;
        const stroke = fromCurrent ? "var(--primary)" : "var(--border-strong)";

        return {
          id: transition.id,
          type: "transition",
          source: transition.srcStage.id,
          target: transition.destStage.id,
          animated: fromCurrent,
          style: { stroke, strokeWidth: 1.5 },
          markerEnd: {
            type: MarkerType.ArrowClosed,
            width: 18,
            height: 18,
            color: stroke,
          },
          data: {
            performable: canPerform?.(transition.id) ?? false,
            onPerform: () => onPerform?.(transition.id),
          },
        };
      }),
    [transitions, currentStageId, canPerform, onPerform],
  );

  const [nodes, , onNodesChange] = useNodesState(initialNodes);
  const [edges, , onEdgesChange] = useEdgesState(initialEdges);

  const handleConnect = useCallback(
    (connection: Connection) => {
      if (!connection.source || !connection.target) return;
      if (connection.source === connection.target) return;
      onConnectStages?.(connection.source, connection.target);
    },
    [onConnectStages],
  );

  /**
   * Runs while a connection is dragged, so an invalid target refuses to snap
   * instead of failing after the drop.
   */
  const isValidConnection = useCallback(
    (connection: Connection | Edge) => {
      const { source, target } = connection;
      if (!source || !target || source === target) return false;
      return !transitions.some(
        (t) => t.srcStage.id === source && t.destStage.id === target,
      );
    },
    [transitions],
  );

  const handleEdgesDelete = useCallback(
    (deleted: Edge[]) => {
      const transition = transitions.find((t) => t.id === deleted[0]?.id);
      if (transition) onDeleteTransition?.(transition);
    },
    [transitions, onDeleteTransition],
  );

  const handleNodesDelete = useCallback(
    (deleted: Node[]) => {
      const stage = stages.find((s) => s.id === deleted[0]?.id);
      if (stage) onDeleteStage?.(stage);
    },
    [stages, onDeleteStage],
  );

  if (stages.length === 0) {
    return (
      <div className="px-5 py-16 text-center">
        <p className="text-sm font-medium text-foreground">
          {readOnly ? "This version has no stages" : "No stages yet"}
        </p>
        <p className="mx-auto mt-1.5 max-w-sm text-sm text-muted">
          {readOnly
            ? "It was published before any stage was added."
            : "Add the first stage — it becomes the one work starts at. Then drag between stages to connect them."}
        </p>
        {!readOnly && onAddStage ? (
          <button
            type="button"
            onClick={onAddStage}
            className="mt-5 inline-flex items-center gap-1.5 rounded-lg bg-primary px-3.5 py-2 text-sm font-semibold text-primary-foreground shadow-sm transition-colors hover:bg-primary-hover"
          >
            <PlusIcon className="h-4 w-4" />
            Add stage
          </button>
        ) : null}
      </div>
    );
  }

  return (
    <div className={`w-full ${heightClass}`}>
      <ReactFlow
        nodes={nodes}
        edges={edges}
        nodeTypes={nodeTypes}
        edgeTypes={edgeTypes}
        onNodesChange={onNodesChange}
        onEdgesChange={onEdgesChange}
        onConnect={handleConnect}
        onEdgesDelete={handleEdgesDelete}
        onNodesDelete={handleNodesDelete}
        isValidConnection={isValidConnection}
        nodesConnectable={!readOnly && Boolean(onConnectStages)}
        edgesReconnectable={false}
        // A generous radius means the drag snaps without precise aim.
        connectionRadius={40}
        connectionLineType={ConnectionLineType.SmoothStep}
        connectionLineStyle={{
          stroke: "var(--primary)",
          strokeWidth: 2,
          strokeDasharray: "4 4",
        }}
        // The API owns positions; deleting is confirmed, never immediate.
        deleteKeyCode={null}
        fitView
        // Without maxZoom, one or two stages get blown up to fill the canvas.
        fitViewOptions={{ padding: 0.25, maxZoom: 1 }}
        minZoom={0.3}
        maxZoom={1.5}
        proOptions={{ hideAttribution: true }}
      >
        <Background
          variant={BackgroundVariant.Dots}
          gap={18}
          size={1}
          color="var(--border-strong)"
        />
        <Controls showInteractive={false}>
          {!readOnly && onAddStage ? (
            <ControlButton onClick={onAddStage} title="Add stage">
              <PlusIcon className="h-3.5 w-3.5" />
            </ControlButton>
          ) : null}
        </Controls>
      </ReactFlow>
    </div>
  );
}

/**
 * React Flow needs its provider for viewport state. The inner graph is keyed on
 * the shape of the workflow so adding or removing a stage or transition re-runs
 * the layout, while dragging stays free in between.
 */
export default function WorkflowGraph(props: WorkflowGraphProps) {
  const shape = [
    ...props.stages.map(
      (s) => `${s.id}:${s.name}:${s.isInitial}${s.isTerminal}`,
    ),
    ...props.transitions.map((t) => t.id),
    props.currentStageId ?? "",
  ].join("|");

  return (
    <ReactFlowProvider>
      <Graph key={shape} {...props} />
    </ReactFlowProvider>
  );
}
