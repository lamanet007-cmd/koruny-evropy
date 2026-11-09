import { MapPin, Users, Wheat, Coins, Landmark } from "lucide-react";
import type { Province } from "../data/scenarios";

type Props = {
  province?: Province;
  countryName: string;
};

export default function ProvincePanel({
  province,
  countryName
}: Props) {
  if (!province) {
    return (
      <aside className="province-panel">
        <span className="eyebrow">PROVINCIE</span>
        <h2>Vyber území na mapě</h2>
        <p className="muted">
          Klepnutím na provincii zobrazíš její obyvatele,
          rozvoj a hospodářské údaje.
        </p>
      </aside>
    );
  }

  return (
    <aside className="province-panel">
      <span className="eyebrow">PŘEHLED PROVINCIE</span>
      <h2><MapPin size={19} /> {province.name}</h2>

      <div className="province-owner">
        <Landmark size={17} />
        <span>Držitel: <strong>{countryName}</strong></span>
      </div>

      <div className="province-stats">
        <div>
          <Users />
          <span>Obyvatelstvo</span>
          <strong>{province.population.toLocaleString("cs-CZ")}</strong>
        </div>

        <div>
          <Wheat />
          <span>Rozvoj</span>
          <strong>{province.development}/10</strong>
        </div>

        <div>
          <Coins />
          <span>Daňový výnos</span>
          <strong>{province.tax} / rok</strong>
        </div>
      </div>

      <div className="province-note">
        <strong>Správa území</strong>
        <p>
          Provincie přispívá do státní pokladny a její rozvoj
          ovlivňuje dlouhodobou sílu říše.
        </p>
      </div>
    </aside>
  );
}
