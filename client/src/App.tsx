
import { useEffect, useMemo, useState } from "react";
import {
  Crown,
  Handshake,
  Coins,
  ScrollText,
  Building2,
  Maximize2,
  Minimize2,
  Shield,
  ArrowLeft
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
  type Province,
  type Country
} from "./data/scenarios";

const STORAGE_KEY = "koruny-evropy-save-v2";

type SaveData = {
  year: number;
  countryId: string;
  treasury: number;
  relations: Record<string, number>;
  selectedProvince: string;
  tab: GameTab;
  log: string[];
  started: boolean;
};

function createInitialSave(): SaveData {
  return {
    year: scenario1066.year,
    countryId: "",
    treasury: 0,
    relations: {},
    selectedProvince: "prague",
    tab: "map",
    log: [],
    started: false
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
    // Poškozené uložení spustí novou hru.
  }

  return createInitialSave();
}

export default function App() {
  const [save, setSave] = useState<SaveData>(readSave);
  const [isFullscreen, setIsFullscreen] = useState(false);
  const [fullscreenMessage, setFullscreenMessage] = useState("");

  const [scenario] = useState<Scenario>(scenario1066);

  const player = scenario.countries.find(
    country => country.id === save.countryId
  );

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

  useEffect(() => {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(save));
  }, [save]);

  useEffect(() => {
    function updateFullscreen() {
      setIsFullscreen(Boolean(document.fullscreenElement));
    }

    document.addEventListener("fullscreenchange", updateFullscreen);

    return () => {
      document.removeEventListener(
        "fullscreenchange",
        updateFullscreen
      );
    };
  }, []);

  async function toggleFullscreen() {
    setFullscreenMessage("");

    try {
      if (document.fullscreenElement) {
        await document.exitFullscreen();
      } else if (document.documentElement.requestFullscreen) {
        await document.documentElement.requestFullscreen();
      } else {
        setFullscreenMessage(
          "Celá obrazovka není v tomto prohlížeči podporována."
        );
      }
    } catch {
      setFullscreenMessage(
        "Prohlížeč nepovolil režim celé obrazovky."
      );
    }
  }

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

  function startGame(country: Country) {
    const firstProvince = scenario.provinces.find(
      province => province.owner === country.id
    );

    setSave({
      year: scenario.year,
      countryId: country.id,
      treasury: country.treasury,
      relations: { ...country.relations },
      selectedProvince: firstProvince?.id ?? scenario.provinces[0].id,
      tab: "map",
      log: [
        `Rok ${scenario.year}: začíná vláda státu ${country.name}.`
      ],
      started: true
    });
  }

  function returnToCountrySelection() {
    const confirmed = window.confirm(
      "Chceš se vrátit na výběr státu? Neuložený postup této kampaně bude nahrazen novou hrou."
    );

    if (!confirmed) return;

    setSave(createInitialSave());
  }

  function ownerName(province?: Province) {
    if (!province) return "Neznámý držitel";

    return (
      scenario.countries.find(
        country => country.id === province.owner
      )?.name ?? "Neznámý držitel"
    );
  }

  function nextYear() {
    if (!player) return;

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
    if (!player) return;

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

  function renderCountrySelection() {
    return (
      <main className="country-selection">
        <div className="selection-top">
          <div className="selection-emblem">
            <Crown size={38} />
          </div>

          <span className="eyebrow">VELKÁ STRATEGICKÁ HRA</span>
          <h1>KORUNY EVROPY</h1>
          <p className="selection-subtitle">Věk říší · 1066</p>
          <p className="selection-description">
            Evropa stojí na prahu nové epochy. Vyber si svůj stát,
            převezmi vládu a rozhodni o osudu kontinentu.
          </p>
        </div>

        <div className="selection-heading">
          <span className="eyebrow">NOVÁ KAMPAŇ</span>
          <h2>Za koho budeš hrát?</h2>
          <p>Vyber si panovnický dvůr, který povedeš.</p>
        </div>

        <div className="country-selection-grid">
          {scenario.countries.map(country => {
            const provinceCount = scenario.provinces.filter(
              province => province.owner === country.id
            ).length;

            return (
              <button
                className="country-choice"
                key={country.id}
                onClick={() => startGame(country)}
                style={{
                  borderTopColor: country.color
                }}
              >
                <div
                  className="choice-color"
                  style={{ background: country.color }}
                >
                  <Shield size={30} />
                </div>

                <span className="eyebrow">PANOVNICKÝ DVŮR</span>
                <h3>{country.name}</h3>
                <p className="choice-ruler">
                  Vládce: {country.ruler}
                </p>

                <div className="choice-stats">
                  <span>
                    <Coins size={15} />
                    {country.treasury.toLocaleString("cs-CZ")} zl.
                  </span>
                  <span>
                    <Shield size={15} />
                    {country.army.toLocaleString("cs-CZ")} mužů
                  </span>
                  <span>
                    <Building2 size={15} />
                    {provinceCount} provincie
                  </span>
                </div>

                <span className="choice-button">
                  Hrát za tento stát →
                </span>
              </button>
            );
          })}
        </div>

        <div className="selection-footer">
          HISTORICKÁ KAMPAŇ · EVROPA 1066
        </div>

        <button
          className="fullscreen-button selection-fullscreen"
          onClick={toggleFullscreen}
          title="Celá obrazovka"
          aria-label="Přepnout celou obrazovku"
        >
          {isFullscreen
            ? <Minimize2 size={19} />
            : <Maximize2 size={19} />}
        </button>

        {fullscreenMessage && (
          <p className="fullscreen-message">
            {fullscreenMessage}
          </p>
        )}
      </main>
    );
  }

  function renderContent() {
    if (!player) return null;

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
            <h2><Crown /> {player.name}</h2>
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
                <strong>
                  {save.treasury.toLocaleString("cs-CZ")}
                </strong>
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

  if (!save.started || !player) {
    return renderCountrySelection();
  }

  return (
    <main className="game-shell">
      <div className="game-toolbar">
        <button
          className="toolbar-button"
          onClick={returnToCountrySelection}
        >
          <ArrowLeft size={17} />
          <span>Výběr státu</span>
        </button>

        <button
          className="fullscreen-button"
          onClick={toggleFullscreen}
          title="Celá obrazovka"
          aria-label="Přepnout celou obrazovku"
        >
          {isFullscreen
            ? <Minimize2 size={19} />
            : <Maximize2 size={19} />}
          <span>
            {isFullscreen ? "Zpět" : "Celá obrazovka"}
          </span>
        </button>
      </div>

      {fullscreenMessage && (
        <p className="fullscreen-message">
          {fullscreenMessage}
        </p>
      )}

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
        <span className="mode-label">VERZE 0.2.0</span>
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
        <span>Vývojová verze 0.2.0</span>
      </footer>
    </main>
  );
}
