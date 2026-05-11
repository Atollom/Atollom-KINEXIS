"use client";

import { useState } from "react";
import { useToast } from "@/components/ToastProvider";
import { mockInstagramPosts, mockInstagramAds, mockInstagramStats } from "@/lib/mockData";
import type { InstagramPost, InstagramAd } from "@/lib/mockData";

const POST_TYPE_CFG: Record<InstagramPost["type"], { label: string; icon: string; color: string }> = {
  photo:    { label: "Foto",      icon: "photo_camera",  color: "text-pink-400"   },
  reel:     { label: "Reel",      icon: "videocam",      color: "text-purple-400" },
  carousel: { label: "Carrusel",  icon: "view_carousel", color: "text-blue-400"   },
  story:    { label: "Story",     icon: "auto_stories",  color: "text-amber-400"  },
};

const AD_OBJ_CFG: Record<InstagramAd["objective"], { label: string; color: string }> = {
  awareness:   { label: "Awareness",   color: "text-blue-400"   },
  traffic:     { label: "Tráfico",     color: "text-amber-400"  },
  engagement:  { label: "Engagement",  color: "text-purple-400" },
  conversions: { label: "Conversiones", color: "text-[#CCFF00]" },
};

function fmtDate(iso: string) {
  const d = new Date(iso);
  return `${d.getDate()}/${d.getMonth() + 1}`;
}
function fmtK(n: number) { return n >= 1000 ? `${(n / 1000).toFixed(1)}k` : `${n}`; }

