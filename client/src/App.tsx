
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
  CalendarDays,
  Users,
  Brain,
  Wheat
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

const STORAGE_KEY = "koruny-evropy-save-v3";

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
  countryTreasuries: Record<string, number>;
  aiRelations: Record<string, Record<string, number>>;
  aiWars: string[];
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

function createInitialTreasuries(): Record<string, number> {
  return Object.fromEntries(
    scenario1066.countries.map(country => [
      country.id,
      country.treasury
    ])
  );
}

function createInitialRelations(): Record<string, Record<string, number>> {
  const result: Record<string, Record<string, number>> = {};

  for (const country of scenario1066.countries) {
    result[country.id] = {};

    for (const other of scenario1066.countries) {
      if (country.id !== other.id) {
        result[country.id][other.id] =
          country.relations?.[other.id] ?? 0;
      }
    }
  }

  return result;
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
    armyLocations: createInitialArmyLocations(),
    countryTreasuries: createInitialTreasuries(),
    aiRelations: createInitialRelations(),
    aiWars: []
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
        aiWars: parsed.aiWars ?? [],
        relations: parsed.relations ?? {},
        aiRelations: {
          ...initial.aiRelations,
          ...(parsed.aiRelations ?? {})
        },
        log: parsed.log ?? [],
        armyLocations: {
          ...createInitialArmyLocations(),
          ...(parsed.armyLocations ?? {})
        },
        countryTreasuries: {
          ...initial.countryTreasuries,
          ...(parsed.countryTreasuries ?? {})
        }
      };
    }
  } catch {
    // Poškozené uložení spustí novou hru.
  }

  return createInitialSave();
}

function getWarKey(first: string, second: string): string {
  return [first, second].sort().join("|");
}

function isAtWar(
  wars: string[],
  first: string,
  second: string
): boolean {
  return wars.includes(getWarKey(first, second));
}

function getCountryArmy(
  armies: Record<string, number>,
  country: Country
): number {
  return armies[country.id] ?? country.army;
}

