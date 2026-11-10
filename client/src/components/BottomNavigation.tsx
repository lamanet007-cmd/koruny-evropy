import { Map, Crown, Handshake, ScrollText, Swords } from "lucide-react";

export type GameTab = "map" | "realm" | "army" | "diplomacy" | "chronicle";

type Props = {
  active: GameTab;
  onChange: (tab: GameTab) => void;
};

const items: { id: GameTab; label: string; icon: typeof Map }[] = [
  { id: "map", label: "Mapa", icon: Map },
  { id: "realm", label: "Říše", icon: Crown },
  { id: "army", label: "Armáda", icon: Swords },
  { id: "diplomacy", label: "Diplomacie", icon: Handshake },
  { id: "chronicle", label: "Kronika", icon: ScrollText }
];

export default function BottomNavigation({ active, onChange }: Props) {
  return (
    <nav className="bottom-navigation" aria-label="Herní navigace">
      {items.map(item => {
        const Icon = item.icon;
        return (
          <button
            type="button"
            key={item.id}
            className={active === item.id ? "active" : ""}
            aria-current={active === item.id ? "page" : undefined}
            onClick={() => onChange(item.id)}
          >
            <Icon size={21} />
            <span>{item.label}</span>
          </button>
        );
      })}
    </nav>
  );
}