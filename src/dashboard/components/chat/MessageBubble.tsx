import type { ChatMessage } from "@/types";
import { AgentAvatar } from "./AgentAvatar";

interface MessageBubbleProps {
  message: ChatMessage;
  agentName?: string;
  isStreaming?: boolean;
}

function formatTime(iso: string): string {
  return new Date(iso).toLocaleTimeString("es-MX", {
    hour: "2-digit",
    minute: "2-digit",
  });
}

export function MessageBubble({
  message,
  agentName = "KINEXIS",
  isStreaming = false,
}: MessageBubbleProps) {
  const isAssistant = message.role === "assistant";

  if (isAssistant) {
    return (
      <div className="flex gap-6 items-start max-w-[90%] group">
        <div className="flex-shrink-0 mt-1">
           <AgentAvatar name={agentName} size="md" />
        </div>

        <div className="flex-1 min-w-0 space-y-2">
          <div className="flex items-center gap-3">
            <span className="text-[10px] font-black text-[#ccff00] uppercase tracking-[0.2em] italic">
              {agentName}
            </span>
            <span className="w-1 h-1 rounded-full bg-white/10" />
            <span className="text-[9px] font-black text-white/20 uppercase tracking-widest font-mono">
              {formatTime(message.ts)}
            </span>
          </div>

          <div
            className="
              glass-card rounded-[2rem] rounded-tl-none
              px-8 py-6
              text-[13px] text-white leading-[1.8] font-medium
              whitespace-pre-wrap shadow-xl border border-white/5
            "
          >
            {message.content}
            {isStreaming && (
              <span className="inline-flex items-center gap-1 ml-2">
                 <span className="w-1.5 h-1.5 rounded-full bg-[#ccff00] animate-pulse" />
                 <span className="w-1.5 h-1.5 rounded-full bg-[#ccff00] animate-pulse delay-75" />
                 <span className="w-1.5 h-1.5 rounded-full bg-[#ccff00] animate-pulse delay-150" />
              </span>
            )}
          </div>
        </div>
      </div>
    );
  }

  /* ── User bubble ── */
  return (
    <div className="flex gap-6 items-start max-w-[80%] ml-auto flex-row-reverse group">
      <div className="w-12 h-12 rounded-2xl bg-white/5 flex items-center justify-center flex-shrink-0 border border-white/10" aria-hidden="true">
        <span className="material-symbols-outlined text-white/20">person</span>
      </div>

      <div className="flex-1 min-w-0 space-y-2 text-right">
        <div className="flex items-center gap-3 justify-end">
          <span className="text-[9px] font-black text-white/20 uppercase tracking-widest font-mono">
            {formatTime(message.ts)}
          </span>
          <span className="w-1 h-1 rounded-full bg-white/10" />
          <span className="text-[10px] font-black text-white/40 uppercase tracking-[0.2em] italic">
            Operator
          </span>
        </div>

        <div
          className="
            bg-white/5 border border-white/5
            rounded-[2rem] rounded-tr-none
            px-8 py-5
            text-[13px] text-white/80 leading-relaxed font-medium
            whitespace-pre-wrap italic opacity-90
          "
        >
          {message.content}
        </div>
      </div>
    </div>
  );
}

export function GuardianSeparator({ label }: { label: string }) {
  return (
    <div className="flex items-center gap-6 py-8" role="separator">
      <div className="flex-1 h-px bg-white/5" />
      <span className="text-[9px] font-black text-white/20 uppercase tracking-[0.5em] italic">
        {label}
      </span>
      <div className="flex-1 h-px bg-white/5" />
    </div>
  );
}
