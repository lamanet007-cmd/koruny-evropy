import {
  Crown,
  Coins,
  Users,
  Shield,
  CalendarDays
} from "lucide-react";

type Props = {
  year: number;
  countryName: string;
  treasury: number;
  income: number;
  army: number;
  onNextTurn: () => void;
};

export default function GameHeader({
  year,
  countryName,
  treasury,
  income,
  army,
  onNextTurn
}: Props) {
  return (
    <header className="game-header">
      <div className="brand">
        <Crown size={25} />
        <div>
          <strong>KORUNY EVROPY</strong>
          <small>VĚK ŘÍŠÍ</small>
        </div>
      </div>

      <div className="country-heading">
        <span className="eyebrow">VLÁDCE</span>
        <strong>{countryName}</strong>
      </div>

      <div className="resource-bar">
        <div className="resource">
          <Coins size={17} />
          <span>{treasury.toLocaleString("cs-CZ")}</span>
        </div>
        <div className="resource">
          <span>+</span>
          <span>{income}</span>
        </div>
        <div className="resource">
          <Shield size={17} />
          <span>{army.toLocaleString("cs-CZ")}</span>
        </div>
      </div>

      <button className="turn-button" onClick={onNextTurn}>
        <CalendarDays size={17} />
        <span>Další rok</span>
        <b>{year + 1}</b>
      </button>
    </header>
  );
}
