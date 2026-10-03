import React, { useState } from 'react';
import { Play, RotateCcw, Send, HelpCircle, CheckCircle, AlertTriangle } from 'lucide-react';

export const SimulationSandbox: React.FC = () => {
  // State for 3 distributed processes with Vector Clocks [P_A, P_B, P_C]
  const [clocks, setClocks] = useState<{ A: number[]; B: number[]; C: number[] }>({
    A: [1, 0, 0],
    B: [0, 1, 0],
    C: [0, 0, 1],
  });

  const [messageInFlight, setMessageInFlight] = useState<{
    from: 'A' | 'B' | 'C';
    to: 'A' | 'B' | 'C';
    vector: number[];
  } | null>(null);

  const [eventLog, setEventLog] = useState<string[]>([
    'T0: Initial state established. Each process initializes vector clock [0, 0, 0].',
    'T1: Local event on Node A: vector clock updated to [1, 0, 0].',
  ]);

  const [latencyMs, setLatencyMs] = useState(800);

  // Trigger local event on node
  const handleLocalEvent = (node: 'A' | 'B' | 'C') => {
    const idx = node === 'A' ? 0 : node === 'B' ? 1 : 2;
    setClocks(prev => {
      const nextVec = [...prev[node]];
      nextVec[idx] += 1;
      return { ...prev, [node]: nextVec };
    });
    setEventLog(prev => [
      `Local computation on Node ${node}. Vector clock advanced to [${clocks[node].map((v, i) => i === idx ? v + 1 : v).join(', ')}].`,
      ...prev.slice(0, 5),
    ]);
  };

  // Send message from one node to another
  const handleSendMessage = (from: 'A' | 'B' | 'C', to: 'A' | 'B' | 'C') => {
    if (from === to || messageInFlight) return;

    const fromIdx = from === 'A' ? 0 : from === 'B' ? 1 : 2;
    const sentVector = [...clocks[from]];
    sentVector[fromIdx] += 1;

    setClocks(prev => ({ ...prev, [from]: sentVector }));
    setMessageInFlight({ from, to, vector: sentVector });

    setEventLog(prev => [
      `Node ${from} sent message to Node ${to} carrying vector [${sentVector.join(', ')}].`,
      ...prev.slice(0, 5),
    ]);

    setTimeout(() => {
      // Deliver message to receiver
      setClocks(prev => {
        const toIdx = to === 'A' ? 0 : to === 'B' ? 1 : 2;
        const merged = prev[to].map((val, i) => Math.max(val, sentVector[i]));
        merged[toIdx] += 1;
        return { ...prev, [to]: merged };
      });

      setEventLog(prev => [
        `Node ${to} received message from ${from}. Merged max vectors and incremented local clock: [${clocks[to].map((v, i) => Math.max(v, sentVector[i]) + (i === (to === 'A' ? 0 : to === 'B' ? 1 : 2) ? 1 : 0)).join(', ')}].`,
        ...prev.slice(0, 5),
      ]);
      setMessageInFlight(null);
    }, latencyMs);
  };

  const handleReset = () => {
    setClocks({
      A: [1, 0, 0],
      B: [0, 1, 0],
      C: [0, 0, 1],
    });
    setMessageInFlight(null);
    setEventLog(['System reset. Vectors re-initialized.']);
  };

  return (
    <div className="bg-slate-900 text-slate-100 rounded-xl p-5 border border-slate-800 shadow-md my-6">
      {/* Simulation Stage Header */}
      <div className="flex flex-wrap items-center justify-between gap-3 pb-4 border-b border-slate-800">
        <div>
          <div className="flex items-center gap-2">
            <span className="w-2 h-2 rounded-full bg-emerald-400 animate-ping"></span>
            <h4 className="text-sm font-semibold tracking-wide text-white">
              Interactive Sandbox: Vector Clock Causality Simulation
            </h4>
          </div>
          <p className="text-xs text-slate-400 mt-0.5">
            Manipulate distributed nodes to observe Lamport-Mattern vector merge rules: V_j[k] = max(V_j[k], V_msg[k]).
          </p>
        </div>

        <div className="flex items-center gap-2">
          <button
            onClick={handleReset}
            className="flex items-center gap-1.5 px-2.5 py-1 text-xs bg-slate-800 hover:bg-slate-700 text-slate-300 rounded-md transition-colors"
          >
            <RotateCcw className="w-3.5 h-3.5" />
            <span>Reset Clocks</span>
          </button>
        </div>
      </div>

      {/* Visual Canvas: 3 Node Timelines */}
      <div className="py-6 grid grid-cols-1 md:grid-cols-3 gap-4">
        {[
          { id: 'A', name: 'Node A (Leader)', color: 'border-cyan-500/50 text-cyan-400' },
          { id: 'B', name: 'Node B (Follower)', color: 'border-indigo-500/50 text-indigo-400' },
          { id: 'C', name: 'Node C (Follower)', color: 'border-emerald-500/50 text-emerald-400' },
        ].map((node) => {
          const currentVec = clocks[node.id as 'A' | 'B' | 'C'];
          const isSender = messageInFlight?.from === node.id;
          const isReceiver = messageInFlight?.to === node.id;

          return (
            <div
              key={node.id}
              className={`p-4 rounded-lg bg-slate-950/70 border ${node.color} transition-all relative overflow-hidden`}
            >
              {isReceiver && (
                <div className="absolute inset-0 bg-indigo-500/10 animate-pulse pointer-events-none"></div>
              )}

              <div className="flex items-center justify-between mb-3">
                <span className="text-xs font-semibold">{node.name}</span>
                <span className="text-[11px] font-mono px-1.5 py-0.5 bg-slate-800 text-slate-300 rounded">
                  ID: {node.id}
                </span>
              </div>

              {/* Vector representation */}
              <div className="bg-slate-900 border border-slate-800 rounded-md p-3 mb-4 text-center">
                <span className="text-[11px] text-slate-400 block mb-1 font-mono uppercase tracking-wider">
                  Vector Clock [A, B, C]
                </span>
                <div className="text-xl font-mono font-bold tracking-widest text-white tabular-nums">
                  [{currentVec.join(', ')}]
                </div>
              </div>

              {/* Node actions */}
              <div className="space-y-2">
                <button
                  onClick={() => handleLocalEvent(node.id as any)}
                  className="w-full py-1.5 px-3 text-xs bg-slate-800 hover:bg-slate-700 text-slate-200 rounded font-medium transition-colors"
                >
                  Trigger Local Event (+1)
                </button>

                <div className="grid grid-cols-2 gap-1.5 pt-1">
                  {(['A', 'B', 'C'] as const)
                    .filter((target) => target !== node.id)
                    .map((target) => (
                      <button
                        key={target}
                        disabled={Boolean(messageInFlight)}
                        onClick={() => handleSendMessage(node.id as any, target)}
                        className="py-1 px-2 text-[11px] bg-indigo-600/30 hover:bg-indigo-600/50 text-indigo-200 border border-indigo-500/30 rounded font-medium flex items-center justify-center gap-1 disabled:opacity-40 transition-colors"
                      >
                        <Send className="w-2.5 h-2.5" />
                        <span>Send to {target}</span>
                      </button>
                    ))}
                </div>
              </div>
            </div>
          );
        })}
      </div>

      {/* Flight status */}
      {messageInFlight && (
        <div className="mb-4 p-2.5 bg-indigo-950/80 border border-indigo-700/50 rounded-lg text-xs text-indigo-300 flex items-center gap-2 animate-pulse">
          <Send className="w-3.5 h-3.5 text-indigo-400" />
          <span>
            Packet in transit from Node {messageInFlight.from} to Node {messageInFlight.to} with Vector [{messageInFlight.vector.join(', ')}]...
          </span>
        </div>
      )}

      {/* Interactive log & concept annotation */}
      <div className="border-t border-slate-800 pt-3">
        <div className="flex items-center justify-between text-xs text-slate-400 mb-2 font-mono">
          <span>EVENT CAUSALITY LOG</span>
          <span>{latencyMs}ms transmission delay</span>
        </div>
        <div className="space-y-1 font-mono text-[11px] text-slate-300 bg-slate-950 p-2.5 rounded-md max-h-24 overflow-y-auto">
          {eventLog.map((log, i) => (
            <div key={i} className="leading-relaxed truncate">
              {log}
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};
