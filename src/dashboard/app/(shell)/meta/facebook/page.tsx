"use client";

import { useState } from "react";
import { useToast } from "@/components/ToastProvider";
import { mockFacebookPosts, mockFacebookAds, mockFacebookStats } from "@/lib/mockData";
import type { FacebookPost, FacebookAd } from "@/lib/mockData";

const POST_TYPE_CFG: Record<FacebookPost["type"], { label: string; icon: string; color: string }> = {
  status: { label: "Texto",  icon: "text_fields",  color: "text-blue-400"   },
  photo:  { label: "Foto",   icon: "photo_camera", color: "text-[#CCFF00]"  },
  video:  { label: "Video",  icon: "videocam",     color: "text-red-400"    },
  link:   { label: "Enlace", icon: "link",         color: "text-amber-400"  },
};

const AD_OBJ_CFG: Record<FacebookAd["objective"], { label: string; color: string }> = {
  awareness: { label: "Awareness",    color: "text-blue-400"  },
  traffic:   { label: "Tráfico",      color: "text-amber-400" },
  leads:     { label: "Leads",        color: "text-purple-400"},
  sales:     { label: "Ventas",       color: "text-[#CCFF00]" },
};

function fmtDate(iso: string) {
  const d = new Date(iso);
  return `${d.getDate()}/${d.getMonth() + 1}`;
}
function fmtK(n: number) { return n >= 1000 ? `${(n / 1000).toFixed(1)}k` : `${n}`; }