function getCountryTreasury(
  treasuries: Record<string, number>,
  country: Country
): number {
  return treasuries[country.id] ?? country.treasury;
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

  const yearlyExpenses = player
    ? Math.ceil(playerArmy / 1000) * 5
    : 0;

  const yearlyBalance = yearlyIncome - yearlyExpenses;

  const aiCountries = scenario.countries.filter(
    country => country.id !== player?.id
  );

  const totalAiArmy = aiCountries.reduce(
    (sum, country) => sum + getCountryArmy(save.armies, country),
    0
  );

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
        ? [message, ...current.log].slice(0, 100)
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

    const countryTreasuries = createInitialTreasuries();

    const aiRelations = createInitialRelations();

    setSave({
      year: scenario.year,
      countryId: country.id,
      treasury: country.treasury,
      relations: { ...country.relations },
      selectedProvince: firstProvince?.id ?? scenario.provinces[0].id,
      tab: "map",
      log: [
        `Rok ${scenario.year}: začíná vláda státu ${country.name}.`,
        "Evropské dvory začínají sledovat vývoj na kontinentu."
      ],
      started: true,
      armies,
      provinceOwners,
      wars: [],
      armyLocations,
      countryTreasuries,
      aiRelations,
      aiWars: []
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

    return country
      ? getCountryArmy(save.armies, country)
      : 0;
  }

  function getProvinceIncome(countryId: string): number {
    return gameProvinces
      .filter(province => province.owner === countryId)
      .reduce((sum, province) => {
        const originalOwner = scenario.provinces.find(
          item => item.id === province.id
        )?.owner;

        return sum + (
          originalOwner !== countryId ? province.tax : 0
        );
      }, 0);
  }

  function getAiRelations(
    relations: Record<string, Record<string, number>>,
    first: string,
    second: string
  ): number {
    return relations[first]?.[second] ?? 0;
  }

  // Umělá inteligence: hospodaření, nábor a vojenské rozhodování.
  function processAiYear() {
    const armies = { ...save.armies };
    const treasuries = { ...save.countryTreasuries };
    const owners = { ...save.provinceOwners };
    const locations = { ...save.armyLocations };
    const relations = Object.fromEntries(
      Object.entries(save.aiRelations).map(([id, values]) => [
        id,
        { ...values }
      ])
    ) as Record<string, Record<string, number>>;
    const aiWars = [...save.aiWars];

    const events: string[] = [];
    const currentPlayerId = player?.id ?? "";

    const getOwner = (province: Province) =>
      owners[province.id] ?? province.owner;

    const getArmyLocal = (country: Country) =>
      armies[country.id] ?? country.army;

    const getTreasuryLocal = (country: Country) =>
      treasuries[country.id] ?? country.treasury;

    const setRelation = (
      first: string,
      second: string,
      value: number
    ) => {
      relations[first] ??= {};
      relations[second] ??= {};
      relations[first][second] = value;
      relations[second][first] = value;
    };

    // 1. Hospodářství všech nehráčských států.
    for (const country of scenario.countries) {
      if (country.id === currentPlayerId) continue;

      const owned = gameProvinces.filter(
        province => getOwner(province) === country.id
      );

      if (owned.length === 0) {
        events.push(
          `${country.name} ztratilo všechna svá území.`
        );
        continue;
      }

      const extraIncome = owned.reduce((sum, province) => {
        const originalOwner = scenario.provinces.find(
          item => item.id === province.id
        )?.owner;

        return sum + (
          originalOwner !== country.id ? province.tax : 0
        );
      }, 0);

      const income = country.income + extraIncome;
      const army = getArmyLocal(country);
      const expenses = Math.ceil(army / 1000) * 5;

      let treasury =
        getTreasuryLocal(country) + income - expenses;

      // 2. Doplňování armád.
      if (treasury >= 250 && army < 30000) {
        const recruits = treasury >= 600 ? 1000 : 500;
        const cost = recruits === 1000 ? 200 : 110;

        if (treasury >= cost) {
          armies[country.id] = army + recruits;
          treasury -= cost;

          events.push(
            `${country.name} povolalo ${recruits.toLocaleString("cs-CZ")} nových vojáků.`
          );
        }
      }

      treasuries[country.id] = treasury;

      if (treasury < 0) {
        events.push(
          `Pokladna státu ${country.name} se dostala do dluhu.`
        );
      }
    }

    // 3. Diplomatický vývoj mezi nehráčskými státy.
    const activeAi = scenario.countries.filter(
      country =>
        country.id !== currentPlayerId &&
        gameProvinces.some(
          province => getOwner(province) === country.id
        )
    );

    for (let i = 0; i < activeAi.length; i++) {
      for (let j = i + 1; j < activeAi.length; j++) {
        const first = activeAi[i];
        const second = activeAi[j];
        const key = getWarKey(first.id, second.id);

        if (aiWars.includes(key)) continue;

        const relation = getAiRelations(
          relations,
          first.id,
          second.id
        );

        // Náhodné zhoršení nebo zlepšení vztahů.
        if (Math.random() < 0.18) {
          const change = Math.random() < 0.5 ? -5 : 4;
          setRelation(
            first.id,
            second.id,
            Math.max(-100, Math.min(100, relation + change))
          );
        }

        const updatedRelation = getAiRelations(
          relations,
          first.id,
          second.id
        );

        // Válka může vzniknout při velmi špatných vztazích.
        if (
          updatedRelation <= -60 &&
          Math.random() < 0.18
        ) {
          aiWars.push(key);
          setRelation(first.id, second.id, -100);

          events.push(
            `VÁLKA! ${first.name} vyhlásilo válku státu ${second.name}.`
          );
        }
      }
    }

    // 4. Vojenské operace AI států.
    for (const key of aiWars) {
      const [firstId, secondId] = key.split("|");

      const first = scenario.countries.find(
        country => country.id === firstId
      );
      const second = scenario.countries.find(
        country => country.id === secondId
      );

      if (!first || !second) continue;

      const participants = [first, second];

      for (const attacker of participants) {
        if (attacker.id === currentPlayerId) continue;

        const attackerArmy = getArmyLocal(attacker);

        if (attackerArmy < 500) continue;

        const targets = gameProvinces.filter(province => {
          if (getOwner(province) !== (
            attacker.id === first.id ? second.id : first.id
          )) {
            return false;
          }

          return province.neighbors.some(neighborId => {
            const neighbor = gameProvinces.find(
              item => item.id === neighborId
            );

            return neighbor && getOwner(neighbor) === attacker.id;
          });
        });

        if (targets.length === 0) continue;
        if (Math.random() > 0.55) continue;

        const target =
          targets[Math.floor(Math.random() * targets.length)];

        const defenderId = getOwner(target);
        const defender = scenario.countries.find(
          country => country.id === defenderId
        );

        if (!defender) continue;

        const defenderArmy = getArmyLocal(defender);

        const attackPower =
          attackerArmy * (0.75 + Math.random() * 0.5);

        const defensePower =
          defenderArmy * (0.55 + Math.random() * 0.4) +
          target.development * 250;

        if (attackPower >= defensePower) {
          const attackerLosses = Math.round(attackerArmy * 0.18);
          const defenderLosses = Math.round(defenderArmy * 0.3);

          armies[attacker.id] = Math.max(
            0,
            attackerArmy - attackerLosses
          );

          armies[defender.id] = Math.max(
            0,
            defenderArmy - defenderLosses
          );

          owners[target.id] = attacker.id;
          locations[attacker.id] = target.id;

          if (locations[defender.id] === target.id) {
            const fallback = gameProvinces.find(
              province =>
                getOwner(province) === defender.id &&
                province.id !== target.id
            );

            locations[defender.id] = fallback?.id ?? "";
          }

          events.push(
            `${attacker.name} dobylo provincii ${target.name} od státu ${defender.name}.`
          );
        } else {
          const attackerLosses = Math.round(attackerArmy * 0.25);
          const defenderLosses = Math.round(defenderArmy * 0.1);

          armies[attacker.id] = Math.max(
            0,
            attackerArmy - attackerLosses
          );

          armies[defender.id] = Math.max(
            0,
            defenderArmy - defenderLosses
          );

          events.push(
            `Vojska státu ${attacker.name} utrpěla porážku u provincie ${target.name}.`
          );
        }
      }
    }

    // 5. Vztahy AI k hráči se promítnou do hráčské diplomacie.
    const playerRelations = { ...save.relations };

    for (const country of scenario.countries) {
      if (country.id === currentPlayerId) continue;

      const current = playerRelations[country.id] ?? 0;

      if (Math.random() < 0.08) {
        playerRelations[country.id] = Math.max(
          -100,
          Math.min(100, current + (Math.random() < 0.5 ? -3 : 3))
        );
      }
    }

    return {
      armies,
      treasuries,
      owners,
      locations,
      relations,
      aiWars,
      playerRelations,
      events
    };
  }

  // Každoroční hospodářský a politický cyklus celé Evropy.
  function nextYear() {
    if (!player) return;

    const newYear = save.year + 1;
    const income = yearlyIncome;
    const expenses = yearlyExpenses;
    const balance = income - expenses;
    const newTreasury = save.treasury + balance;

    const ai = processAiYear();

    const playerMessage =
      `Rok ${newYear}: příjmy ${income} zl., ` +
      `vojenské výdaje ${expenses} zl., ` +
      `hospodářský výsledek ${balance >= 0 ? "+" : ""}${balance} zl. ` +
      `Pokladna: ${newTreasury} zl.`;

    const allEvents = [
      ...ai.events,
      playerMessage
    ];

    setSave(current => ({
      ...current,
      year: newYear,
      treasury: newTreasury,
      armies: ai.armies,
      countryTreasuries: ai.treasuries,
      provinceOwners: ai.owners,
      armyLocations: ai.locations,
      aiRelations: ai.relations,
      aiWars: ai.aiWars,
      relations: ai.playerRelations,
      log: [
        ...allEvents.reverse(),
        ...current.log
      ].slice(0, 100)
    }));
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
                style={{ borderTopColor: country.color }}
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
          HISTORICKÁ KAMPAŇ · EVROPA 1066 · VERZE 0.7.0
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
          <p className="muted">Vyber provincii na mapě.</p>
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
              <small>{ownedProvinceCount} vlastněných provincií</small>
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

  function renderAiOverview() {
    if (!player) return null;

    return (
      <section className="content-panel" style={{ marginTop: "16px" }}>
        <span className="eyebrow">EVROPSKÉ PANOVNICKÉ DVORY</span>
        <h3>
          <Brain size={21} /> Ostatní státy a jejich politika
        </h3>

        <p className="muted">
          Nezávislé státy spravují vlastní pokladnu, armádu
          a území. Jejich rozhodnutí se vyhodnocují při uzavření roku.
        </p>

        <div className="war-list">
          {aiCountries.map(country => {
            const provinces = gameProvinces.filter(
              province => province.owner === country.id
            );

            const army = getArmy(country.id);
            const treasury = getCountryTreasury(
              save.countryTreasuries,
              country
            );

            const atWarWithPlayer = save.wars.includes(country.id);

            const aiConflicts = save.aiWars.filter(key =>
              key.split("|").includes(country.id)
            );

            return (
              <div className="war-country-card" key={country.id}>
                <div
                  className="country-color"
                  style={{ background: country.color }}
                />

                <div className="country-info">
                  <strong>{country.name}</strong>
                  <small>Vládce: {country.ruler}</small>
                  <span>
                    {provinces.length} provincií ·{" "}
                    {army.toLocaleString("cs-CZ")} vojáků
                  </span>
                  <span>
                    Pokladna: {treasury.toLocaleString("cs-CZ")} zl.
                  </span>
                  <span>
                    {atWarWithPlayer
                      ? "Ve válce s tebou"
                      : aiConflicts.length > 0
                        ? "V ozbrojeném konfliktu"
                        : "Mír"}
                  </span>
                </div>
              </div>
            );
          })}
        </div>

        <div className="country-row" style={{ marginTop: "14px" }}>
          <div className="country-info">
            <strong>Celková síla ostatních armád</strong>
            <small>Vojáci všech nehráčských států</small>
          </div>
          <strong>{totalAiArmy.toLocaleString("cs-CZ")}</strong>
        </div>
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
          <>
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
            </section>

            {renderAiOverview()}
          </>
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
            {renderAiOverview()}
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
        <span className="mode-label">VERZE 0.7.0</span>
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
        <span>Vývojová verze 0.7.0</span>
      </footer>
    </main>
  );
}
