"use client";

import { memo, useCallback, useEffect, useMemo, useRef, useState } from "react";
import {
  ReactFlow,
  Handle,
  Position,
  BaseEdge,
} from "@xyflow/react";
import "@xyflow/react/dist/style.css";
import { Maximize, Minus, Plus } from "lucide-react";
import { Button } from "@/components/ui/button";
import { FAMILY_NODE_WIDTH, FAMILY_NODE_HEIGHT } from "@/lib/family-tree.mjs";
import HorizontalMemberCard from "@/app/components/HorizontalMemberCard";
import styles from "../family-tree.module.css";

const FamilyNode = memo(function FamilyNode({ data }) {
  const { member, active, dimmed, onSelect, onOpenDetails } = data;
  return (
    <div
      role="button"
      tabIndex={0}
      aria-pressed={active}
      aria-label={`${member.name || member.uniqname}, select to center or select again for details`}
      onKeyDown={(event) => {
        if (event.key === "Enter" || event.key === " ") {
          event.preventDefault();
          active ? onOpenDetails() : onSelect(member.uniqname);
        }
      }}
      className={`${styles.node} ${active ? styles.selectedNode : ""} ${dimmed ? styles.dimNode : ""}`}
    >
      <Handle
        type="target"
        position={Position.Top}
        isConnectable={false}
        className={styles.connectionAnchor}
      />
      <HorizontalMemberCard
        member={member}
        showClass
        showImageFallback
        className={styles.memberCard}
      />
      <Handle
        type="source"
        position={Position.Bottom}
        isConnectable={false}
        className={styles.connectionAnchor}
      />
    </div>
  );
});
const nodeTypes = { member: FamilyNode };
function FamilyEdge({ id, data, style }) {
  const [from, to] = data.points;
  return (
    <BaseEdge
      id={id}
      path={`M ${from.x} ${from.y} L ${to.x} ${to.y}`}
      style={style}
    />
  );
}
const edgeTypes = { family: FamilyEdge };

