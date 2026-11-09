import { useEffect, useMemo, useState } from "react";
import {
  Crown,
  Swords,
  Handshake,
  Coins,
  ScrollText,
  Building2
} from "lucide-react";

import GameHeader from "./components/GameHeader";
import EuropeMap from "./components/EuropeMap";
import ProvincePanel from "./components/ProvincePanel";
import BottomNavigation, {
  type GameTab
} from "./components/BottomNavigation";

import {
  scenario1066,
  type Scenario,
  type Province
} from "./data/scenarios";

const STORAGE_KEY = "koruny-evropy-save-v1";

type SaveData = {
  year: number;
  treasury: number;
  relations: Record<string, number>;
  selectedProvince: string;
  tab: GameTab;
  log: string[];
};

function createInitialSave(): SaveData {
  const bohemia = scenario1066.countries.find(
    country => country.id === "bohemia"
  )!;

  return {
    year: scenario1066.year,
    treasury: bohemia.treasury,
    relations: { ...bohemia.relations },
    selectedProvince: "prague",
    tab: "map",
    log: ["Rok 1066: začíná nová kapitola českých dějin."]
  };
}

function readSave(): SaveData {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);

    if (raw) {
      return {
        ...createInitialSave(),
        ...JSON.parse(raw)
      };
    }
  } catch {
    // Při poškozeném uložení se spustí nová hra.
  }

  return createInitialSave();
}

export default function App() {
  const [save, setSave] = useState<SaveData>(readSave);

  const [scenario] = useState<Scenario>(scenario1066);

  const player = scenario.countries.find(
    country => country.id === "bohemia"
  )!;

  const selectedProvince = scenario.provinces.find(
    province => province.id === save.selectedProvince
  );

  const countryColors = useMemo(
    () =>
      Object.fromEntries(
        scenario.countries.map(country => [
          country.id,
          country.color
        ])
      ),
    [scenario.countries]
  );

  const ownerName = (province?: Province) => {
    if (!province) return "Neznámý držitel";

    return (
      scenario.countries.find(
        country => country.id === province.owner
      )?.name ?? "Neznámý držitel"
    );
  };

  useEffect(() => {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(save));
  }, [save]);

  function updateSave(
    updates: Partial<SaveData>,
    message?: string
  ) {
    setSave(current => ({
      ...current,
      ...updates,
      log: message
        ? [message, ...current.log].slice(0, 30)
        : current.log
    }));
  }

  function nextYear() {
    const newYear = save.year + 1;
    const yearlyIncome = player.income;

    updateSave(
      {
        year: newYear,
        treasury: save.treasury + yearlyIncome
      },
      `Rok ${newYear}: státní pokladna obdržela ${yearlyIncome} zlatých.`
    );
  }

  function improveRelations(countryId: string) {
    const currentValue = save.relations[countryId] ?? 0;

    if (save.treasury < 100) {
      updateSave(
        {},
        "Diplomatická mise nebyla vyslána: v pokladně není dostatek zlata."
      );
      return;
    }

    const target = scenario.countries.find(
      country => country.id === countryId
    );

    updateSave(
      {
        treasury: save.treasury - 100,
        relations: {
          ...save.relations,
          [countryId]: Math.min(100, currentValue + 10)
        }
      },
      `Do země ${target?.name ?? countryId} byla vyslána diplomatická mise.`
    );
  }

  function renderContent() {
    switch (save.tab) {
      case "map":
        return (
          <div className="map-layout">
            <EuropeMap
              provinces={scenario.provinces}
              countryColors={countryColors}
              selectedProvince={save.selectedProvince}
              onSelectProvince={id =>
                updateSave({ selectedProvince: id })
              }
            />

            <ProvincePanel
              province={selectedProvince}
              countryName={ownerName(selectedProvince)}
            />
          </div>
        );

      case "realm":
        return (
          <section className="content-panel">
            <span className="eyebrow">PANOVNICKÝ DVŮR</span>
            <h2><Crown /> České knížectví</h2>
            <p>
              Vládce: <strong>{player.ruler}</strong>
            </p>
            <p>
              Rok vlády: <strong>{save.year}</strong>
            </p>
            <div className="stat-card">
              <Building2 />
              <span>Počet provincií</span>
              <strong>
                {scenario.provinces.filter(
                  province => province.owner === player.id
                ).length}
              </strong>
            </div>
            <p className="muted">
              Zde později přibude správa šlechty, následnictví,
              dvorské intriky, zákony a stabilita říše.
            </p>
          </section>
        );

      case "diplomacy":
        return (
          <section className="content-panel">
            <span className="eyebrow">ZAHRANIČNÍ VZTAHY</span>
            <h2><Handshake /> Diplomacie</h2>

            {scenario.countries
              .filter(country => country.id !== player.id)
              .map(country => {
                const relation = save.relations[country.id] ?? 0;

                return (
                  <div className="country-row" key={country.id}>
                    <div
                      className="country-color"
                      style={{ background: country.color }}
                    />
                    <div className="country-info">
                      <strong>{country.name}</strong>
                      <small>{country.ruler}</small>
                      <span>Vztahy: {relation}/100</span>
                    </div>

                    <button
                      className="action-button"
                      onClick={() => improveRelations(country.id)}
                    >
                      Mise · 100
                    </button>
                  </div>
                );
              })}
          </section>
        );

      case "economy":
        return (
          <section className="content-panel">
            <span className="eyebrow">HOSPODÁŘSTVÍ</span>
            <h2><Coins /> Státní pokladna</h2>

            <div className="economy-grid">
              <div className="stat-card">
                <Coins />
                <span>Pokladna</span>
                <strong>{save.treasury.toLocaleString("cs-CZ")}</strong>
              </div>

              <div className="stat-card">
                <span>Roční příjem</span>
                <strong>+{player.income}</strong>
              </div>

              <div className="stat-card">
                <span>Roční výdaje</span>
                <strong>0</strong>
              </div>
            </div>

            <p className="muted">
              Ekonomika je zatím zjednodušená. Další verze přidá
              daně, obchod, údržbu armády, produkci a ceny zboží.
            </p>
          </section>
        );

      case "chronicle":
        return (
          <section className="content-panel">
            <span className="eyebrow">ZÁZNAMY DĚJIN</span>
            <h2><ScrollText /> Kronika říše</h2>

            <div className="chronicle">
              {save.log.map((entry, index) => (
                <div className="chronicle-entry" key={`${entry}-${index}`}>
                  <span className="chronicle-dot" />
                  <p>{entry}</p>
                </div>
              ))}
            </div>
          </section>
        );

      default:
        return null;
    }
  }

  return (
    <main className="game-shell">
      <GameHeader
        year={save.year}
        countryName={player.name}
        treasury={save.treasury}
        income={player.income}
        army={player.army}
        onNextTurn={nextYear}
      />

      <div className="game-subheader">
        <div>
          <span className="eyebrow">HISTORICKÁ KAMPAŇ</span>
          <strong>{scenario.name}</strong>
        </div>
        <span className="mode-label">TESTOVACÍ SCÉNÁŘ</span>
      </div>

      <div className="game-content">
        {renderContent()}
      </div>

      <div className="desktop-navigation">
        <BottomNavigation
          active={save.tab}
          onChange={tab => updateSave({ tab })}
        />
      </div>

      <BottomNavigation
        active={save.tab}
        onChange={tab => updateSave({ tab })}
      />

      <footer className="game-footer">
        <span>© KORUNY EVROPY</span>
        <span>Vývojová verze 0.1.0</span>
      </footer>
    </main>
  );
}
