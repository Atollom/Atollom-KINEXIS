"use client";

import { useMemo } from "react";
import Link from "next/link";

interface ChannelSummary {
  id: string;
  name: string;
  icon: string;
  revenue: number;
  orders: number;
  growth: string;
  status: "optimal" | "warning" | "error";
  color: string;
  href: string;
}

const CHANNELS: ChannelSummary[] = [
  {
    id: "ml",
    name: "Mercado Libre",
    icon: "shopping_bag",
    revenue: 452800,
    orders: 124,
    growth: "+12.5%",
    status: "optimal",
    color: "#FFE600",
    href: "/ecommerce/ml",
  },
  {
    id: "amazon",
    name: "Amazon México",
    icon: "inventory_2",
    revenue: 389200,
    orders: 98,
    growth: "+8.2%",
    status: "optimal",
    color: "#FF9900",
    href: "/ecommerce/amazon",
  },
  {
    id: "shopify",
    name: "Shopify Store",
    icon: "shopping_cart",
    revenue: 156400,
    orders: 45,
    growth: "-2.4%",
    status: "warning",
    color: "#95BF47",
    href: "/ecommerce/shopify",
  },
];

export default function EcommerceSummaryPage() {
  const totalRevenue = useMemo(() => CHANNELS.reduce((sum, c) => sum + c.revenue, 0), []);
  const totalOrders = useMemo(() => CHANNELS.reduce((sum, c) => sum + c.orders, 0), []);

  return (
    <div className="space-y-10 animate-in">
      {/* Header */}
      <header className="flex flex-col md:flex-row md:items-end justify-between gap-6">
        <div className="space-y-2">
          <span className="text-[0.75rem] font-bold label-tracking text-primary drop-shadow-glow">
            Command Center / Global Commerce
          </span>
          <h1 className="text-4xl md:text-5xl font-black tight-tracking text-on-surface">
            Omnichannel Summary
          </h1>
        </div>

        <div className="flex items-center gap-4">
          <div className="glass-card px-8 py-5 rounded-3xl flex items-center gap-6">
            <div className="text-center">
              <p className="text-[10px] font-black text-on-surface-variant label-tracking uppercase">Total GMV</p>
              <p className="text-2xl font-black text-on-surface tight-tracking mt-1">
                ${totalRevenue.toLocaleString()}
              </p>
            </div>
            <div className="w-px h-8 bg-white/10" />
            <div className="text-center">
              <p className="text-[10px] font-black text-on-surface-variant label-tracking uppercase">Total Orders</p>
              <p className="text-2xl font-black text-primary tight-tracking mt-1">{totalOrders}</p>
            </div>
          </div>
        </div>
      </header>

      {/* Bento Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {CHANNELS.map((channel) => (
          <Link 
            key={channel.id} 
            href={channel.href}
            className="group relative"
          >
            <div className="glass-card p-8 rounded-[2.5rem] h-full border border-white/5 group-hover:border-primary/30 group-hover:bg-white/[0.08] transition-all duration-500 overflow-hidden">
               <div className="flex justify-between items-start mb-10">
                  <div className="w-14 h-14 rounded-2xl flex items-center justify-center bg-white/5 border border-white/10 group-hover:scale-110 group-hover:bg-white/10 transition-all duration-500">
                    <span className="material-symbols-outlined !text-3xl" style={{ color: channel.color }}>
                      {channel.icon}
                    </span>
                  </div>
                  <div className="text-right">
                    <span className="text-[11px] font-black label-tracking text-primary bg-primary/10 px-3 py-1 rounded-full">
                      {channel.growth}
                    </span>
                  </div>
               </div>

               <div className="space-y-1">
                  <p className="text-sm font-bold text-on-surface-variant label-tracking uppercase">{channel.name}</p>
                  <p className="text-3xl font-black text-on-surface tight-tracking">
                    ${channel.revenue.toLocaleString()}
                  </p>
               </div>

               <div className="mt-8 pt-8 border-t border-white/5 flex items-center justify-between">
                  <div>
                    <p className="text-[10px] font-black text-on-surface/30 label-tracking uppercase">Operations</p>
                    <p className="text-sm font-black text-on-surface italic">{channel.orders} Orders</p>
                  </div>
                  <div className="flex items-center gap-2">
                    <span className="text-[10px] font-black text-on-surface-variant">VIEW DEPTH</span>
                    <span className="material-symbols-outlined !text-[14px] text-primary group-hover:translate-x-1 transition-transform">arrow_forward_ios</span>
                  </div>
               </div>

               {/* Ambient Glow */}
               <div 
                 className="absolute -right-10 -bottom-10 w-32 h-32 blur-[80px] opacity-20 group-hover:opacity-40 transition-opacity duration-700"
                 style={{ backgroundColor: channel.color }}
               />
            </div>
          </Link>
        ))}

        {/* Fulfillment Preview Card */}
        <Link href="/ecommerce/fulfillment" className="md:col-span-2 lg:col-span-3 group">
          <div className="glass-card p-8 rounded-[2.5rem] border border-white/5 group-hover:border-primary/20 transition-all overflow-hidden relative">
            <div className="relative z-10 flex flex-col md:flex-row md:items-center justify-between gap-8">
              <div className="space-y-4">
                 <div className="flex items-center gap-3">
                   <span className="w-2 h-2 rounded-full bg-primary animate-pulse shadow-[0_0_8px_rgba(204,255,0,0.8)]" />
                   <p className="text-[11px] font-black label-tracking text-primary uppercase">Logistics Neural Network</p>
                 </div>
                 <h3 className="text-3xl font-black text-on-surface tight-tracking max-w-md">
                   Hay <span className="text-primary italic">84 pedidos</span> pendientes de despacho global.
                 </h3>
                 <p className="text-sm font-medium text-on-surface-variant max-w-sm opacity-60">
                   Segmentación activa: 42 Mercado Libre, 18 Amazon, 24 Shopify/B2B.
                 </p>
              </div>

              <div className="flex items-center gap-6">
                 <div className="text-right hidden md:block">
                    <p className="text-[10px] font-black text-on-surface/30 label-tracking uppercase">Lead Time</p>
                    <p className="text-xl font-black text-on-surface italic">2.4 hrs</p>
                 </div>
                 <div className="px-8 py-4 neon-disruptor rounded-2xl text-[11px] font-black label-tracking group-hover:scale-105 transition-transform shadow-glow">
                   GO TO FULFILLMENT CENTER
                 </div>
              </div>
            </div>
            {/* Grid Pattern Background */}
            <div className="absolute inset-0 opacity-[0.03] pointer-events-none bg-[radial-gradient(#ccff00_1px,transparent_1px)] [background-size:20px_20px]" />
          </div>
        </Link>
      </div>

      <div className="h-20" />
    </div>
  );
}