export default function TreeCanvas({
  graph,
  selectedId,
  focusRevision,
  onSelect,
  onOpenDetails,
  matchIds,
  searching,
  isMobile = false,
}) {
  const flowZone = useRef(null);
  const [instance, setInstance] = useState(null);
  const [zoom, setZoom] = useState(1);
  const selectedRef = useRef(selectedId);
  const previousFocus = useRef({ selectedId, focusRevision });
  selectedRef.current = selectedId;
  const handleWheelCapture = useCallback((event) => {
    if ((!event.ctrlKey && !event.metaKey) || !instance || !flowZone.current) return;
    event.preventDefault();
    event.stopPropagation();
    event.stopImmediatePropagation();
    const viewport = instance.getViewport();
    const bounds = flowZone.current.getBoundingClientRect();
    const pointerX = event.clientX - bounds.left;
    const pointerY = event.clientY - bounds.top;
    const zoom = Math.min(
      2.5,
      Math.max(0.15, viewport.zoom * Math.pow(2, -event.deltaY * 0.006)),
    );
    const ratio = zoom / viewport.zoom;
    instance.setViewport(
      {
        x: pointerX - (pointerX - viewport.x) * ratio,
        y: pointerY - (pointerY - viewport.y) * ratio,
        zoom,
      },
      { duration: 0 },
    );
  }, [instance]);
  useEffect(() => {
    const element = flowZone.current;
    if (!element) return;
    element.addEventListener("wheel", handleWheelCapture, {
      capture: true,
      passive: false,
    });
    return () =>
      element.removeEventListener("wheel", handleWheelCapture, true);
  }, [handleWheelCapture]);
  // Selection changes style without causing the canvas to fit again.
  const structure = graph.nodes
    .map((node) => `${node.uniqname}:${node.x}:${node.y}`)
    .join("|");
  const nodes = useMemo(
    () =>
      graph.nodes.map((member) => ({
        id: member.uniqname,
        type: "member",
        position: { x: member.x, y: member.y },
        data: {
          member,
          onSelect,
          onOpenDetails,
          active: member.uniqname === selectedId,
          dimmed: searching && !matchIds.has(member.uniqname),
        },
        ariaLabel: `${member.name || member.uniqname}, ${member.current_class_number || "class not listed"}. Select to view bigs and littles.`,
        width: FAMILY_NODE_WIDTH,
        height: FAMILY_NODE_HEIGHT,
      })),
    [graph.nodes, selectedId, searching, matchIds, onSelect, onOpenDetails],
  );
  const edges = useMemo(
    () =>
      graph.edges.map((edge) => {
        const active =
          edge.big_uniqname === selectedId ||
          edge.little_uniqname === selectedId;
        return {
          id: `${edge.big_uniqname}:${edge.little_uniqname}`,
          source: edge.big_uniqname,
          target: edge.little_uniqname,
          type: "family",
          data: { points: edge.points },
          style: {
            stroke: active
              ? "var(--primary)"
              : "color-mix(in srgb, var(--muted-foreground) 55%, transparent)",
            strokeWidth: active ? 2 : 1.5,
          },
          zIndex: active ? 1 : 0,
        };
      }),
    [graph.edges, selectedId],
  );

  useEffect(() => {
    const changed = previousFocus.current.selectedId !== selectedId || previousFocus.current.focusRevision !== focusRevision;
    previousFocus.current = { selectedId, focusRevision };
    if (!changed || !instance || !flowZone.current) return;
    const resize = () => {
      const node = instance.getNode(selectedRef.current);
      const bounds = instance.getNodesBounds(instance.getNodes());
      const { clientWidth, clientHeight } = flowZone.current;
      const fitsAtReadableSize =
        bounds.width * 0.8 < clientWidth - 40 &&
        bounds.height * 0.8 < clientHeight - 60;
      if (node && !fitsAtReadableSize) {
        const centerX =
          bounds.width * 0.9 < clientWidth - 48
            ? bounds.x + bounds.width / 2
            : node.position.x + FAMILY_NODE_WIDTH / 2;
        instance.setCenter(centerX, node.position.y + FAMILY_NODE_HEIGHT / 2, {
          zoom: 0.9,
        });
      } else instance.fitView({ padding: 0.04, minZoom: 0.8, maxZoom: 1 });
    };
    const frame = requestAnimationFrame(resize);
    const observer = new ResizeObserver(resize);
    observer.observe(flowZone.current);
    return () => {
      cancelAnimationFrame(frame);
      observer.disconnect();
    };
  }, [instance, structure]);

  useEffect(() => {
    if (!instance || !flowZone.current) return;
    const node = instance.getNode(selectedId);
    if (!node) return;
    const { zoom: currentZoom } = instance.getViewport();
    instance.setCenter(
      node.position.x + FAMILY_NODE_WIDTH / 2,
      node.position.y + FAMILY_NODE_HEIGHT / 2,
      { zoom: Math.max(currentZoom, 0.9), duration: 320 },
    );
  }, [instance, selectedId, focusRevision]);

  return (
    <div className={styles.canvasWrap}>
      <div
        ref={flowZone}
        className={styles.flowZone}
      >
        <ReactFlow
          proOptions={{ hideAttribution: true }}
          nodes={nodes}
          edges={edges}
          nodeTypes={nodeTypes}
          edgeTypes={edgeTypes}
          onInit={setInstance}
          onNodeClick={(_, node) => {
            if (node.id === selectedId) onOpenDetails();
            else onSelect(node.id);
          }}
          zoomOnDoubleClick={false}
          onViewportChange={(viewport) => setZoom(viewport.zoom)}
          nodesFocusable={false}
          nodesDraggable={false}
          nodesConnectable={false}
          edgesFocusable={false}
          elementsSelectable={false}
          minZoom={0.15}
          maxZoom={2.5}
          fitView
          fitViewOptions={{ padding: 0.08, minZoom: 0.3, maxZoom: 0.9 }}
          zoomOnPinch
          panOnDrag
          panOnScroll
          panOnScrollSpeed={3.2}
          zoomActivationKeyCode="Control"
          preventScrolling
          aria-label="Family tree. Drag or swipe to move, pinch or use the controls to zoom."
        ></ReactFlow>
      </div>
      <div className={styles.canvasFooter}>
        <span className={styles.canvasHint}>
          {isMobile
            ? "Drag to move · Pinch to zoom"
            : "Drag or scroll to pan · Pinch or Ctrl+scroll to zoom"}
        </span>
        <div className={styles.zoomControls}>
          <Button
            size="icon"
            variant="ghost"
            aria-label="Zoom out"
            disabled={zoom <= 0.15}
            onClick={() => instance?.zoomOut()}
          >
            <Minus />
          </Button>
          <span className={styles.zoomValue}>{Math.round(zoom * 100)}%</span>
          <Button
            size="icon"
            variant="ghost"
            aria-label="Zoom in"
            disabled={zoom >= 2.5}
            onClick={() => instance?.zoomIn()}
          >
            <Plus />
          </Button>
          <span className={styles.controlDivider} />
          <Button
            size="icon"
            variant="ghost"
            aria-label="Fit tree to view"
            onClick={() =>
            instance?.fitView({ padding: 0.08, minZoom: 0.3, maxZoom: 0.9 })
            }
          >
            <Maximize />
          </Button>
        </div>
      </div>
    </div>
  );
}
