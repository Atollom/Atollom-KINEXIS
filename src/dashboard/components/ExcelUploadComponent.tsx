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
    { id: "almacen", label: "Almacén", icon: "warehouse" },
    { id: "precios", label: "Precios", icon: "sell" },
    { id: "proveedores", label: "Proveedores", icon: "badge" },
    { id: "clientes", label: "Clientes", icon: "groups" },
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
    // Simulating Samantha's intelligence processing the file
    setTimeout(() => {
      if (category === "almacen") {
        setAnalysis([
          { sku: "SKU-PRO-001", name: "Cargador Magnético MagSafe", systemStock: 45, excelStock: 120, predictedDays: 14 },
          { sku: "SKU-PRO-042", name: "Funda Silicona Midnight", systemStock: 12, excelStock: 5, predictedDays: 3 },
          { sku: "SKU-PRO-089", name: "Protector Pantalla Pro", systemStock: 230, excelStock: 230, predictedDays: 45 },
        ]);
      } else {
        // Mock generic analysis for other categories
        setAnalysis([
          { sku: "NEW-DATA-001", name: "Dato Importado #1", systemStock: 0, excelStock: 100, predictedDays: 0 },
        ]);
      }
      setAnalyzing(false);
    }, 1500);
  };

  return (
    <div className="bg-[#050505] border border-white/[0.04] rounded-[2.5rem] p-1 shadow-2xl overflow-hidden">
      <div className="bg-white/[0.02] rounded-[2.2rem] p-8">
        
        {/* Category Selector */}
        {!analysis && !analyzing && (
          <div className="flex gap-2 mb-8 justify-center">
            {categories.map((cat) => (
              <button
                key={cat.id}
                onClick={() => setCategory(cat.id as any)}
                className={`
                  flex flex-col items-center gap-2 p-4 rounded-2xl border transition-all w-28
                  ${category === cat.id 
                    ? "bg-[primary-container]/10 border-[primary-container] text-[primary-container]" 
                    : "bg-white/[0.02] border-white/[0.06] text-on-surface-variant hover:bg-white/[0.04]"
                  }
                `}
              >
                <span className="material-symbols-outlined">{cat.icon}</span>
                <span className="text-[10px] font-bold uppercase tracking-widest">{cat.label}</span>
              </button>
            ))}
          </div>
        )}

        {!analysis && !analyzing ? (
          <div 
            className={`
              border-2 border-dashed rounded-[1.8rem] p-12 text-center transition-all duration-300
              ${dragActive ? "border-[primary-container] bg-[primary-container]/5 scale-[0.99]" : "border-white/[0.08] hover:border-white/20"}
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
            <div className="w-16 h-16 bg-[primary-container]/10 rounded-2xl flex items-center justify-center mx-auto mb-6">
              <span className="material-symbols-outlined text-[primary-container] text-3xl">upload_file</span>
            </div>
            <h3 className="text-xl font-headline font-bold text-on-surface mb-2">Sincronización Samantha</h3>
            <p className="text-on-surface-variant text-sm max-w-xs mx-auto mb-8">
              Arrastra tu reporte de almacén (Excel/CSV) para una auditoría instantánea con el ecosistema KINEXIS.
            </p>
            <button 
              onClick={simulateAnalysis}
              className="bg-[primary-container] text-black px-8 py-3 rounded-2xl text-xs font-bold uppercase tracking-widest hover:shadow-[0_0_20px_rgba(204,255,0,0.4)] transition-all active:scale-95"
            >
              Seleccionar Archivo
            </button>
          </div>
        ) : analyzing ? (
          <div className="py-20 text-center">
            <div className="relative w-20 h-20 mx-auto mb-8">
              <div className="absolute inset-0 border-4 border-[primary-container]/10 rounded-full" />
              <div className="absolute inset-0 border-4 border-[primary-container] rounded-full border-t-transparent animate-spin" />
            </div>
            <p className="text-[primary-container] font-headline font-bold text-lg animate-pulse tracking-tight">Samantha está analizando discrepancias...</p>
            <p className="text-on-surface-variant text-xs mt-2 uppercase tracking-[0.2em]">Cotejando Agentes #32 y #5</p>
          </div>
        ) : (
          <div className="animate-in">
            <div className="flex items-center justify-between mb-8">
              <div>
                <h3 className="text-xl font-headline font-bold text-on-surface">Análisis de Discrepancias</h3>
                <p className="text-xs text-on-surface-variant uppercase tracking-widest mt-1">Comparativa Sistema vs. Reporte Externo</p>
              </div>
              <button 
                onClick={() => setAnalysis(null)}
                className="text-on-surface-variant hover:text-on-surface transition-colors"
              >
                <span className="material-symbols-outlined">close</span>
              </button>
            </div>

            <div className="overflow-x-auto">
              <table className="w-full text-left">
                <thead>
                  <tr className="border-b border-white/[0.04] text-[10px] text-on-surface-variant uppercase tracking-[0.15em] font-bold">
                    <th className="pb-4 px-2">Producto / SKU</th>
                    <th className="pb-4 px-2 text-center">Sistema</th>
                    <th className="pb-4 px-2 text-center">Excel</th>
                    <th className="pb-4 px-2 text-center">Predictivo</th>
                    <th className="pb-4 px-2 text-right">Estado</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-white/[0.02]">
                  {analysis?.map((item) => (
                    <tr key={item.sku} className="group hover:bg-white/[0.01]">
                      <td className="py-5 px-2">
                        <p className="text-sm font-bold text-on-surface group-hover:text-[primary-container] transition-colors">{item.name}</p>
                        <p className="text-[10px] text-on-surface-variant font-mono">{item.sku}</p>
                      </td>
                      <td className="py-5 px-2 text-center font-mono text-on-surface opacity-40">{item.systemStock}</td>
                      <td className="py-5 px-2 text-center font-mono text-on-surface font-bold">{item.excelStock}</td>
                      <td className="py-5 px-2 text-center">
                        <span className={`text-xs font-bold ${item.predictedDays < 7 ? "text-[#FF3333]" : "text-[primary-container]"}`}>
                          {item.predictedDays} días
                        </span>
                      </td>
                      <td className="py-5 px-2 text-right">
                        {item.systemStock !== item.excelStock ? (
                          <span className="bg-[#FF3333]/10 text-[#FF3333] text-[9px] font-bold px-2 py-1 rounded-lg uppercase tracking-wider">Discrepancia</span>
                        ) : (
                          <span className="bg-[primary-container]/10 text-[primary-container] text-[9px] font-bold px-2 py-1 rounded-lg uppercase tracking-wider">Sincronizado</span>
                        )}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            <div className="mt-8 flex justify-end gap-3">
              <button 
                className="bg-white/[0.03] text-on-surface-variant border border-white/[0.06] px-6 py-2.5 rounded-xl text-[10px] font-bold uppercase tracking-wider hover:bg-white/[0.06] transition-all"
                onClick={() => setAnalysis(null)}
              >
                Descartar
              </button>
              <button className="bg-[primary-container] text-black px-6 py-2.5 rounded-xl text-[10px] font-bold uppercase tracking-wider hover:shadow-[0_0_15px_rgba(204,255,0,0.3)] transition-all">
                Sincronizar Almacén
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
