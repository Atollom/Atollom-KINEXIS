"use client";

import { useState } from "react";

interface ShippingDimensionsProps {
  onCalculated: (total: number) => void;
}

export function ShippingDimensionsCard({ onCalculated }: ShippingDimensionsProps) {
  const [weight, setWeight] = useState("");
  const [length, setLength] = useState("");
  const [width, setWidth] = useState("");
  const [height, setHeight] = useState("");
  const [calculating, setCalculating] = useState(false);
  const [result, setResult] = useState<{ base: number; total: number } | null>(null);

  const calculateFee = () => {
    if (!weight || !length || !width || !height) return;
    
    setCalculating(true);
    // Simulate Skydrop API call
    setTimeout(() => {
      const baseFee = 120 + (Math.random() * 50); // Mocked Skydrop fee
      const markup = 1.035; // 3.5% Luxury Service Fee (Bundled)
      const finalFee = baseFee * markup;
      
      setResult({ base: baseFee, total: finalFee });
      setCalculating(false);
      onCalculated(finalFee);
    }, 1200);
  };

  return (
    <div className="bg-white/[0.03] border border-white/[0.06] rounded-2xl p-6">
      <h3 className="text-sm font-headline font-bold text-white mb-4 flex items-center gap-2">
        <span className="material-symbols-outlined text-[#A8E63D] text-base">square_foot</span>
        Dimensiones y Peso (Mandatorio)
      </h3>
      
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
        <DimensionInput label="Peso (kg)" value={weight} onChange={setWeight} />
        <DimensionInput label="Largo (cm)" value={length} onChange={setLength} />
        <DimensionInput label="Ancho (cm)" value={width} onChange={setWidth} />
        <DimensionInput label="Alto (cm)" value={height} onChange={setHeight} />
      </div>

      {!result ? (
        <button
          onClick={calculateFee}
          disabled={calculating || !weight || !length || !width || !height}
          className="w-full py-3 bg-[#A8E63D] text-[#0D1B3E] font-bold rounded-xl text-[11px] uppercase tracking-widest disabled:opacity-40 hover:shadow-[0_0_20px_#A8E63D40] transition-all"
        >
          {calculating ? "Calculando Tarifa..." : "Calcular Envío Preferencial"}
        </button>
      ) : (
        <div className="bg-[#A8E63D]/5 border border-[#A8E63D]/20 rounded-xl p-4 flex items-center justify-between">
          <div>
            <p className="text-[10px] text-[#A8E63D] uppercase font-bold tracking-wider">Costo de Envío Preferencial Kinexis</p>
            <p className="text-2xl font-bold text-white">${result.total.toFixed(2)}</p>
          </div>
          <button 
             onClick={() => setResult(null)}
             className="text-[10px] text-[#8DA4C4] hover:text-white uppercase font-bold"
          >
            Editar
          </button>
        </div>
      )}
    </div>
  );
}

function DimensionInput({ label, value, onChange }: { label: string; value: string; onChange: (v: string) => void }) {
  return (
    <div>
      <label className="block text-[9px] text-[#8DA4C4] uppercase font-bold tracking-widest mb-1.5 ml-1">{label}</label>
      <input
        type="number"
        value={value}
        onChange={(e) => onChange(e.target.value)}
        placeholder="0"
        className="w-full bg-white/[0.03] border border-white/[0.08] rounded-xl px-4 py-2 text-sm text-white focus:outline-none focus:border-[#A8E63D]/40 transition-colors"
      />
    </div>
  );
}
