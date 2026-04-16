"use client";

import { useState } from "react";

interface Discrepancy {
  sku: string;
  name: string;
  systemStock: number;
  excelStock: number;
  predictedDays: number;
}

export function ExcelUploadComponent() {
  const [dragActive, setDragActive] = useState(false);
  const [category, setCategory] = useState<"almacen" | "precios" | "proveedores" | "clientes">("almacen");
  const [analysis, setAnalysis] = useState<Discrepancy[] | null>(null);
  const [analyzing, setAnalyzing] = useState(false);

  const categories = [
    { id: "almacen", label: "Warehouse", icon: "warehouse" },
    { id: "precios", label: "Pricing", icon: "sell" },
    { id: "proveedores", label: "Vendors", icon: "badge" },
    { id: "clientes", label: "Clients", icon: "groups" },
  ];

  const handleDrag = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    if (e.type === "dragenter" || e.type === "dragover") {
      setDragActive(true);
    } else if (e.type === "dragleave") {
      setDragActive(false);
    }
  };

  const simulateAnalysis = () => {
    setAnalyzing(true);
    setTimeout(() => {
      if (category === "almacen") {
        setAnalysis([
          { sku: "SKU-PRO-001", name: "Magnetic MagSafe Charger", systemStock: 45, excelStock: 120, predictedDays: 14 },
          { sku: "SKU-PRO-042", name: "Midnight Silicone Case", systemStock: 12, excelStock: 5, predictedDays: 3 },
          { sku: "SKU-PRO-089", name: "Pro Screen Protector", systemStock: 230, excelStock: 230, predictedDays: 45 },
        ]);
      } else {
        setAnalysis([
          { sku: "NEW-DATA-001", name: "Imported Node #1", systemStock: 0, excelStock: 100, predictedDays: 0 },
        ]);
      }
      setAnalyzing(false);
    }, 2000);
  };

  return (
    <div className="glass-card rounded-[3.5rem] border border-white/5 p-1 shadow-2xl overflow-hidden animate-luxe relative group">
      <div className="absolute top-0 right-0 w-64 h-64 bg-[#ccff00]/5 rounded-full blur-[100px] pointer-events-none group-hover:bg-[#ccff00]/10 transition-colors duration-1000" />
      
      <div className="bg-white/[0.01] rounded-[3.2rem] p-10 relative z-10">
        
        {/* Module Selector */}
        {!analysis && !analyzing && (
          <div className="flex gap-4 mb-12 justify-center">
            {categories.map((cat) => (
              <button
                key={cat.id}
                onClick={() => setCategory(cat.id as any)}
                className={`
                  flex flex-col items-center gap-3 p-6 rounded-3xl border transition-all duration-500 w-32 group/cat
                  ${category === cat.id 
                    ? "bg-white/10 border-white/10 text-white shadow-xl italic" 
                    : "bg-white/[0.02] border-white/5 text-white/20 hover:text-white hover:bg-white/5"
                  }
                `}
              >
                <span className={`material-symbols-outlined text-2xl ${category === cat.id ? 'text-[#ccff00] shadow-volt' : 'group-hover/cat:text-white transition-colors'}`}>{cat.icon}</span>
                <span className="text-[9px] font-black uppercase tracking-[0.2em]">{cat.label}</span>
              </button>
            ))}
          </div>
        )}

        {!analysis && !analyzing ? (
          <div 
            className={`
              border-2 border-dashed rounded-[2.5rem] p-16 text-center transition-all duration-700 relative overflow-hidden group/drop
              ${dragActive ? "border-[#ccff00] bg-[#ccff00]/5 scale-[0.98]" : "border-white/5 hover:border-white/10 hover:bg-white/[0.01]"}
            `}
            onDragEnter={handleDrag}
            onDragLeave={handleDrag}
            onDragOver={handleDrag}
            onDrop={(e) => {
              e.preventDefault();
              setDragActive(false);
              simulateAnalysis();
            }}
          >
            <div className="absolute inset-0 bg-gradient-to-br from-[#ccff00]/0 to-[#ccff00]/5 opacity-0 group-hover/drop:opacity-100 transition-opacity duration-1000" />
            
            <div className="w-20 h-20 bg-white/5 rounded-2xl flex items-center justify-center mx-auto mb-8 border border-white/5 group-hover/drop:border-[#ccff00]/20 transition-all">
              <span className="material-symbols-outlined text-[#ccff00] text-3xl shadow-volt">upload_file</span>
            </div>
            <h3 className="text-2xl font-black italic text-white uppercase tracking-tighter mb-3">Neural Data Ingest</h3>
            <p className="text-white/20 text-[10px] font-black uppercase tracking-[0.3em] max-w-sm mx-auto mb-10 italic leading-relaxed">
              Drop external registry (Excel/CSV) for instant Samantha cross-node synchronization.
            </p>
            <button 
              onClick={simulateAnalysis}
              className="h-14 bg-[#ccff00] text-black px-12 rounded-2xl text-[10px] font-black uppercase tracking-[0.2em] hover:shadow-volt hover:scale-105 active:scale-95 transition-all italic"
            >
              Select Local Node
            </button>
          </div>
        ) : analyzing ? (
          <div className="py-24 text-center space-y-10">
            <div className="relative w-24 h-24 mx-auto">
              <div className="absolute inset-0 border-4 border-white/5 rounded-full" />
              <div className="absolute inset-0 border-4 border-[#ccff00] rounded-full border-t-transparent animate-spin shadow-volt" />
              <div className="absolute inset-4 bg-[#ccff00]/10 rounded-full animate-pulse" />
            </div>
            <div>
               <p className="text-white font-black italic text-xl uppercase tracking-tighter animate-pulse">Samantha conducting cross-audit...</p>
               <p className="text-white/20 text-[9px] font-black uppercase tracking-[0.5em] mt-3">Syncing Neural Fragments #32 & #5</p>
            </div>
          </div>
        ) : (
          <div className="animate-in fade-in slide-in-from-bottom-4 duration-700">
            <div className="flex items-center justify-between mb-12 border-b border-white/5 pb-8">
              <div>
                <h3 className="text-2xl font-black italic text-white uppercase tracking-tighter">Entropy Detection Result</h3>
                <p className="text-[10px] font-black text-white/20 uppercase tracking-[0.3em] mt-1 italic">Internal Cluster vs. External Fragment Audit</p>
              </div>
              <button 
                onClick={() => setAnalysis(null)}
                className="w-10 h-10 rounded-xl bg-white/5 border border-white/5 text-white/20 hover:text-white transition-all flex items-center justify-center"
              >
                <span className="material-symbols-outlined text-lg">close</span>
              </button>
            </div>

            <div className="overflow-x-auto scrollbar-none">
              <table className="w-full text-left border-collapse">
                <thead>
                  <tr className="border-b border-white/5 text-[9px] font-black text-white/30 uppercase tracking-[0.3em] italic">
                    <th className="pb-6 px-4">Entity Identifier</th>
                    <th className="pb-6 px-4 text-center">Neural State</th>
                    <th className="pb-6 px-4 text-center">Fragment Value</th>
                    <th className="pb-6 px-4 text-center">Predictive</th>
                    <th className="pb-6 px-4 text-right">Integrity</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-white/5">
                  {analysis?.map((item) => (
                    <tr key={item.sku} className="group/row hover:bg-white/[0.01] transition-colors">
                      <td className="py-6 px-4">
                        <p className="text-sm font-black text-white uppercase tracking-tighter group-hover/row:text-[#ccff00] transition-colors italic">{item.name}</p>
                        <p className="text-[10px] text-white/10 font-mono mt-1 underline decoration-white/5">{item.sku}</p>
                      </td>
                      <td className="py-6 px-4 text-center font-mono text-[11px] text-white/20">{item.systemStock}</td>
                      <td className="py-6 px-4 text-center font-mono text-[11px] text-[#ccff00] font-black shadow-volt-text">{item.excelStock}</td>
                      <td className="py-6 px-4 text-center">
                        <span className={`text-[10px] font-black uppercase tracking-widest italic ${item.predictedDays < 7 ? "text-red-500" : "text-white/40"}`}>
                          {item.predictedDays} DAYS
                        </span>
                      </td>
                      <td className="py-6 px-4 text-right">
                        {item.systemStock !== item.excelStock ? (
                          <div className="inline-flex items-center gap-2 px-3 py-1 bg-red-500/10 border border-red-500/20 rounded-lg">
                             <span className="w-1.5 h-1.5 rounded-full bg-red-500 animate-pulse" />
                             <span className="text-[9px] font-black text-red-500 uppercase tracking-widest italic">Entropy</span>
                          </div>
                        ) : (
                          <div className="inline-flex items-center gap-2 px-3 py-1 bg-[#ccff00]/10 border border-[#ccff00]/20 rounded-lg">
                             <span className="w-1.5 h-1.5 rounded-full bg-[#ccff00] shadow-volt" />
                             <span className="text-[9px] font-black text-[#ccff00] uppercase tracking-widest italic">Synced</span>
                          </div>
                        )}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            <div className="mt-12 flex justify-end gap-4 border-t border-white/5 pt-8">
              <button 
                className="h-12 bg-white/5 border border-white/5 px-8 rounded-2xl text-[9px] font-black uppercase tracking-[0.2em] text-white/40 hover:text-white hover:bg-white/10 transition-all italic"
                onClick={() => setAnalysis(null)}
              >
                Discard Audit
              </button>
              <button className="h-12 bg-[#ccff00] text-black px-10 rounded-2xl text-[9px] font-black uppercase tracking-[0.2em] hover:shadow-volt hover:scale-105 active:scale-95 transition-all italic">
                Commit Neural Sync
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
