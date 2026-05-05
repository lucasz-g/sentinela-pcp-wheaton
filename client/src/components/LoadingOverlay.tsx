import { useEffect, useState } from "react";

const MESSAGES = [
  "Lendo planilha...",
  "Processando ordens de produção...",
  "Calculando caminhos críticos...",
  "Identificando atrasos...",
  "Organizando por prefixo...",
  "Quase pronto...",
];

interface LoadingOverlayProps {
  visible: boolean;
  /** "upload" = new file, "restore" = restoring from cache, "reset" = resetting */
  mode?: "upload" | "restore" | "reset";
}

export function LoadingOverlay({ visible, mode = "upload" }: LoadingOverlayProps) {
  const [msgIndex, setMsgIndex] = useState(0);
  const [fadeMsg, setFadeMsg] = useState(true);
  const [show, setShow] = useState(false);
  const [leaving, setLeaving] = useState(false);

  // Cycle messages while visible
  useEffect(() => {
    if (!visible) return;
    const id = setInterval(() => {
      setFadeMsg(false);
      setTimeout(() => {
        setMsgIndex(i => (i + 1) % MESSAGES.length);
        setFadeMsg(true);
      }, 300);
    }, 1800);
    return () => clearInterval(id);
  }, [visible]);

  // Mount / unmount with fade
  useEffect(() => {
    if (visible) {
      setLeaving(false);
      setShow(true);
      setMsgIndex(0);
      setFadeMsg(true);
    } else {
      setLeaving(true);
      const t = setTimeout(() => setShow(false), 400);
      return () => clearTimeout(t);
    }
  }, [visible]);

  if (!show) return null;

  const title =
    mode === "restore"
      ? "Restaurando dados salvos"
      : mode === "reset"
      ? "Limpando dados..."
      : "Processando planilha";

  return (
    <div
      className={`fixed inset-0 z-[100] flex flex-col items-center justify-center transition-all duration-400 ${
        leaving ? "opacity-0 scale-[1.02]" : "opacity-100 scale-100"
      }`}
      style={{ background: "rgba(15, 23, 42, 0.82)", backdropFilter: "blur(6px)" }}
    >
      {/* Card */}
      <div
        className={`bg-slate-900 border border-slate-700 rounded-2xl px-10 py-9 flex flex-col items-center gap-6 shadow-2xl transition-all duration-400 ${
          leaving ? "opacity-0 translate-y-2" : "opacity-100 translate-y-0"
        }`}
        style={{ minWidth: 300 }}
      >
        {/* Gear / gear animation */}
        <div className="relative w-16 h-16">
          {/* Outer ring */}
          <svg
            className="absolute inset-0 w-full h-full animate-spin"
            style={{ animationDuration: "2.4s" }}
            viewBox="0 0 64 64"
            fill="none"
          >
            <circle
              cx="32"
              cy="32"
              r="28"
              stroke="#1e40af"
              strokeWidth="3"
              strokeLinecap="round"
              strokeDasharray="44 132"
            />
          </svg>
          {/* Middle ring */}
          <svg
            className="absolute inset-0 w-full h-full animate-spin"
            style={{ animationDuration: "1.6s", animationDirection: "reverse" }}
            viewBox="0 0 64 64"
            fill="none"
          >
            <circle
              cx="32"
              cy="32"
              r="20"
              stroke="#3b82f6"
              strokeWidth="2.5"
              strokeLinecap="round"
              strokeDasharray="22 104"
            />
          </svg>
          {/* Inner dot */}
          <div className="absolute inset-0 flex items-center justify-center">
            <div className="w-4 h-4 rounded-full bg-blue-500 animate-pulse" />
          </div>
        </div>

        {/* Title */}
        <div className="text-center space-y-1.5">
          <h3 className="text-white font-semibold text-base tracking-tight">{title}</h3>
          <p
            className="text-slate-400 text-sm transition-opacity duration-300"
            style={{ opacity: fadeMsg ? 1 : 0 }}
          >
            {MESSAGES[msgIndex]}
          </p>
        </div>

        {/* Progress bar (indeterminate) */}
        <div className="w-full h-1 rounded-full bg-slate-700 overflow-hidden">
          <div
            className="h-full rounded-full bg-blue-500"
            style={{
              animation: "indeterminate 1.6s ease-in-out infinite",
              width: "40%",
            }}
          />
        </div>
      </div>

      <style>{`
        @keyframes indeterminate {
          0%   { transform: translateX(-100%) scaleX(0.5); }
          50%  { transform: translateX(112%) scaleX(1.2); }
          100% { transform: translateX(250%) scaleX(0.5); }
        }
      `}</style>
    </div>
  );
}