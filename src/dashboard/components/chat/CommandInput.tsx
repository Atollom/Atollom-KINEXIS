"use client";

import { useRef, useState } from "react";

interface CommandInputProps {
  onSend: (text: string) => void;
  disabled?: boolean;
}

const QUICK_COMMANDS = [
  "Status de órdenes hoy",
  "Alerta Stock Crítico",
  "CFDIs Pendientes",
  "Agentes Activos",
];

export function CommandInput({ onSend, disabled = false }: CommandInputProps) {
  const [value, setValue] = useState("");
  const [focused, setFocused] = useState(false);
  const [files, setFiles] = useState<File[]>([]);
  const textareaRef = useRef<HTMLTextAreaElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  function handleSubmit() {
    const trimmed = value.trim();
    if (!trimmed || disabled) return;
    onSend(trimmed);
    setValue("");
    if (textareaRef.current) {
      textareaRef.current.style.height = "auto";
    }
  }

  function handleKeyDown(e: React.KeyboardEvent<HTMLTextAreaElement>) {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      handleSubmit();
    }
  }

  function handleInput(e: React.ChangeEvent<HTMLTextAreaElement>) {
    setValue(e.target.value);
    const el = textareaRef.current;
    if (el) {
      el.style.height = "auto";
      el.style.height = `${Math.min(el.scrollHeight, 160)}px`;
    }
  }

  function handleQuickCommand(cmd: string) {
    setValue(cmd);
    textareaRef.current?.focus();
  }

  return (
    <div className="space-y-6">
      {/* Quick commands */}
      <div className="flex gap-3 overflow-x-auto pb-1 custom-scrollbar-hidden">
        {QUICK_COMMANDS.map((cmd) => (
          <button
            key={cmd}
            onClick={() => handleQuickCommand(cmd)}
            className="
              flex-shrink-0
              px-4 py-2
              rounded-xl
              bg-white/5 border border-white/5
              text-[9px] font-black text-white/40 uppercase tracking-[0.2em]
              hover:border-[#ccff00]/30 hover:text-[#ccff00] hover:bg-[#ccff00]/5
              transition-all duration-300
              whitespace-nowrap
            "
          >
            {cmd}
          </button>
        ))}
      </div>

       {/* Files preview */}
       {files.length > 0 && (
         <div className="flex gap-4 pb-2 overflow-x-auto custom-scrollbar-hidden">
           {files.map((file, i) => (
             <div key={i} className="flex items-center gap-3 bg-[#ccff00]/10 border border-[#ccff00]/20 rounded-xl px-4 py-2 animate-luxe">
               <span className="material-symbols-outlined text-[16px] text-[#ccff00]">
                 {file.type.includes('pdf') ? 'description' : 'table_chart'}
               </span>
               <span className="text-[10px] font-black text-[#ccff00] uppercase truncate max-w-[120px]">{file.name}</span>
               <button 
                 onClick={() => setFiles(prev => prev.filter((_, idx) => idx !== i))}
                 className="flex items-center justify-center w-5 h-5 hover:bg-[#ccff00]/20 rounded-full transition-colors"
               >
                 <span className="material-symbols-outlined text-sm text-[#ccff00]">close</span>
               </button>
             </div>
           ))}
         </div>
       )}

       <div
         className={`
           relative flex items-end gap-6
           transition-all duration-500
           ${focused ? "opacity-100" : "opacity-80"}
         `}
       >
          <div className="flex-shrink-0 mb-3 ml-2">
             <div className={`w-2 h-2 rounded-full transition-all duration-300 ${focused ? 'bg-[#ccff00] shadow-[0_0_10px_#ccff00]' : 'bg-white/10'}`} />
          </div>

          <textarea
            ref={textareaRef}
            value={value}
            onChange={handleInput}
            onKeyDown={handleKeyDown}
            onFocus={() => setFocused(true)}
            onBlur={() => setFocused(false)}
            disabled={disabled}
            rows={1}
            placeholder="Neural Core Command..."
            className="
              flex-1
              bg-transparent
              text-[14px] text-white font-medium
              placeholder:text-white/10
              placeholder:uppercase placeholder:tracking-[0.3em] placeholder:text-[10px] placeholder:font-black
              outline-none resize-none
              py-3
              leading-relaxed
            "
          />

          <div className="flex items-center gap-2 mb-2">
            <input 
              ref={fileInputRef} 
              type="file" 
              className="hidden" 
              accept=".pdf,.xlsx,.xls,.csv,.docx"
              multiple
              onChange={(e) => {
                if (e.target.files) {
                  setFiles(prev => [...prev, ...Array.from(e.target.files!)]);
                }
              }}
            />
            <button
              onClick={() => fileInputRef.current?.click()}
              disabled={disabled}
              className="w-10 h-10 rounded-xl bg-white/5 border border-white/5 flex items-center justify-center hover:bg-white/10 hover:border-white/10 transition-all"
              title="Attach operational data (PDF/Excel)"
            >
              <span className="material-symbols-outlined text-[20px] text-white/40">attach_file</span>
            </button>

            <button
              onClick={handleSubmit}
              disabled={disabled || (!value.trim() && files.length === 0)}
              className={`
                w-10 h-10 rounded-xl
                flex items-center justify-center
                transition-all duration-300
                ${(value.trim() || files.length > 0) && !disabled
                  ? "bg-[#ccff00] text-black shadow-[0_0_20px_#ccff0044] hover:scale-105 active:scale-95"
                  : "bg-white/5 text-white/10 cursor-not-allowed"
                }
              `}
            >
              <span className="material-symbols-outlined text-[20px] font-black">
                {disabled ? "sync" : "keyboard_return"}
              </span>
            </button>
          </div>
       </div>

      <div className="flex items-center justify-between px-2 opacity-20">
         <p className="text-[8px] font-black uppercase tracking-[0.2em]">MISSION CONTROL SYSTEM v4.3</p>
         <p className="text-[8px] font-black uppercase tracking-[0.2em]">SECURE / END-TO-END</p>
      </div>
    </div>
  );
}