export default function FacebookPage() {
  const { showToast } = useToast();
  const [tab, setTab] = useState<"posts" | "ads">("posts");
  const s = mockFacebookStats;

  const published = mockFacebookPosts.filter(p => p.status === "published");
  const scheduled = mockFacebookPosts.filter(p => p.status === "scheduled");

  return (
    <div className="space-y-10 animate-in">
      {/* Header */}
      <header className="flex flex-col md:flex-row md:items-end justify-between gap-6">
        <div className="space-y-2">
          <div className="flex items-center gap-3">
            <span className="text-[0.75rem] font-bold label-tracking text-blue-400 drop-shadow-[0_0_8px_rgba(96,165,250,0.3)]">
              Meta / Facebook
            </span>
            <span className="px-2 py-1 rounded-full bg-blue-400/10 border border-blue-400/20 text-[9px] font-black label-tracking text-blue-400">
              AGENTE FB
            </span>
          </div>
          <h1 className="text-4xl md:text-5xl font-black tight-tracking text-on-surface">
            Facebook
          </h1>
          <p className="text-sm text-on-surface-variant">
            {fmtK(s.page_followers)} seguidores · Engagement{" "}
            <span className="text-blue-400 font-bold">{s.avg_engagement_rate}%</span> ·{" "}
            {fmtK(s.impressions_month)} impresiones este mes
          </p>
        </div>
        <div className="flex gap-3 self-start md:self-auto">
          <button
            onClick={() => showToast({ type: "success", title: "Nueva publicación", message: "Agente FB abriendo editor de contenido" })}
            className="px-6 py-3 rounded-2xl bg-blue-500 text-white text-[10px] font-black label-tracking hover:bg-blue-400 transition-all flex items-center gap-2"
          >
            <span className="material-symbols-outlined !text-[16px]">add_circle</span>
            NUEVA PUBLICACIÓN
          </button>
        </div>
      </header>

      {/* Account KPIs */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        {[
          { label: "Seguidores Página",  value: fmtK(s.page_followers),         icon: "group",       color: "text-blue-400"  },
          { label: "Engagement Prom.",   value: `${s.avg_engagement_rate}%`,     icon: "thumb_up",    color: "text-[#CCFF00]" },
          { label: "Impresiones (mes)",  value: fmtK(s.impressions_month),       icon: "visibility",  color: "text-amber-400" },
          { label: "Mensajes Recibidos", value: s.messages_received,             icon: "chat",        color: "text-purple-400"},
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
          { label: "Publicados",  count: published.length, color: "text-[#CCFF00]", bg: "bg-[#CCFF00]/5 border-[#CCFF00]/10" },
          { label: "Programados", count: scheduled.length, color: "text-amber-400", bg: "bg-amber-400/5 border-amber-400/10" },
          { label: "Posts (mes)", count: s.posts_month,    color: "text-blue-400",  bg: "bg-blue-400/5 border-blue-400/10"   },
        ].map(st => (
          <div key={st.label} className={`glass-card rounded-2xl border p-4 text-center ${st.bg}`}>
            <p className={`text-2xl font-black ${st.color}`}>{st.count}</p>
            <p className="text-[9px] font-black label-tracking text-on-surface/40 uppercase mt-0.5">{st.label}</p>
          </div>
        ))}
      </div>

      {/* Tab */}
      <div className="flex gap-2">
        {(["posts", "ads"] as const).map(t => (
          <button key={t} onClick={() => setTab(t)}
            className={`px-5 py-2.5 rounded-xl text-[10px] font-black label-tracking transition-all ${
              tab === t
                ? "bg-blue-500 text-white"
                : "glass-card border border-white/5 text-on-surface-variant hover:border-blue-400/20"
            }`}
          >
            {t === "posts" ? `PUBLICACIONES (${mockFacebookPosts.length})` : `ADS (${mockFacebookAds.length})`}
          </button>
        ))}
      </div>

      {/* POSTS */}
      {tab === "posts" && (
        <div className="space-y-3">
          {mockFacebookPosts.map(post => {
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
                      <div className="flex items-center gap-2 flex-wrap">
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
                            { icon: "thumb_up", value: post.insights.reactions, color: "text-blue-400"  },
                            { icon: "chat",     value: post.insights.comments,  color: "text-[#CCFF00]" },
                            { icon: "share",    value: post.insights.shares,    color: "text-amber-400" },
                          ].map(m => (
                            <div key={m.icon} className="flex items-center gap-1">
                              <span className={`material-symbols-outlined !text-[11px] ${m.color}`}>{m.icon}</span>
                              <span className="text-[9px] font-black text-on-surface/60">{fmtK(m.value)}</span>
                            </div>
                          ))}
                          <span className="text-[9px] font-black text-blue-400">{post.insights.engagement_rate}%</span>
                        </div>
                      )}
                    </div>

                    <p className="text-[10px] text-on-surface/60 leading-relaxed line-clamp-2 whitespace-pre-line">
                      {post.message.split("\n")[0]}
                    </p>

                    {isLive && (
                      <div className="flex items-center gap-4 mt-2">
                        <span className="text-[9px] text-on-surface/40">{fmtK(post.insights.impressions)} imp · {fmtK(post.insights.reach)} alcance · {fmtK(post.insights.clicks)} clics</span>
                      </div>
                    )}
                  </div>

                  {/* Actions */}
                  <div className="flex flex-col gap-2 opacity-0 group-hover:opacity-100 transition-opacity flex-shrink-0">
                    {!isLive && (
                      <button
                        onClick={() => showToast({ type: "success", title: "Publicando", message: "Agente FB publicando en Facebook" })}
                        className="px-3 py-1.5 rounded-xl bg-blue-500 text-white text-[9px] font-black hover:bg-blue-400 transition-colors"
                      >
                        PUBLICAR
                      </button>
                    )}
                    <button
                      onClick={() => showToast({ type: "info", title: "Promoción activada", message: `Boosteando post — $300 MXN / día` })}
                      className="px-3 py-1.5 rounded-xl bg-white/5 border border-white/10 text-on-surface/60 text-[9px] font-black hover:bg-white/10 transition-colors"
                    >
                      PROMOVER
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
          {mockFacebookAds.map(ad => {
            const oCfg = AD_OBJ_CFG[ad.objective];
            const budgetTotal = ad.budget_daily * 30;
            const budgetPct = Math.min(Math.round((ad.spent / budgetTotal) * 100), 100);
            return (
              <div key={ad.id} className="glass-card rounded-[2rem] border border-white/5 p-6">
                <div className="flex items-start justify-between gap-4 mb-3">
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
                    <p className="text-[9px] text-on-surface/40">{ad.campaign_name}</p>
                    <p className="text-[9px] text-on-surface/30">${ad.budget_daily}/día · desde {ad.start_date}</p>
                  </div>
                  <div className="text-right flex-shrink-0">
                    <p className="text-sm font-black text-on-surface">${ad.spent.toLocaleString()}</p>
                    <p className="text-[9px] text-on-surface/30">gastado</p>
                  </div>
                </div>

                {/* Budget bar */}
                <div className="mb-4">
                  <div className="h-1.5 bg-white/5 rounded-full overflow-hidden">
                    <div className="h-full rounded-full bg-blue-500" style={{ width: `${budgetPct}%` }} />
                  </div>
                </div>

                {/* Metrics grid */}
                <div className="grid grid-cols-3 lg:grid-cols-6 gap-3">
                  {[
                    { label: "Impresiones",  value: fmtK(ad.impressions) },
                    { label: "Clics",        value: fmtK(ad.clicks)      },
                    { label: "CTR",          value: `${ad.ctr}%`          },
                    { label: "CPC",          value: `$${ad.cpc}`          },
                    { label: "Conv.",        value: ad.conversions > 0 ? ad.conversions : "—" },
                    { label: "Costo/Conv.",  value: ad.cost_per_conversion > 0 ? `$${ad.cost_per_conversion.toFixed(0)}` : "—" },
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

          {/* Create ad CTA */}
          <button
            onClick={() => showToast({ type: "info", title: "Nueva campaña", message: "Agente FB abriendo configurador de ads" })}
            className="w-full glass-card rounded-[2rem] border border-dashed border-white/10 p-6 flex items-center justify-center gap-3 hover:border-blue-400/30 hover:bg-white/[0.02] transition-all text-on-surface/30 hover:text-on-surface/60"
          >
            <span className="material-symbols-outlined !text-[20px]">add_circle</span>
            <span className="text-[10px] font-black label-tracking">NUEVA CAMPAÑA FACEBOOK ADS</span>
          </button>
        </div>
      )}

      <div className="h-10" />
    </div>
  );
}
