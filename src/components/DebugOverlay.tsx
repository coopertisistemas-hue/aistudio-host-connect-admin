import React, { useState, useEffect } from 'react';
import { useAuth } from '@/hooks/useAuth';
import { Terminal, X, ChevronRight, Activity, AlertCircle } from 'lucide-react';

const DebugOverlay = () => {
    const [isOpen, setIsOpen] = useState(false);
    const [isDebugEnabled, setIsDebugEnabled] = useState(false);
    const { user, loading, userRole, userPlan, session } = useAuth();
    const [customLogs, setCustomLogs] = useState<string[]>([]);

    useEffect(() => {
        const checkDebug = () => {
            const stored = localStorage.getItem('debug');
            setIsDebugEnabled(stored !== 'false');
        };

        checkDebug();
        const interval = setInterval(checkDebug, 1000);

        // Instead of intercepting ALL console logs, let's provide a window global for custom logs
        // this avoids infinite loops and circular reference crashes
        (window as any).__DEBUG_LOG = (msg: string) => {
            setCustomLogs(prev => [msg, ...prev].slice(0, 20));
        };

        return () => {
            clearInterval(interval);
            delete (window as any).__DEBUG_LOG;
        };
    }, []);

    if (!isDebugEnabled) return null;

    return (
        <div className="fixed bottom-4 right-4 z-[9999] flex flex-col items-end">
            {isOpen ? (
                <div className="bg-slate-900 text-slate-100 p-4 rounded-lg shadow-2xl border border-slate-700 w-80 max-h-[80vh] overflow-hidden flex flex-col font-mono text-xs">
                    <div className="flex justify-between items-center mb-4 pb-2 border-b border-slate-700">
                        <div className="flex items-center gap-2">
                            <Terminal size={14} className="text-green-400" />
                            <span className="font-bold">DEBUG PANEL</span>
                        </div>
                        <button onClick={() => setIsOpen(false)} className="hover:text-red-400 p-1">
                            <X size={16} />
                        </button>
                    </div>

                    <div className="space-y-3 mb-4">
                        <div className="flex justify-between items-center">
                            <span className="text-slate-400 uppercase text-[10px]">Auth User</span>
                            <span className={user ? "text-green-400 font-bold" : "text-amber-400"}>
                                {user ? user.email : 'Unauthenticated'}
                            </span>
                        </div>
                        <div className="flex justify-between items-center">
                            <span className="text-slate-400 uppercase text-[10px]">Loading State</span>
                            <span className={loading ? "text-indigo-400 animate-pulse font-bold" : "text-green-500"}>
                                {loading ? 'LOADING...' : 'READY'}
                            </span>
                        </div>
                        <div className="flex justify-between items-center">
                            <span className="text-slate-400 uppercase text-[10px]">Session</span>
                            <span className={session ? "text-blue-400" : "text-slate-500"}>
                                {session ? 'ACTIVE' : 'NONE'}
                            </span>
                        </div>
                        <div className="flex justify-between items-center">
                            <span className="text-slate-400 uppercase text-[10px]">Role / Plan</span>
                            <span className="text-slate-300">
                                {userRole || 'none'} / {userPlan || 'none'}
                            </span>
                        </div>
                    </div>

                    {loading && (
                        <div className="mb-4 p-2 bg-indigo-900/30 border border-indigo-500/50 rounded flex items-center gap-2 text-indigo-200 animate-pulse">
                            <Activity size={14} />
                            <span>Aguardando autenticação...</span>
                        </div>
                    )}

                    <div className="flex-1 overflow-y-auto bg-slate-950 p-2 rounded border border-slate-800 space-y-1 min-h-[100px]">
                        <div className="text-slate-500 italic mb-1 flex items-center gap-1">
                            <Activity size={10} /> application logs
                        </div>
                        {customLogs.map((log, i) => (
                            <div key={i} className="whitespace-pre-wrap break-all text-slate-400">
                                <span className="opacity-30 mr-1">{'>'}</span>{log}
                            </div>
                        ))}
                        {customLogs.length === 0 && <div className="text-slate-600">No logs captured.</div>}
                    </div>

                    <div className="mt-4 flex gap-2">
                        <button
                            onClick={() => {
                                localStorage.clear();
                                window.location.reload();
                            }}
                            className="flex-1 px-2 py-1 bg-red-900/50 hover:bg-red-900 text-red-200 rounded text-[10px] border border-red-700 transition-colors"
                        >
                            Reset Full
                        </button>
                        <button
                            onClick={() => {
                                localStorage.setItem('debug', 'false');
                                setIsOpen(false);
                            }}
                            className="flex-1 px-2 py-1 bg-slate-800 hover:bg-slate-700 text-slate-300 rounded text-[10px] border border-slate-600 transition-colors"
                        >
                            Hide Panel
                        </button>
                    </div>
                </div>
            ) : (
                <button
                    onClick={() => setIsOpen(true)}
                    className="bg-slate-900/90 hover:bg-slate-900 text-green-400 p-3 rounded-full shadow-lg border border-slate-700 backdrop-blur-sm transition-all hover:scale-110 flex items-center gap-2"
                >
                    <Terminal size={20} />
                    {loading && <span className="animate-spin h-2 w-2 bg-indigo-500 rounded-full"></span>}
                </button>
            )}
        </div>
    );
};

export default DebugOverlay;
