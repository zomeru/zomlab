"use client";

import {
  type AriaLabelConfig,
  Background,
  BackgroundVariant,
  Controls,
  type Edge,
  Handle,
  MarkerType,
  MiniMap,
  type Node,
  type NodeProps,
  type NodeTypes,
  Position,
  ReactFlow,
} from "@xyflow/react";
import "@xyflow/react/dist/style.css";
import { useMemo } from "react";
import type {
  ArchitectureDiagramDefinition,
  DiagramEdgeDefinition,
  DiagramHandlePosition,
  DiagramNodeDefinition,
  DiagramNodeTone,
} from "./architecture-diagrams";

const NODE_WIDTH = 208;
const NODE_HEIGHT = 72;

interface ArchitectureNodeData extends Record<string, unknown> {
  label: string;
  tone: DiagramNodeTone;
}

type ArchitectureNode = Node<ArchitectureNodeData, "architecture">;

const POSITION_BY_NAME = {
  top: Position.Top,
  right: Position.Right,
  bottom: Position.Bottom,
  left: Position.Left,
} as const;

const NODE_TONE_CLASSES: Record<DiagramNodeTone, string> = {
  default: "border-border-strong bg-card text-foreground",
  primary: "border-primary/60 bg-accent text-accent-foreground",
  success: "border-success/55 bg-success/10 text-foreground",
  warning: "border-warning/55 bg-warning/10 text-foreground",
  danger: "border-destructive/55 bg-destructive/10 text-foreground",
};

const NODE_TYPES: NodeTypes = { architecture: ArchitectureNodeCard };

const ARIA_LABELS: Partial<AriaLabelConfig> = {
  "controls.ariaLabel": "Diagram controls",
  "controls.zoomIn.ariaLabel": "Zoom in",
  "controls.zoomOut.ariaLabel": "Zoom out",
  "controls.fitView.ariaLabel": "Fit diagram",
};

function ArchitectureNodeCard({ data }: NodeProps<ArchitectureNode>) {
  return (
    <div
      className={`flex h-full w-full items-center justify-center rounded-xl border px-4 py-3 text-center font-mono text-[0.8125rem] font-medium leading-5 shadow-[var(--surface-shadow)] ${NODE_TONE_CLASSES[data.tone]}`}
    >
      {(["top", "right", "bottom", "left"] as const).flatMap((position) => [
        <Handle
          key={`${position}-target`}
          id={`${position}-target`}
          type="target"
          position={POSITION_BY_NAME[position]}
          isConnectable={false}
          className="pointer-events-none! size-1.5! border-0! bg-border-strong! opacity-0"
        />,
        <Handle
          key={`${position}-source`}
          id={`${position}-source`}
          type="source"
          position={POSITION_BY_NAME[position]}
          isConnectable={false}
          className="pointer-events-none! size-1.5! border-0! bg-border-strong! opacity-0"
        />,
      ])}
      <span>{data.label}</span>
    </div>
  );
}

function inferHandles(
  edge: DiagramEdgeDefinition,
  nodesById: ReadonlyMap<string, DiagramNodeDefinition>,
) {
  const source = nodesById.get(edge.source);
  const target = nodesById.get(edge.target);

  if (!source || !target) {
    throw new Error(
      `Architecture diagram edge references an unknown node: ${edge.source} -> ${edge.target}`,
    );
  }

  if (source.id === target.id) {
    return { source: "right" as const, target: "bottom" as const };
  }

  const deltaX = target.position.x - source.position.x;
  const deltaY = target.position.y - source.position.y;

  if (Math.abs(deltaX) >= Math.abs(deltaY)) {
    return deltaX >= 0
      ? { source: "right" as const, target: "left" as const }
      : { source: "left" as const, target: "right" as const };
  }

  return deltaY >= 0
    ? { source: "bottom" as const, target: "top" as const }
    : { source: "top" as const, target: "bottom" as const };
}

function handleId(position: DiagramHandlePosition, type: "source" | "target") {
  return `${position}-${type}`;
}

function createFlowElements(definition: ArchitectureDiagramDefinition) {
  const nodes: ArchitectureNode[] = definition.nodes.map((node) => ({
    id: node.id,
    type: "architecture",
    position: node.position,
    width: NODE_WIDTH,
    height: NODE_HEIGHT,
    style: { width: NODE_WIDTH, height: NODE_HEIGHT },
    data: { label: node.label, tone: node.tone ?? "default" },
    ariaLabel: node.label,
    draggable: false,
    connectable: false,
    selectable: false,
  }));
  const nodesById = new Map(definition.nodes.map((node) => [node.id, node]));
  const edges: Edge[] = definition.edges.map((edge, index) => {
    const inferred = inferHandles(edge, nodesById);

    return {
      id: `${edge.source}-${edge.target}-${index}`,
      source: edge.source,
      target: edge.target,
      sourceHandle: handleId(edge.sourceHandle ?? inferred.source, "source"),
      targetHandle: handleId(edge.targetHandle ?? inferred.target, "target"),
      type: "smoothstep",
      label: edge.label,
      markerEnd: { type: MarkerType.ArrowClosed, color: "var(--diagram-border)" },
      style: {
        stroke: "var(--diagram-border)",
        strokeDasharray: edge.dashed ? "6 5" : undefined,
        strokeWidth: 1.5,
      },
      labelStyle: {
        fill: "var(--diagram-foreground)",
        fontFamily: "var(--font-mono)",
        fontSize: 11,
        fontWeight: 500,
      },
      labelBgStyle: { fill: "var(--diagram-background)", fillOpacity: 0.94 },
      labelBgPadding: [6, 4],
      labelBgBorderRadius: 6,
      selectable: false,
      focusable: false,
    };
  });

  return { edges, nodes };
}

interface ArchitectureDiagramCanvasProps {
  definition: ArchitectureDiagramDefinition;
}

export function ArchitectureDiagramCanvas({ definition }: ArchitectureDiagramCanvasProps) {
  const elements = useMemo(() => createFlowElements(definition), [definition]);
  const showMiniMap = definition.nodes.length >= 7;

  return (
    <ReactFlow
      aria-label={`${definition.title} interactive architecture diagram`}
      className="architecture-flow"
      nodes={elements.nodes}
      edges={elements.edges}
      nodeTypes={NODE_TYPES}
      fitView
      fitViewOptions={{ padding: 0.18, minZoom: 0.35, maxZoom: 1.05 }}
      minZoom={0.25}
      maxZoom={1.75}
      nodesDraggable={false}
      nodesConnectable={false}
      nodesFocusable
      edgesFocusable={false}
      elementsSelectable={false}
      zoomOnScroll={false}
      zoomOnDoubleClick={false}
      preventScrolling={false}
      panOnDrag
      deleteKeyCode={null}
      multiSelectionKeyCode={null}
      ariaLabelConfig={ARIA_LABELS}
      proOptions={{ hideAttribution: true }}
    >
      <Background
        variant={BackgroundVariant.Dots}
        color="var(--border-subtle)"
        gap={20}
        size={1.25}
      />
      <Controls position="bottom-left" showInteractive={false} />
      {showMiniMap ? (
        <MiniMap
          ariaLabel="Diagram overview"
          position="bottom-right"
          pannable
          zoomable
          nodeColor="var(--diagram-muted)"
          nodeStrokeColor="var(--diagram-border)"
          maskColor="color-mix(in oklch, var(--diagram-background) 72%, transparent)"
          className="hidden! sm:block!"
        />
      ) : null}
    </ReactFlow>
  );
}
