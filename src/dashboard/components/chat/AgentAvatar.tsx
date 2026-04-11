interface AgentAvatarProps {
  name: string;
  isOnline?: boolean;
  size?: "sm" | "md";
}

const AGENT_ICONS: Record<string, string> = {
  guardian:    "security",
  fulfillment: "inventory_2",
  amazon:      "shopping_bag",
  ml:          "storefront",
  shopify:     "store",
  cfdi:        "receipt_long",
  crm:         "people",
  ads:         "campaign",
  instagram:   "photo_camera",
  catalog:     "category",
  pricing:     "sell",
  analytics:   "bar_chart",
  default:     "smart_toy",
};

function getIcon(name: string): string {
  const key = name.toLowerCase();
  for (const [k, v] of Object.entries(AGENT_ICONS)) {
    if (key.includes(k)) return v;
  }
  return AGENT_ICONS.default;
}

export function AgentAvatar({ name, isOnline = true, size = "md" }: AgentAvatarProps) {
  const sizeClass = size === "sm" ? "w-8 h-8 text-sm" : "w-10 h-10 text-base";
  const dotClass  = size === "sm" ? "w-2 h-2 border" : "w-2.5 h-2.5 border";

  return (
    <div className="relative flex-shrink-0" aria-hidden="true">
      <div
        className={`
          ${sizeClass}
          rounded-full
          bg-surface-container-high
          border border-outline-variant/30
          flex items-center justify-center
          text-primary-container
        `}
      >
        <span className="material-symbols-outlined" style={{ fontSize: "inherit" }}>
          {getIcon(name)}
        </span>
      </div>

      {/* Online / offline dot */}
      <span
        className={`
          absolute bottom-0 right-0
          ${dotClass}
          rounded-full border-surface
          ${isOnline ? "bg-success" : "bg-outline"}
        `}
      />
    </div>
  );
}