export default function InstagramPage() {
  const { showToast } = useToast();
  const [tab, setTab] = useState<"posts" | "ads">("posts");
  const s = mockInstagramStats;

  const published = mockInstagramPosts.filter(p => p.status === "published");
  const scheduled = mockInstagramPosts.filter(p => p.status === "scheduled");
  const drafts    = mockInstagramPosts.filter(p => p.status === "draft");

  return (
    <div className="space-y-10 animate-in">
      {/* Header */}
      <header className="flex flex-col md:flex-row md:items-end justify-between gap-6">
        <div className="space-y-2">
          <div className="flex items-center gap-3">
            <span className="text-[0.75rem] font-bold label-tracking text-pink-400 drop-shadow-[0_0_8px_rgba(244,114,182,0.3)]">
              Meta / Instagram
            </span>
            <span className="px-2 py-1 rounded-full bg-pink-400/10 border border-pink-400/20 text-[9px] font-black label-tracking text-pink-400">
              AGENTE IG
            </span>
          </div>
          <h1 className="text-4xl md:text-5xl font-black tight-tracking text-on-surface">
            Instagram
          </h1>
          <p className="text-sm text-on-surface-variant">
            {fmtK(s.followers)} seguidores · Engagement{" "}
            <span className="text-pink-400 font-bold">{s.avg_engagement_rate}%</span> ·{" "}
            {fmtK(s.impressions_month)} impresiones este mes
          </p>
        </div>
        <div className="flex gap-3 self-start md:self-auto">
          <button
            onClick={() => showToast({ type: "success", title: "Nueva publicación", message: "Agente IG abriendo editor de contenido" })}
            className="px-6 py-3 rounded-2xl bg-gradient-to-r from-purple-500 to-pink-500 text-white text-[10px] font-black label-tracking hover:opacity-90 transition-all flex items-center gap-2"
          >
            <span className="material-symbols-outlined !text-[16px]">add_circle</span>
            NUEVA PUBLICACIÓN
          </button>
        </div>
      </header>

      {/* Account KPIs */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        {[
          { label: "Seguidores",        value: fmtK(s.followers),              icon: "group",          color: "text-pink-400"   },
          { label: "Engagement Prom.",  value: `${s.avg_engagement_rate}%`,    icon: "favorite",       color: "text-red-400"    },
          { label: "Impresiones (mes)", value: fmtK(s.impressions_month),      icon: "visibility",     color: "text-blue-400"   },
          { label: "Clicks Sitio",      value: fmtK(s.website_clicks),         icon: "open_in_new",    color: "text-[#CCFF00]"  },
        ].map(kpi => (
          <div key={kpi.label} className="glass-card rounded-[1.5rem] border border-white/5 p-6">
            <div className="flex items-center gap-3 mb-3">
              <span className={`material-symbols-outlined !text-[18px] ${kpi.color}`}>{kpi.icon}</span>
              <span className="text-[9px] font-black label-tracking text-on-surface/40 uppercase">{kpi.label}</span>
            </div>
            <p className="text-2xl font-black tight-tracking text-on-surface">{kpi.value}</p>
          </div>
        ))}
      </div>

      {/* Status summary */}
      <div className="grid grid-cols-3 gap-3">
        {[
          { label: "Publicados", count: published.length, color: "text-[#CCFF00]", bg: "bg-[#CCFF00]/5 border-[#CCFF00]/10" },
          { label: "Programados", count: scheduled.length, color: "text-amber-400", bg: "bg-amber-400/5 border-amber-400/10" },
          { label: "Borradores",  count: drafts.length,    color: "text-on-surface/40", bg: "bg-white/5 border-white/5" },
        ].map(s => (
          <div key={s.label} className={`glass-card rounded-2xl border p-4 text-center ${s.bg}`}>
            <p className={`text-2xl font-black ${s.color}`}>{s.count}</p>
            <p className="text-[9px] font-black label-tracking text-on-surface/40 uppercase mt-0.5">{s.label}</p>
          </div>
        ))}
      </div>

      {/* Tab */}
      <div className="flex gap-2">
        {(["posts", "ads"] as const).map(t => (
          <button key={t} onClick={() => setTab(t)}
            className={`px-5 py-2.5 rounded-xl text-[10px] font-black label-tracking transition-all ${
              tab === t
                ? "bg-gradient-to-r from-purple-500 to-pink-500 text-white"
                : "glass-card border border-white/5 text-on-surface-variant hover:border-pink-400/20"
            }`}
          >
            {t === "posts" ? `PUBLICACIONES (${mockInstagramPosts.length})` : `ADS (${mockInstagramAds.length})`}
          </button>
        ))}
      </div>

      {/* POSTS */}
      {tab === "posts" && (
        <div className="space-y-3">
          {mockInstagramPosts.map(post => {
            const tCfg = POST_TYPE_CFG[post.type];
            const isLive = post.status === "published";
            return (
              <div key={post.id} className="glass-card rounded-[2rem] border border-white/5 p-6 hover:bg-white/[0.02] transition-colors group">
                <div className="flex items-start gap-4">
                  {/* Type icon */}
                  <div className="flex-shrink-0 w-10 h-10 glass-card rounded-xl border border-white/5 flex items-center justify-center">
                    <span className={`material-symbols-outlined !text-[18px] ${tCfg.color}`}>{tCfg.icon}</span>
                  </div>

                  <div className="flex-1 min-w-0">
                    <div className="flex items-start justify-between gap-4 mb-2">
                      <div className="flex items-center gap-2">
                        <span className={`px-2 py-0.5 rounded-full text-[8px] font-black ${tCfg.color} bg-white/5`}>
                          {tCfg.label.toUpperCase()}
                        </span>
                        <span className={`px-2 py-0.5 rounded-full text-[8px] font-black ${
                          post.status === "published" ? "text-[#CCFF00] bg-[#CCFF00]/10" :
                          post.status === "scheduled" ? "text-amber-400 bg-amber-400/10" :
                          "text-on-surface/40 bg-white/5"
                        }`}>
                          {post.status === "published" ? "PUBLICADO" : post.status === "scheduled" ? "PROGRAMADO" : "BORRADOR"}
                        </span>
                        <span className="text-[9px] text-on-surface/30">
                          {post.published_at ? fmtDate(post.published_at) : post.scheduled_at ? `→ ${fmtDate(post.scheduled_at)}` : "—"}
                        </span>
                      </div>
                      {isLive && (
                        <div className="flex items-center gap-3 flex-shrink-0">
                          {[
                            { icon: "favorite",    value: post.insights.likes,    color: "text-red-400"  },
                            { icon: "chat",        value: post.insights.comments, color: "text-blue-400" },
                            { icon: "share",       value: post.insights.shares,   color: "text-amber-400"},
                            { icon: "bookmark",    value: post.insights.saves,    color: "text-purple-400"},
                          ].map(m => (
                            <div key={m.icon} className="flex items-center gap-1">
                              <span className={`material-symbols-outlined !text-[11px] ${m.color}`}>{m.icon}</span>
                              <span className="text-[9px] font-black text-on-surface/60">{fmtK(m.value)}</span>
                            </div>
                          ))}
                          <span className="text-[9px] font-black text-pink-400">{post.insights.engagement_rate}%</span>
                        </div>
                      )}
                    </div>

                    <p className="text-[10px] text-on-surface/60 leading-relaxed line-clamp-2">{post.caption}</p>

                    {isLive && (
                      <div className="flex items-center gap-4 mt-2">
                        <div className="flex items-center gap-1">
                          <span className="material-symbols-outlined !text-[10px] text-on-surface/30">visibility</span>
                          <span className="text-[9px] text-on-surface/40">{fmtK(post.insights.impressions)} imp · {fmtK(post.insights.reach)} alcance</span>
                        </div>
                      </div>
                    )}
                  </div>

                  {/* Actions */}
                  <div className="flex flex-col gap-2 opacity-0 group-hover:opacity-100 transition-opacity flex-shrink-0">
                    {!isLive && (
                      <button
                        onClick={() => showToast({ type: "success", title: "Publicando", message: "Agente IG publicando en Instagram" })}
                        className="px-3 py-1.5 rounded-xl bg-gradient-to-r from-purple-500 to-pink-500 text-white text-[9px] font-black"
                      >
                        PUBLICAR
                      </button>
                    )}
                    <button
                      onClick={() => showToast({ type: "info", title: "Boost activado", message: `Promoviendo publicación — presupuesto $500 MXN` })}
                      className="px-3 py-1.5 rounded-xl bg-white/5 border border-white/10 text-on-surface/60 text-[9px] font-black hover:bg-white/10 transition-colors"
                    >
                      BOOST
                    </button>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* ADS */}
      {tab === "ads" && (
        <div className="space-y-4">
          {mockInstagramAds.map(ad => {
            const oCfg = AD_OBJ_CFG[ad.objective];
            const budgetPct = Math.round((ad.spent / ad.budget) * 100);
            return (
              <div key={ad.id} className="glass-card rounded-[2rem] border border-white/5 p-6">
                <div className="flex items-start justify-between gap-4 mb-4">
                  <div>
                    <div className="flex items-center gap-2 mb-0.5">
                      <h3 className="text-sm font-black text-on-surface">{ad.name}</h3>
                      <span className={`px-2 py-0.5 rounded-full text-[8px] font-black ${oCfg.color} bg-white/5`}>
                        {oCfg.label.toUpperCase()}
                      </span>
                      <span className={`px-2 py-0.5 rounded-full text-[8px] font-black ${
                        ad.status === "active" ? "text-[#CCFF00] bg-[#CCFF00]/10" :
                        ad.status === "paused" ? "text-amber-400 bg-amber-400/10" :
                        "text-on-surface/40 bg-white/5"
                      }`}>
                        {ad.status === "active" ? "ACTIVO" : ad.status === "paused" ? "PAUSADO" : "COMPLETADO"}
                      </span>
                    </div>
                    <p className="text-[9px] text-on-surface/40">{ad.start_date} → {ad.end_date}</p>
                  </div>
                  <div className="text-right flex-shrink-0">
                    <p className="text-sm font-black text-on-surface">${ad.spent.toLocaleString()}</p>
                    <p className="text-[9px] text-on-surface/30">de ${ad.budget.toLocaleString()}</p>
                  </div>
                </div>

                {/* Budget bar */}
                <div className="mb-4">
                  <div className="flex items-center justify-between mb-1">
                    <span className="text-[8px] font-black text-on-surface/30 label-tracking uppercase">Presupuesto consumido</span>
                    <span className="text-[9px] font-black text-pink-400">{budgetPct}%</span>
                  </div>
                  <div className="h-1.5 bg-white/5 rounded-full overflow-hidden">
                    <div className="h-full rounded-full bg-gradient-to-r from-purple-500 to-pink-500" style={{ width: `${budgetPct}%` }} />
                  </div>
                </div>

                {/* Metrics */}
                <div className="grid grid-cols-2 lg:grid-cols-5 gap-3">
                  {[
                    { label: "Impresiones", value: fmtK(ad.impressions) },
                    { label: "Clics",       value: fmtK(ad.clicks)      },
                    { label: "CTR",         value: `${ad.ctr}%`          },
                    { label: "CPC",         value: `$${ad.cpc}`          },
                    { label: "Conversiones", value: ad.conversions > 0 ? ad.conversions : "—" },
                  ].map(m => (
                    <div key={m.label}>
                      <p className="text-[8px] font-black text-on-surface/30 label-tracking uppercase">{m.label}</p>
                      <p className="text-sm font-black text-on-surface mt-0.5">{m.value}</p>
                    </div>
                  ))}
                </div>
              </div>
            );
          })}
        </div>
      )}

      <div className="h-10" />
    </div>
  );
}
