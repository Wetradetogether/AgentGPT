import type { ComponentProps, MouseEvent } from "react";
import React, { forwardRef, useCallback, useImperativeHandle, useState } from "react";
import type { Connection, EdgeChange, FitViewOptions, NodeChange } from "reactflow";
import ReactFlow, {
  addEdge,
  applyEdgeChanges,
  applyNodeChanges,
  Background,
  BackgroundVariant,
  Controls,
  MiniMap,
  ReactFlowProvider,
  useReactFlow,
} from "reactflow";

import "reactflow/dist/style.css";

import CustomEdge from "./BasicEdge";
import { BasicNode, IfNode, TriggerNode } from "./nodes";
import type { EdgesModel, NodesModel } from "../../types/workflow";

const nodeTypes = {
  if: IfNode,
  custom: BasicNode,
  trigger: TriggerNode,
};

const edgeTypes = {
  custom: CustomEdge,
};

const fitViewOptions: FitViewOptions = {
  padding: 0.2,
};

interface FlowChartProps extends ComponentProps<typeof ReactFlow> {
  onSave?: (e: MouseEvent<HTMLButtonElement>) => Promise<void>;
  controls?: boolean;
  minimap?: boolean;
  onPaneDoubleClick: (event: MouseEvent | TouchEvent) => void;

  // workflow: Workflow;
  nodesModel: NodesModel;
  edgesModel: EdgesModel;
}

export interface FlowChartHandles {
  fitView: () => void;
}

const FlowChart = forwardRef<FlowChartHandles, FlowChartProps>(
  ({ onSave, nodesModel, edgesModel, ...props }, ref) => {
    const [nodes, setNodes] = nodesModel;
    const [edges, setEdges] = edgesModel;
    const flow = useReactFlow();
    const [lastClickTime, setLastClickTime] = useState<number | null>(null);
    const [connectionDragging, setConnectionDragging] = useState<boolean>(false);
    const { onPaneDoubleClick } = props;
    const handlePaneClick = (event: MouseEvent) => {
      // Check if it was a double click
      const currentTime = new Date().getTime();
      const doubleClickDelay = 250;
      if (lastClickTime && currentTime - lastClickTime < doubleClickDelay) {
        onPaneDoubleClick(event);
      } else {
        setLastClickTime(currentTime);
      }
    };

    const onNodesChange = useCallback(
      (changes: NodeChange[]) => setNodes((nds) => applyNodeChanges(changes, nds ?? [])),
      [setNodes]
    );
    const onEdgesChange = useCallback(
      (changes: EdgeChange[]) => setEdges((eds) => applyEdgeChanges(changes, eds ?? [])),
      [setEdges]
    );

    const onConnectStart = useCallback(() => {
      connectionDragging.current = true;
    }, [connectionDragging]);

    const onConnect = useCallback(
      (connection: Connection) => {
        connectionDragging.current = false;
        setEdges((eds) => addEdge({ ...connection, animated: true }, eds ?? []));
      },
      [setEdges]
    );

    const onConnectEnd = useCallback(
      (event: MouseEvent | TouchEvent) => {
        if (!connectionDragging.current) return;
        connectionDragging.current = false;
        onPaneDoubleClick(getExactPosition(event));
      },
      [getExactPosition, onPaneDoubleClick, connectionDragging]
    );

    useImperativeHandle(ref, () => ({
      fitView: () => {
        flow?.fitView(fitViewOptions);
      },
    }));

    return (
      <ReactFlow
        nodes={nodes}
        edges={edges}
        onNodesChange={onNodesChange}
        onEdgesChange={onEdgesChange}
        onConnectStart={onConnectStart}
        onConnect={onConnect}
        onConnectEnd={(event) => onConnectEnd(event)}
        nodeTypes={nodeTypes}
        edgeTypes={edgeTypes}
        proOptions={{ hideAttribution: true }}
        fitViewOptions={fitViewOptions}
        fitView
        zoomOnDoubleClick={false}
        {...props}
        onPaneClick={handlePaneClick}
      >
        <Background
          variant={BackgroundVariant.Lines}
          lineWidth={1}
          gap={80}
          className="bg-neutral-50"
          color="#e5e7eb"
        />
        <div
          className="absolute h-full w-full"
          style={{
            background: "radial-gradient(ellipse at center, transparent, white)",
          }}
        />

        {props.minimap && <MiniMap nodeStrokeWidth={3} />}
        {props.controls && <Controls />}
      </ReactFlow>
    );
  }
);

FlowChart.displayName = "FlowChart";

const WrappedFlowchart = forwardRef<FlowChartHandles, FlowChartProps>((props, ref) => {
  return (
    <ReactFlowProvider>
      {/* @ts-ignore*/}
      <FlowChart ref={ref} {...props} />
    </ReactFlowProvider>
  );
});

WrappedFlowchart.displayName = "WrappedFlowchart";
export default WrappedFlowchart;
