
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
  ArrowLeft,
  Swords,
  Flag,
  Crosshair,
  HeartHandshake,
  Move,
  MapPin,
  TrendingUp,
  TrendingDown,
  CalendarDays
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
  armies: Record<string, number>;
  provinceOwners: Record<string, string>;
  wars: string[];
  armyLocations: Record<string, string>;
};

function createInitialArmyLocations(): Record<string, string> {
  return Object.fromEntries(
    scenario1066.countries.map(country => {
      const province = scenario1066.provinces.find(
        item => item.owner === country.id
      );

      return [country.id, province?.id ?? ""];
    })
  );
}

function createInitialSave(): SaveData {
  return {
    year: scenario1066.year,
    countryId: "",
    treasury: 0,
    relations: {},
    selectedProvince: "prague",
    tab: "map",
    log: [],
    started: false,
    armies: {},
    provinceOwners: {},
    wars: [],
    armyLocations: createInitialArmyLocations()
  };
}

function readSave(): SaveData {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);

    if (raw) {
      const parsed = JSON.parse(raw);
      const initial = createInitialSave();

      return {
        ...initial,
        ...parsed,
        armies: parsed.armies ?? {},
        provinceOwners: parsed.provinceOwners ?? {},
        wars: parsed.wars ?? [],
        relations: parsed.relations ?? {},
        log: parsed.log ?? [],
        armyLocations: {
          ...createInitialArmyLocations(),
          ...(parsed.armyLocations ?? {})
        }
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

  const gameProvinces = useMemo(
    () =>
      scenario.provinces.map(province => ({
        ...province,
        owner: save.provinceOwners[province.id] ?? province.owner
      })),
    [scenario.provinces, save.provinceOwners]
  );

  const selectedProvince = gameProvinces.find(
    province => province.id === save.selectedProvince
  );

  const playerArmy = player
    ? save.armies[player.id] ?? player.army
    : 0;

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

  const armyCounts = useMemo(
    () =>
      Object.fromEntries(
        scenario.countries.map(country => [
          country.id,
          save.armies[country.id] ?? country.army
        ])
      ),
    [scenario.countries, save.armies]
  );

  const playerArmyLocation = player
    ? save.armyLocations[player.id] ?? ""
    : "";

  const armyLocationProvince = gameProvinces.find(
    province => province.id === playerArmyLocation
  );

  const selectedIsOwned = Boolean(
    player && selectedProvince?.owner === player.id
  );

  const selectedIsArmyLocation =
    selectedProvince?.id === playerArmyLocation;

  const canMoveArmy = Boolean(
    player &&
    selectedProvince &&
    selectedIsOwned &&
    !selectedIsArmyLocation &&
    armyLocationProvince?.neighbors.includes(selectedProvince.id)
  );

  // Základní příjem státu zůstává zachován.
  // Dobyté provincie přidávají svůj daňový výnos.
  const conqueredProvinceIncome = player
    ? gameProvinces
        .filter(
          province =>
            province.owner === player.id &&
            scenario.provinces.find(
              original => original.id === province.id
            )?.owner !== player.id
        )
        .reduce((sum, province) => sum + province.tax, 0)
    : 0;

  const yearlyIncome = player
    ? player.income + conqueredProvinceIncome
    : 0;

  // Údržba armády: 5 zlatých za každých započatých 1 000 mužů.
  const yearlyExpenses = player
    ? Math.ceil(playerArmy / 1000) * 5
    : 0;

  const yearlyBalance = yearlyIncome - yearlyExpenses;

  useEffect(() => {
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(save));
    } catch {
      // Hra pokračuje i v případě nedostupného úložiště.
    }
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
        ? [message, ...current.log].slice(0, 50)
        : current.log
    }));
  }

  function startGame(country: Country) {
    const firstProvince = scenario.provinces.find(
      province => province.owner === country.id
    );

    const armies = Object.fromEntries(
      scenario.countries.map(item => [
        item.id,
        item.army
      ])
    );

    const provinceOwners = Object.fromEntries(
      scenario.provinces.map(province => [
        province.id,
        province.owner
      ])
    );

    const armyLocations = createInitialArmyLocations();

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
      started: true,
      armies,
      provinceOwners,
      wars: [],
      armyLocations
    });
  }

  function returnToCountrySelection() {
    const confirmed = window.confirm(
      "Chceš se vrátit na výběr státu? Postup této kampaně bude nahrazen novou hrou."
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

  function getArmy(countryId: string) {
    const country = scenario.countries.find(
      item => item.id === countryId
    );

    return save.armies[countryId] ?? country?.army ?? 0;
  }

  // Každoroční hospodářský cyklus.
  function nextYear() {
    if (!player) return;

    const newYear = save.year + 1;
    const income = yearlyIncome;
    const expenses = yearlyExpenses;
    const balance = income - expenses;
    const newTreasury = save.treasury + balance;

    const message =
      `Rok ${newYear}: příjmy ${income} zl., ` +
      `vojenské výdaje ${expenses} zl., ` +
      `hospodářský výsledek ${balance >= 0 ? "+" : ""}${balance} zl. ` +
      `Pokladna: ${newTreasury} zl.`;

    updateSave(
      {
        year: newYear,
        treasury: newTreasury
      },
      message
    );
  }

  function improveRelations(countryId: string) {
    if (!player) return;

    if (save.wars.includes(countryId)) {
      updateSave(
        {},
        "Diplomatickou misi nelze vyslat do země, se kterou právě válčíš."
      );
      return;
    }

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

  function moveArmy() {
    if (!player || !selectedProvince) return;

    if (!canMoveArmy) {
      updateSave(
        {},
        "Armádu lze přesunout pouze do sousední provincie, kterou vlastníš."
      );
      return;
    }

    const fromProvince = armyLocationProvince;

    if (!fromProvince) return;

    updateSave(
      {
        armyLocations: {
          ...save.armyLocations,
          [player.id]: selectedProvince.id
        }
      },
      `Rok ${save.year}: armáda státu ${player.name} se přesunula z provincie ${fromProvince.name} do provincie ${selectedProvince.name}.`
    );
  }

  function declareWar(countryId: string) {
    if (!player) return;

    if (save.wars.includes(countryId)) return;

    const enemy = scenario.countries.find(
      country => country.id === countryId
    );

    if (!enemy) return;

    if (save.treasury < 150) {
      updateSave(
        {},
        "Válku nelze vyhlásit: potřebuješ alespoň 150 zlatých."
      );
      return;
    }

    updateSave(
      {
        treasury: save.treasury - 150,
        wars: [...save.wars, countryId],
        relations: {
          ...save.relations,
          [countryId]: -100
        }
      },
      `Rok ${save.year}: ${player.name} vyhlásilo válku státu ${enemy.name}!`
    );
  }

  function makePeace(countryId: string) {
    if (!player) return;

    const enemy = scenario.countries.find(
      country => country.id === countryId
    );

    if (!enemy) return;

    updateSave(
      {
        wars: save.wars.filter(id => id !== countryId),
        relations: {
          ...save.relations,
          [countryId]: -25
        }
      },
      `Rok ${save.year}: byl uzavřen mír mezi státem ${player.name} a zemí ${enemy.name}.`
    );
  }

  function canAttackProvince(province: Province) {
    if (!player) return false;

    if (!save.wars.includes(province.owner)) return false;

    const ownedProvinceIds = gameProvinces
      .filter(item => item.owner === player.id)
      .map(item => item.id);

    return province.neighbors.some(
      neighborId => ownedProvinceIds.includes(neighborId)
    );
  }

  function attackProvince(province: Province) {
    if (!player) return;

    const currentProvince = gameProvinces.find(
      item => item.id === province.id
    );

    if (!currentProvince) return;

    if (!save.wars.includes(currentProvince.owner)) {
      updateSave(
        {},
        "Na toto území nelze zaútočit: nejprve musíš být ve válce s jeho držitelem."
      );
      return;
    }

    if (!canAttackProvince(currentProvince)) {
      updateSave(
        {},
        "Útok není možný: provincie nesousedí s tvým územím."
      );
      return;
    }

    const enemyId = currentProvince.owner;
    const enemy = scenario.countries.find(
      country => country.id === enemyId
    );

    if (!enemy) return;

    const attackingArmy = getArmy(player.id);
    const defendingArmy = getArmy(enemyId);

    if (attackingArmy < 500) {
      updateSave(
        {},
        "Armáda je příliš slabá. Potřebuješ alespoň 500 mužů."
      );
      return;
    }

    if (save.treasury < 100) {
      updateSave(
        {},
        "Nemáš dostatek zlata na zásobování vojenského tažení. Potřebuješ 100 zlatých."
      );
      return;
    }

    const attackPower =
      attackingArmy * (0.75 + Math.random() * 0.5);

    const defensePower =
      defendingArmy * (0.55 + Math.random() * 0.4) +
      currentProvince.development * 250;

    const victory = attackPower >= defensePower;

    const newArmies = { ...save.armies };
    const newProvinceOwners = { ...save.provinceOwners };
    const newArmyLocations = { ...save.armyLocations };

    if (victory) {
      const attackerLosses = Math.round(attackingArmy * 0.18);
      const defenderLosses = Math.round(defendingArmy * 0.3);

      newArmies[player.id] = Math.max(
        0,
        attackingArmy - attackerLosses
      );

      newArmies[enemyId] = Math.max(
        0,
        defendingArmy - defenderLosses
      );

      newProvinceOwners[currentProvince.id] = player.id;
      newArmyLocations[player.id] = currentProvince.id;

      if (newArmyLocations[enemyId] === currentProvince.id) {
        const enemyRemainingProvince = gameProvinces.find(
          item =>
            item.owner === enemyId &&
            item.id !== currentProvince.id
        );

        newArmyLocations[enemyId] =
          enemyRemainingProvince?.id ?? "";
      }

      updateSave(
        {
          treasury: save.treasury - 100,
          armies: newArmies,
          provinceOwners: newProvinceOwners,
          armyLocations: newArmyLocations,
          selectedProvince: currentProvince.id
        },
        `VÍTĚZSTVÍ! Vojska státu ${player.name} dobyla provincii ${currentProvince.name}. Ztráty: ${attackerLosses} mužů.`
      );
    } else {
      const attackerLosses = Math.round(attackingArmy * 0.3);
      const defenderLosses = Math.round(defendingArmy * 0.12);

      newArmies[player.id] = Math.max(
        0,
        attackingArmy - attackerLosses
      );

      newArmies[enemyId] = Math.max(
        0,
        defendingArmy - defenderLosses
      );

      updateSave(
        {
          treasury: save.treasury - 100,
          armies: newArmies
        },
        `PORÁŽKA! Útok na provincii ${currentProvince.name} selhal. Ztráty tvé armády: ${attackerLosses} mužů.`
      );
    }
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
          HISTORICKÁ KAMPAŇ · EVROPA 1066 · VERZE 0.6.0
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

  function renderWarSection() {
    if (!player) return null;

    return (
      <section className="war-section">
        <div className="war-section-heading">
          <span className="eyebrow">VOJENSKÁ DIPLOMACIE</span>
          <h3><Swords /> Války a konflikty</h3>
          <p>
            Tvá armáda má {playerArmy.toLocaleString("cs-CZ")} mužů.
            Vyhlášení války stojí 150 zlatých.
          </p>
        </div>

        <div className="war-list">
          {scenario.countries
            .filter(country => country.id !== player.id)
            .map(country => {
              const atWar = save.wars.includes(country.id);
              const relation = save.relations[country.id] ?? 0;
              const enemyArmy = getArmy(country.id);

              return (
                <div className="war-country-card" key={country.id}>
                  <div
                    className="country-color"
                    style={{ background: country.color }}
                  />

                  <div className="country-info">
                    <strong>{country.name}</strong>
                    <small>{country.ruler}</small>
                    <span>
                      Vztahy: {relation} · Armáda:{" "}
                      {enemyArmy.toLocaleString("cs-CZ")}
                    </span>
                  </div>

                  {atWar ? (
                    <button
                      className="action-button peace-button"
                      onClick={() => makePeace(country.id)}
                    >
                      <HeartHandshake size={15} />
                      Mír
                    </button>
                  ) : (
                    <button
                      className="action-button war-button"
                      onClick={() => declareWar(country.id)}
                    >
                      <Swords size={15} />
                      Válka
                    </button>
                  )}
                </div>
              );
            })}
        </div>

        <div className="battle-section">
          <div className="war-section-heading">
            <span className="eyebrow">VOJENSKÉ OPERACE</span>
            <h3><Crosshair /> Dostupné cíle</h3>
            <p>
              Můžeš útočit pouze na nepřátelské provincie,
              které sousedí s tvým územím.
            </p>
          </div>

          {save.wars.length === 0 ? (
            <p className="muted">
              Momentálně nejsi ve válce. Nejprve vyber nepřátelský
              stát a vyhlaš mu válku.
            </p>
          ) : (
            save.wars.map(enemyId => {
              const enemy = scenario.countries.find(
                country => country.id === enemyId
              );

              const targets = gameProvinces.filter(
                province =>
                  province.owner === enemyId &&
                  canAttackProvince(province)
              );

              return (
                <div className="war-target-group" key={enemyId}>
                  <div className="war-target-title">
                    <Flag size={16} />
                    <strong>{enemy?.name ?? enemyId}</strong>
                  </div>

                  {targets.length === 0 ? (
                    <p className="muted">
                      Zatím nemáš přístupnou nepřátelskou provincii.
                    </p>
                  ) : (
                    targets.map(province => (
                      <div
                        className="battle-target"
                        key={province.id}
                      >
                        <div className="battle-target-info">
                          <strong>{province.name}</strong>
                          <small>
                            Rozvoj: {province.development} ·
                            Populace:{" "}
                            {province.population.toLocaleString("cs-CZ")}
                          </small>
                        </div>

                        <button
                          className="action-button attack-button"
                          onClick={() => attackProvince(province)}
                        >
                          <Swords size={15} />
                          Zaútočit
                        </button>
                      </div>
                    ))
                  )}
                </div>
              );
            })
          )}
        </div>

        <p className="muted war-rules">
          Výsledek bitvy závisí na velikosti obou armád a rozvoji
          bránící se provincie. Vítězství znamená získání území.
          Každý útok stojí 100 zlatých.
        </p>
      </section>
    );
  }

  function renderArmyMovement() {
    if (!player) return null;

    const currentLocation =
      armyLocationProvince?.name ?? "Neznámá provincie";

    return (
      <section
        className="content-panel"
        style={{
          marginTop: "16px",
          padding: "18px"
        }}
      >
        <span className="eyebrow">VOJENSKÉ VELENÍ</span>

        <h3
          style={{
            display: "flex",
            alignItems: "center",
            gap: "9px",
            margin: "8px 0"
          }}
        >
          <Move size={21} />
          Přesun armády
        </h3>

        <div
          style={{
            display: "flex",
            alignItems: "center",
            gap: "10px",
            padding: "12px",
            margin: "12px 0",
            borderRadius: "10px",
            background: "rgba(0,0,0,0.16)"
          }}
        >
          <MapPin size={21} />
          <div>
            <strong>{currentLocation}</strong>
            <div className="muted">
              Aktuální pozice tvého vojska
            </div>
          </div>
        </div>

        <p>
          Vybraná provincie:{" "}
          <strong>{selectedProvince?.name ?? "Žádná"}</strong>
        </p>

        {!selectedProvince && (
          <p className="muted">
            Vyber provincii na mapě.
          </p>
        )}

        {selectedIsArmyLocation && (
          <p className="muted">
            Armáda se již nachází v této provincii.
          </p>
        )}

        {selectedProvince && !selectedIsOwned && (
          <p className="muted">
            Do cizí provincie se běžným přesunem vydat nemůžeš.
            Nepřátelské území musíš dobýt.
          </p>
        )}

        {selectedProvince &&
          selectedIsOwned &&
          !selectedIsArmyLocation &&
          !canMoveArmy && (
            <p className="muted">
              Tato provincie nesousedí s aktuální pozicí armády.
            </p>
          )}

        <button
          className="action-button"
          onClick={moveArmy}
          disabled={!canMoveArmy}
          style={{
            width: "100%",
            justifyContent: "center",
            marginTop: "8px",
            opacity: canMoveArmy ? 1 : 0.5,
            cursor: canMoveArmy ? "pointer" : "not-allowed"
          }}
        >
          <Move size={16} />
          Přesunout armádu sem
        </button>

        <p className="muted" style={{ marginTop: "10px" }}>
          Přesun je možný o jednu sousední vlastní provincii.
          Samotný přesun nestojí zlato.
        </p>
      </section>
    );
  }

  function renderEconomy() {
    if (!player) return null;

    const ownedProvinceCount = gameProvinces.filter(
      province => province.owner === player.id
    ).length;

    return (
      <section className="content-panel">
        <span className="eyebrow">HOSPODÁŘSTVÍ ŘÍŠE</span>
        <h2><Coins /> Státní pokladna</h2>

        <div className="economy-grid">
          <div className="stat-card">
            <Coins />
            <span>Aktuální pokladna</span>
            <strong>
              {save.treasury.toLocaleString("cs-CZ")} zl.
            </strong>
          </div>

          <div className="stat-card">
            <TrendingUp />
            <span>Roční příjmy</span>
            <strong>
              +{yearlyIncome.toLocaleString("cs-CZ")} zl.
            </strong>
          </div>

          <div className="stat-card">
            <TrendingDown />
            <span>Roční výdaje</span>
            <strong>
              -{yearlyExpenses.toLocaleString("cs-CZ")} zl.
            </strong>
          </div>

          <div className="stat-card">
            <CalendarDays />
            <span>Čistý roční výsledek</span>
            <strong
              style={{
                color: yearlyBalance >= 0 ? "#79b879" : "#d87965"
              }}
            >
              {yearlyBalance >= 0 ? "+" : ""}
              {yearlyBalance.toLocaleString("cs-CZ")} zl.
            </strong>
          </div>
        </div>

        <div className="economy-breakdown">
          <h3>Roční hospodářský rozpočet</h3>

          <div className="country-row">
            <div className="country-info">
              <strong>Základní příjem státu</strong>
              <small>Výchozí státní příjmy</small>
            </div>
            <strong>+{player.income} zl.</strong>
          </div>

          <div className="country-row">
            <div className="country-info">
              <strong>Daně z dobytých provincií</strong>
              <small>
                {ownedProvinceCount} vlastněných provincií
              </small>
            </div>
            <strong>+{conqueredProvinceIncome} zl.</strong>
          </div>

          <div className="country-row">
            <div className="country-info">
              <strong>Údržba armády</strong>
              <small>
                {playerArmy.toLocaleString("cs-CZ")} mužů
              </small>
            </div>
            <strong>-{yearlyExpenses} zl.</strong>
          </div>

          <div className="country-row economy-total">
            <div className="country-info">
              <strong>Roční hospodářský výsledek</strong>
            </div>
            <strong>
              {yearlyBalance >= 0 ? "+" : ""}
              {yearlyBalance} zl.
            </strong>
          </div>
        </div>

        <div className="economy-explanation">
          <p>
            <strong>Daňové příjmy:</strong> Každá provincie
            dobytá během kampaně přidává svůj daňový výnos
            k základnímu příjmu tvého státu.
          </p>

          <p>
            <strong>Vojenská údržba:</strong> Za každých
            započatých 1 000 vojáků zaplatíš 5 zlatých ročně.
          </p>

          <p>
            <strong>Dluh:</strong> Pokud výdaje převýší příjmy,
            může se pokladna dostat do záporných hodnot.
          </p>
        </div>

        <button
          className="action-button"
          onClick={nextYear}
          style={{
            width: "100%",
            justifyContent: "center",
            marginTop: "18px"
          }}
        >
          <CalendarDays size={17} />
          Uzavřít rok {save.year} a pokračovat do roku {save.year + 1}
        </button>
      </section>
    );
  }

  function renderContent() {
    if (!player) return null;

    switch (save.tab) {
      case "map":
        return (
          <div className="map-layout">
            <div>
              <EuropeMap
                provinces={gameProvinces}
                countryColors={countryColors}
                selectedProvince={save.selectedProvince}
                onSelectProvince={id =>
                  updateSave({ selectedProvince: id })
                }
                armyLocations={save.armyLocations}
                armyCounts={armyCounts}
              />

              {renderArmyMovement()}
            </div>

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
                {gameProvinces.filter(
                  province => province.owner === player.id
                ).length}
              </strong>
            </div>

            <div className="stat-card">
              <Shield />
              <span>Velikost armády</span>
              <strong>
                {playerArmy.toLocaleString("cs-CZ")}
              </strong>
            </div>

            <div className="stat-card">
              <MapPin />
              <span>Pozice armády</span>
              <strong>
                {armyLocationProvince?.name ?? "Neznámá"}
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

            {renderWarSection()}
          </section>
        );

      case "economy":
        return renderEconomy();

      case "chronicle":
        return (
          <section className="content-panel">
            <span className="eyebrow">ZÁZNAMY DĚJIN</span>
            <h2><ScrollText /> Kronika říše</h2>

            <div className="chronicle">
              {save.log.map((entry, index) => (
                <div
                  className="chronicle-entry"
                  key={`${entry}-${index}`}
                >
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
        income={yearlyBalance}
        army={playerArmy}
        onNextTurn={nextYear}
      />

      <div className="game-subheader">
        <div>
          <span className="eyebrow">HISTORICKÁ KAMPAŇ</span>
          <strong>{scenario.name}</strong>
        </div>
        <span className="mode-label">VERZE 0.6.0</span>
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
        <span>Vývojová verze 0.6.0</span>
      </footer>
    </main>
  );
}
