'use client';

import React, { useCallback } from 'react';
import {
  ReactFlow,
  Background,
  Controls,
  MiniMap,
  useNodesState,
  useEdgesState,
  addEdge,
  Connection,
  Edge
} from '@xyflow/react';
import '@xyflow/react/dist/style.css';
import Link from 'next/link';

const initialNodes = [
  { id: '1', position: { x: 250, y: 100 }, data: { label: 'Start Request' }, type: 'default' },
  { id: '2', position: { x: 250, y: 200 }, data: { label: 'AI Process' }, className: 'node-llm_call' },
  { id: '3', position: { x: 250, y: 300 }, data: { label: 'Save Result' }, className: 'node-db_write' }
];

const initialEdges = [
  { id: 'e1-2', source: '1', target: '2' },
  { id: 'e2-3', source: '2', target: '3' }
];

export default function WorkflowBuilder({ params }: { params: { workflowId: string } }) {
  const [nodes, setNodes, onNodesChange] = useNodesState(initialNodes);
  const [edges, setEdges, onEdgesChange] = useEdgesState(initialEdges);

  const onConnect = useCallback(
    (params: Connection | Edge) => setEdges((eds) => addEdge(params, eds)),
    [setEdges]
  );

  return (
    <div style={{ display: 'flex', flexDirection: 'column', height: '100%', gap: '16px' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <h1 className="page-title" style={{ marginBottom: 0 }}>Workflow Builder ({params.workflowId})</h1>
        <div style={{ display: 'flex', gap: '12px' }}>
          <button className="button-secondary">Save</button>
          <Link href={`/workflow/${params.workflowId}/run`}>
            <button className="button-primary">Run Workflow</button>
          </Link>
        </div>
      </div>
      
      <div className="glass-card" style={{ flex: 1, display: 'flex', overflow: 'hidden' }}>
        <div style={{ width: '200px', borderRight: '1px solid rgba(255,255,255,0.1)', padding: '16px', display: 'flex', flexDirection: 'column', gap: '12px' }}>
          <h3 style={{ fontSize: '1rem', color: '#fff' }}>Node Types</h3>
          <div className="react-flow__node node-llm_call" style={{ cursor: 'grab' }}>LLM Call</div>
          <div className="react-flow__node node-http_request" style={{ cursor: 'grab' }}>HTTP Request</div>
          <div className="react-flow__node node-db_write" style={{ cursor: 'grab' }}>DB Write</div>
          <div className="react-flow__node node-notify" style={{ cursor: 'grab' }}>Notify</div>
          <div className="react-flow__node node-conditional_branch" style={{ cursor: 'grab' }}>Condition</div>
          <div className="react-flow__node node-approval_gate" style={{ cursor: 'grab' }}>Approval</div>
        </div>
        <div style={{ flex: 1, position: 'relative' }}>
          <ReactFlow
            nodes={nodes}
            edges={edges}
            onNodesChange={onNodesChange}
            onEdgesChange={onEdgesChange}
            onConnect={onConnect}
            fitView
            style={{ background: 'transparent' }}
          >
            <Background color="rgba(255,255,255,0.1)" gap={16} size={1} />
            <Controls />
            <MiniMap style={{ backgroundColor: 'var(--surface-color)' }} />
          </ReactFlow>
        </div>
      </div>
    </div>
  );
}