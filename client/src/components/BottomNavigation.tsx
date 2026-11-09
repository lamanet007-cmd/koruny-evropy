import {
  Map,
  Crown,
  Handshake,
  Coins,
  ScrollText
} from "lucide-react";

export type GameTab =
  | "map"
  | "realm"
  | "diplomacy"
  | "economy"
  | "chronicle";

type Props = {
  active: GameTab;
  onChange: (tab: GameTab) => void;
};

const items: {
  id: GameTab;
  label: string;
  icon: typeof Map;
}[] = [
  { id: "map", label: "Mapa", icon: Map },
  { id: "realm", label: "Říše", icon: Crown },
  { id: "diplomacy", label: "Diplomacie", icon: Handshake },
  { id: "economy", label: "Ekonomika", icon: Coins },
  { id: "chronicle", label: "Kronika", icon: ScrollText }
];

export default function BottomNavigation({
  active,
  onChange
}: Props) {
  return (
    <nav className="bottom-navigation" aria-label="Herní navigace">
      {items.map(item => {
        const Icon = item.icon;

        return (
          <button
            key={item.id}
            className={active === item.id ? "active" : ""}
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
