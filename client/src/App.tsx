
import { useEffect, useMemo, useState } from "react";
import {
  Crown, Handshake, Coins, ScrollText, Building2,
  Maximize2, Minimize2, Shield, ArrowLeft, Swords,
  Flag, Crosshair, HeartHandshake, Move, MapPin,
  TrendingUp, TrendingDown, CalendarDays, Brain,
  Wheat, Store, Castle, Sprout, Users, AlertTriangle,
  CheckCircle2, Ban
} from "lucide-react";

import GameHeader from "./components/GameHeader";
import EuropeMap from "./components/EuropeMap";
import ProvincePanel from "./components/ProvincePanel";
import BottomNavigation, { type GameTab } from "./components/BottomNavigation";

import {
  scenario1066,
  type Scenario,
  type Province,
  type Country
} from "./data/scenarios";

const STORAGE_KEY = "koruny-evropy-save-v4";
const OLD_STORAGE_KEYS = [
  "koruny-evropy-save-v3",
  "koruny-evropy-save-v2"
];

type Buildings = {
  market: number;
  fort: number;
  farm: number;
};

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
  alliances: string[];
  nonAggressionPacts: string[];
  tradeAgreements: string[];
  buildings: Record<string, Buildings>;
  unrest: Record<string, number>;
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
    scenario1066.countries.map(country => [country.id, country.treasury])
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

function createInitialBuildings(): Record<string, Buildings> {
  return Object.fromEntries(
    scenario1066.provinces.map(province => [
      province.id,
      { market: 0, fort: 0, farm: 0 }
    ])
  );
}

function createInitialUnrest(): Record<string, number> {
  return Object.fromEntries(
    scenario1066.provinces.map(province => [province.id, 0])
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
    armyLocations: createInitialArmyLocations(),
    countryTreasuries: createInitialTreasuries(),
    aiRelations: createInitialRelations(),
    aiWars: [],
    alliances: [],
    nonAggressionPacts: [],
    tradeAgreements: [],
    buildings: createInitialBuildings(),
    unrest: createInitialUnrest()
  };
}

function readSave(): SaveData {
  try {
    let raw = localStorage.getItem(STORAGE_KEY);

    if (!raw) {
      for (const key of OLD_STORAGE_KEYS) {
        raw = localStorage.getItem(key);
        if (raw) break;
      }
    }

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
          ...initial.armyLocations,
          ...(parsed.armyLocations ?? {})
        },
        countryTreasuries: {
          ...initial.countryTreasuries,
          ...(parsed.countryTreasuries ?? {})
        },
        alliances: parsed.alliances ?? [],
        nonAggressionPacts: parsed.nonAggressionPacts ?? [],
        tradeAgreements: parsed.tradeAgreements ?? [],
        buildings: {
          ...initial.buildings,
          ...(parsed.buildings ?? {})
        },
        unrest: {
          ...initial.unrest,
          ...(parsed.unrest ?? {})
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

function clamp(value: number, min = 0, max = 100): number {
  return Math.max(min, Math.min(max, value));
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
    () => scenario.provinces.map(province => ({
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
    () => Object.fromEntries(
      scenario.countries.map(country => [country.id, country.color])
    ),
    [scenario.countries]
  );

  const armyCounts = useMemo(
    () => Object.fromEntries(
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

  const selectedBuildings = save.buildings[save.selectedProvince] ?? {
    market: 0, fort: 0, farm: 0
  };

  const selectedUnrest = save.unrest[save.selectedProvince] ?? 0;

  const ownedProvinces = player
    ? gameProvinces.filter(province => province.owner === player.id)
    : [];

  const conqueredProvinceIncome = player
    ? ownedProvinces.reduce((sum, province) => {
        const original = scenario.provinces.find(
          item => item.id === province.id
        );
        return sum + (original?.owner !== player.id ? province.tax : 0);
      }, 0)
    : 0;

  const buildingIncome = player
    ? ownedProvinces.reduce((sum, province) => {
        const building = save.buildings[province.id] ?? {
          market: 0, fort: 0, farm: 0
        };
        return sum + building.market * 5 + building.farm * 4;
      }, 0)
    : 0;

  const tradeIncome = player
    ? save.tradeAgreements.length * 15
    : 0;

  const yearlyIncome = player
    ? player.income + conqueredProvinceIncome + buildingIncome + tradeIncome
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
      // Hra pokračuje i bez dostupného úložiště.
    }
  }, [save]);

  useEffect(() => {
    function updateFullscreen() {
      setIsFullscreen(Boolean(document.fullscreenElement));
    }

    document.addEventListener("fullscreenchange", updateFullscreen);
    return () => {
      document.removeEventListener("fullscreenchange", updateFullscreen);
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

  function updateSave(updates: Partial<SaveData>, message?: string) {
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

    setSave({
      ...createInitialSave(),
      year: scenario.year,
      countryId: country.id,
      treasury: country.treasury,
      relations: { ...country.relations },
      selectedProvince: firstProvince?.id ?? scenario.provinces[0].id,
      log: [
        `Rok ${scenario.year}: začíná vláda státu ${country.name}.`,
        "Evropské dvory začínají sledovat vývoj na kontinentu."
      ],
      started: true,
      armies: Object.fromEntries(
        scenario.countries.map(item => [item.id, item.army])
      ),
      provinceOwners: Object.fromEntries(
        scenario.provinces.map(province => [
          province.id, province.owner
        ])
      )
    });
  }

  function returnToCountrySelection() {
    const confirmed = window.confirm(
      "Chceš se vrátit na výběr státu? Postup této kampaně bude nahrazen novou hrou."
    );
    if (confirmed) setSave(createInitialSave());
  }

  function ownerName(province?: Province) {
    if (!province) return "Neznámý držitel";
    return scenario.countries.find(
      country => country.id === province.owner
    )?.name ?? "Neznámý držitel";
  }

  function getArmy(countryId: string) {
    const country = scenario.countries.find(
      item => item.id === countryId
    );
    return country ? getCountryArmy(save.armies, country) : 0;
  }

  function getCountryProvinceIncome(countryId: string): number {
    return gameProvinces
      .filter(province => province.owner === countryId)
      .reduce((sum, province) => {
        const original = scenario.provinces.find(
          item => item.id === province.id
        )?.owner;
        return sum + (original !== countryId ? province.tax : 0);
      }, 0);
  }

  function getAiRelation(
    relations: Record<string, Record<string, number>>,
    first: string,
    second: string
  ) {
    return relations[first]?.[second] ?? 0;
  }

  function getBuildings(provinceId: string): Buildings {
    return save.buildings[provinceId] ?? {
      market: 0, fort: 0, farm: 0
    };
  }

  function buildInProvince(
    kind: keyof Buildings,
    province: Province
  ) {
    if (!player || province.owner !== player.id) return;

    const current = getBuildings(province.id);
    const level = current[kind];
    const costs: Record<keyof Buildings, number> = {
      market: 180 + level * 140,
      fort: 220 + level * 170,
      farm: 150 + level * 120
    };

    const cost = costs[kind];

    if (level >= 3) {
      updateSave({}, "Tuto budovu již nelze dále vylepšit.");
      return;
    }

    if (save.treasury < cost) {
      updateSave({}, `Na stavbu potřebuješ ${cost} zlatých.`);
      return;
    }

    const names = {
      market: "Tržiště",
      fort: "Pevnost",
      farm: "Hospodářský statek"
    };

    updateSave({
      treasury: save.treasury - cost,
      buildings: {
        ...save.buildings,
        [province.id]: {
          ...current,
          [kind]: level + 1
        }
      }
    }, `V provincii ${province.name} byla postavena budova: ${names[kind]} (úroveň ${level + 1}).`);
  }

  function setRelation(
    first: string,
    second: string,
    value: number,
    relations: Record<string, Record<string, number>>
  ) {
    relations[first] ??= {};
    relations[second] ??= {};
    relations[first][second] = clamp(value, -100, 100);
    relations[second][first] = clamp(value, -100, 100);
  }

  function processAiYear() {
    const armies = { ...save.armies };
    const treasuries = { ...save.countryTreasuries };
    const owners = { ...save.provinceOwners };
    const locations = { ...save.armyLocations };
    const relations = Object.fromEntries(
      Object.entries(save.aiRelations).map(([id, values]) => [
        id, { ...values }
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

    // AI hospodaří, staví armádu a udržuje své státy.
    for (const country of scenario.countries) {
      if (country.id === currentPlayerId) continue;

      const provinces = gameProvinces.filter(
        province => getOwner(province) === country.id
      );

      if (provinces.length === 0) continue;

      const extraIncome = provinces.reduce((sum, province) => {
        const original = scenario.provinces.find(
          item => item.id === province.id
        )?.owner;
        return sum + (original !== country.id ? province.tax : 0);
      }, 0);

      const army = getArmyLocal(country);
      const expenses = Math.ceil(army / 1000) * 5;
      let treasury = getTreasuryLocal(country) +
        country.income + extraIncome - expenses;

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
    }

    const activeAi = scenario.countries.filter(
      country => country.id !== currentPlayerId &&
        gameProvinces.some(province => getOwner(province) === country.id)
    );

    // Diplomatické vztahy AI a soupeření o vliv.
    for (let i = 0; i < activeAi.length; i++) {
      for (let j = i + 1; j < activeAi.length; j++) {
        const first = activeAi[i];
        const second = activeAi[j];
        const key = getWarKey(first.id, second.id);
        if (aiWars.includes(key)) continue;

        let relation = getAiRelation(relations, first.id, second.id);

        if (Math.random() < 0.2) {
          relation += Math.random() < 0.5 ? -6 : 4;
        }

        const firstPower = getArmyLocal(first) +
          gameProvinces.filter(p => getOwner(p) === first.id).length * 1500;
        const secondPower = getArmyLocal(second) +
          gameProvinces.filter(p => getOwner(p) === second.id).length * 1500;

        if (firstPower > secondPower * 1.7) relation -= 1;
        if (secondPower > firstPower * 1.7) relation -= 1;

        setRelation(first.id, second.id, relation, relations);

        if (relation <= -65 && Math.random() < 0.2) {
          aiWars.push(key);
          setRelation(first.id, second.id, -100, relations);
          events.push(
            `VÁLKA! ${first.name} vyhlásilo válku státu ${second.name}.`
          );
        }
      }
    }

    // Vojenské operace AI.
    for (const key of aiWars) {
      const [firstId, secondId] = key.split("|");
      const first = scenario.countries.find(c => c.id === firstId);
      const second = scenario.countries.find(c => c.id === secondId);
      if (!first || !second) continue;

      for (const attacker of [first, second]) {
        if (attacker.id === currentPlayerId) continue;
        const attackerArmy = getArmyLocal(attacker);
        if (attackerArmy < 500) continue;

        const defenderId = attacker.id === first.id ? second.id : first.id;
        const targets = gameProvinces.filter(province =>
          getOwner(province) === defenderId &&
          province.neighbors.some(neighborId => {
            const neighbor = gameProvinces.find(p => p.id === neighborId);
            return neighbor && getOwner(neighbor) === attacker.id;
          })
        );

        if (!targets.length || Math.random() > 0.55) continue;

        const target = targets[Math.floor(Math.random() * targets.length)];
        const defender = scenario.countries.find(c => c.id === defenderId);
        if (!defender) continue;

        const defenderArmy = getArmyLocal(defender);
        const attackPower = attackerArmy * (0.75 + Math.random() * 0.5);
        const defensePower = defenderArmy * (0.55 + Math.random() * 0.4) +
          target.development * 250 +
          (getBuildings(target.id).fort * 350);

        if (attackPower >= defensePower) {
          armies[attacker.id] = Math.max(0, attackerArmy -
            Math.round(attackerArmy * 0.18));
          armies[defender.id] = Math.max(0, defenderArmy -
            Math.round(defenderArmy * 0.3));
          owners[target.id] = attacker.id;
          locations[attacker.id] = target.id;

          if (locations[defender.id] === target.id) {
            locations[defender.id] = gameProvinces.find(
              p => getOwner(p) === defender.id && p.id !== target.id
            )?.id ?? "";
          }

          events.push(
            `${attacker.name} dobylo provincii ${target.name} od státu ${defender.name}.`
          );
        } else {
          armies[attacker.id] = Math.max(0, attackerArmy -
            Math.round(attackerArmy * 0.25));
          armies[defender.id] = Math.max(0, defenderArmy -
            Math.round(defenderArmy * 0.1));
          events.push(
            `Vojska státu ${attacker.name} utrpěla porážku u provincie ${target.name}.`
          );
        }
      }
    }

    // AI reaguje na hráčovy smlouvy a spojenectví.
    const playerRelations = { ...save.relations };

    for (const country of scenario.countries) {
      if (country.id === currentPlayerId) continue;

      let relation = playerRelations[country.id] ?? 0;

      if (Math.random() < 0.1) {
        relation += Math.random() < 0.5 ? -3 : 3;
      }

      if (save.alliances.includes(country.id)) relation += 2;
      if (save.tradeAgreements.includes(country.id)) relation += 2;

      if (save.wars.includes(country.id)) relation = -100;

      playerRelations[country.id] = clamp(relation, -100, 100);
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

  function processUnrest() {
    if (!player) return {
      unrest: save.unrest,
      owners: save.provinceOwners,
      events: [] as string[]
    };

    const unrest = { ...save.unrest };
    const owners = { ...save.provinceOwners };
    const events: string[] = [];

    for (const province of gameProvinces) {
      if (province.owner !== player.id) continue;

      const originalOwner = scenario.provinces.find(
        p => p.id === province.id
      )?.owner;

      const building = getBuildings(province.id);
      let value = unrest[province.id] ?? 0;

      if (originalOwner !== player.id) value += 3;
      if (building.farm > 0) value -= 2;
      if (building.fort > 0) value -= 1;
      if ((save.relations[originalOwner ?? ""] ?? 0) > 30) value -= 1;

      value = clamp(value, 0, 100);
      unrest[province.id] = value;

      if (value >= 75 && Math.random() < 0.25) {
        owners[province.id] = originalOwner ?? province.owner;
        unrest[province.id] = 20;
        events.push(
          `POVSTÁNÍ! Provincie ${province.name} se vzbouřila a odtrhla se od tvé říše.`
        );
      } else if (value >= 50 && Math.random() < 0.25) {
        events.push(
          `V provincii ${province.name} sílí nespokojenost obyvatelstva.`
        );
      }
    }

    return { unrest, owners, events };
  }

  function nextYear() {
    if (!player) return;

    const newYear = save.year + 1;
    const income = yearlyIncome;
    const expenses = yearlyExpenses;
    const balance = income - expenses;
    const newTreasury = save.treasury + balance;

    const ai = processAiYear();
    const unrestResult = processUnrest();

    const playerMessage =
      `Rok ${newYear}: příjmy ${income} zl., výdaje ${expenses} zl., ` +
      `výsledek ${balance >= 0 ? "+" : ""}${balance} zl. ` +
      `Pokladna: ${newTreasury} zl.`;

    setSave(current => ({
      ...current,
      year: newYear,
      treasury: newTreasury,
      armies: ai.armies,
      countryTreasuries: ai.treasuries,
      provinceOwners: { ...ai.owners, ...unrestResult.owners },
      armyLocations: ai.locations,
      aiRelations: ai.relations,
      aiWars: ai.aiWars,
      relations: ai.playerRelations,
      unrest: unrestResult.unrest,
      log: [
        ...[
          ...ai.events,
          ...unrestResult.events,
          playerMessage
        ].reverse(),
        ...current.log
      ].slice(0, 100)
    }));
  }

  function improveRelations(countryId: string) {
    if (!player) return;
    if (save.wars.includes(countryId)) {
      updateSave({}, "Diplomatickou misi nelze vyslat do země, se kterou válčíš.");
      return;
    }

    const current = save.relations[countryId] ?? 0;
    if (save.treasury < 100) {
      updateSave({}, "Diplomatická mise vyžaduje 100 zlatých.");
      return;
    }

    const target = scenario.countries.find(c => c.id === countryId);
    updateSave({
      treasury: save.treasury - 100,
      relations: {
        ...save.relations,
        [countryId]: clamp(current + 10, -100, 100)
      }
    }, `Do země ${target?.name ?? countryId} byla vyslána diplomatická mise.`);
  }

  function signTreaty(
    countryId: string,
    type: "alliance" | "pact" | "trade"
  ) {
    if (!player) return;

    if (save.wars.includes(countryId)) {
      updateSave({}, "Smlouvu nelze uzavřít během války.");
      return;
    }

    const relation = save.relations[countryId] ?? 0;
    const costs = { alliance: 250, pact: 120, trade: 100 };
    const minimums = { alliance: 50, pact: 15, trade: -10 };
    const lists = {
      alliance: save.alliances,
      pact: save.nonAggressionPacts,
      trade: save.tradeAgreements
    };
    const names = {
      alliance: "spojenectví",
      pact: "pakt o neútočení",
      trade: "obchodní dohodu"
    };

    if (lists[type].includes(countryId)) {
      updateSave({}, "Tato smlouva už je uzavřena.");
      return;
    }

    if (relation < minimums[type]) {
      updateSave(
        {},
        `Vztahy jsou příliš špatné. Pro uzavření smlouvy potřebuješ vztahy alespoň ${minimums[type]}.`
      );
      return;
    }

    if (save.treasury < costs[type]) {
      updateSave({}, `Na uzavření smlouvy potřebuješ ${costs[type]} zlatých.`);
      return;
    }

    const updates: Partial<SaveData> = {
      treasury: save.treasury - costs[type],
      relations: {
        ...save.relations,
        [countryId]: clamp(relation + 8, -100, 100)
      }
    };

    if (type === "alliance") {
      updates.alliances = [...save.alliances, countryId];
    } else if (type === "pact") {
      updates.nonAggressionPacts = [
        ...save.nonAggressionPacts, countryId
      ];
    } else {
      updates.tradeAgreements = [
        ...save.tradeAgreements, countryId
      ];
    }

    updateSave(
      updates,
      `Byla uzavřena ${names[type]} se státem ${scenario.countries.find(c => c.id === countryId)?.name ?? countryId}.`
    );
  }

  function cancelTreaty(
    countryId: string,
    type: "alliance" | "pact" | "trade"
  ) {
    const names = {
      alliance: "spojenectví",
      pact: "pakt o neútočení",
      trade: "obchodní dohodu"
    };

    const updates: Partial<SaveData> = {};

    if (type === "alliance") {
      updates.alliances = save.alliances.filter(id => id !== countryId);
    } else if (type === "pact") {
      updates.nonAggressionPacts =
        save.nonAggressionPacts.filter(id => id !== countryId);
    } else {
      updates.tradeAgreements =
        save.tradeAgreements.filter(id => id !== countryId);
    }

    updateSave(
      updates,
      `Byla vypovězena ${names[type]} se státem ${scenario.countries.find(c => c.id === countryId)?.name ?? countryId}.`
    );
  }

  function moveArmy() {
    if (!player || !selectedProvince || !canMoveArmy) {
      updateSave({}, "Armádu lze přesunout pouze do sousední vlastní provincie.");
      return;
    }

    const fromProvince = armyLocationProvince;
    if (!fromProvince) return;

    updateSave({
      armyLocations: {
        ...save.armyLocations,
        [player.id]: selectedProvince.id
      }
    }, `Armáda se přesunula z provincie ${fromProvince.name} do provincie ${selectedProvince.name}.`);
  }

  function declareWar(countryId: string) {
    if (!player || save.wars.includes(countryId)) return;

    const enemy = scenario.countries.find(c => c.id === countryId);
    if (!enemy) return;

    if (save.nonAggressionPacts.includes(countryId)) {
      const confirmed = window.confirm(
        "Vyhlášením války porušíš pakt o neútočení. Vztahy se výrazně zhorší. Pokračovat?"
      );
      if (!confirmed) return;
    }

    if (save.treasury < 150) {
      updateSave({}, "Vyhlášení války vyžaduje 150 zlatých.");
      return;
    }

    updateSave({
      treasury: save.treasury - 150,
      wars: [...save.wars, countryId],
      nonAggressionPacts: save.nonAggressionPacts.filter(id => id !== countryId),
      alliances: save.alliances.filter(id => id !== countryId),
      tradeAgreements: save.tradeAgreements.filter(id => id !== countryId),
      relations: { ...save.relations, [countryId]: -100 }
    }, `VÁLKA! ${player.name} vyhlásilo válku státu ${enemy.name}.`);
  }

  function makePeace(countryId: string) {
    if (!player) return;
    const enemy = scenario.countries.find(c => c.id === countryId);
    if (!enemy) return;

    updateSave({
      wars: save.wars.filter(id => id !== countryId),
      relations: { ...save.relations, [countryId]: -25 }
    }, `Byl uzavřen mír mezi státem ${player.name} a zemí ${enemy.name}.`);
  }

  function canAttackProvince(province: Province) {
    if (!player || !save.wars.includes(province.owner)) return false;

    const ownedIds = gameProvinces
      .filter(item => item.owner === player.id)
      .map(item => item.id);

    return province.neighbors.some(id => ownedIds.includes(id));
  }

  function attackProvince(province: Province) {
    if (!player) return;

    const currentProvince = gameProvinces.find(p => p.id === province.id);
    if (!currentProvince) return;

    if (!save.wars.includes(currentProvince.owner)) {
      updateSave({}, "Nejprve musíš být ve válce s držitelem provincie.");
      return;
    }

    if (!canAttackProvince(currentProvince)) {
      updateSave({}, "Tato provincie nesousedí s tvým územím.");
      return;
    }

    const enemyId = currentProvince.owner;
    const enemy = scenario.countries.find(c => c.id === enemyId);
    if (!enemy) return;

    const attackingArmy = getArmy(player.id);
    const defendingArmy = getArmy(enemyId);

    if (attackingArmy < 500) {
      updateSave({}, "Potřebuješ alespoň 500 vojáků.");
      return;
    }

    if (save.treasury < 100) {
      updateSave({}, "Vojenské tažení vyžaduje 100 zlatých.");
      return;
    }

    const attackPower = attackingArmy * (0.75 + Math.random() * 0.5);
    const defensePower =
      defendingArmy * (0.55 + Math.random() * 0.4) +
      currentProvince.development * 250 +
      getBuildings(currentProvince.id).fort * 350;

    const newArmies = { ...save.armies };
    const newOwners = { ...save.provinceOwners };
    const newLocations = { ...save.armyLocations };

    if (attackPower >= defensePower) {
      const attackerLosses = Math.round(attackingArmy * 0.18);
      const defenderLosses = Math.round(defendingArmy * 0.3);

      newArmies[player.id] = Math.max(0, attackingArmy - attackerLosses);
      newArmies[enemyId] = Math.max(0, defendingArmy - defenderLosses);
      newOwners[currentProvince.id] = player.id;
      newLocations[player.id] = currentProvince.id;

      if (newLocations[enemyId] === currentProvince.id) {
        newLocations[enemyId] = gameProvinces.find(
          p => p.owner === enemyId && p.id !== currentProvince.id
        )?.id ?? "";
      }

      updateSave({
        treasury: save.treasury - 100,
        armies: newArmies,
        provinceOwners: newOwners,
        armyLocations: newLocations,
        selectedProvince: currentProvince.id,
        unrest: {
          ...save.unrest,
          [currentProvince.id]: 35
        }
      }, `VÍTĚZSTVÍ! Vojska státu ${player.name} dobyla provincii ${currentProvince.name}. Ztráty: ${attackerLosses} mužů.`);
    } else {
      const attackerLosses = Math.round(attackingArmy * 0.3);
      const defenderLosses = Math.round(defendingArmy * 0.12);

      newArmies[player.id] = Math.max(0, attackingArmy - attackerLosses);
      newArmies[enemyId] = Math.max(0, defendingArmy - defenderLosses);

      updateSave({
        treasury: save.treasury - 100,
        armies: newArmies
      }, `PORÁŽKA! Útok na provincii ${currentProvince.name} selhal. Ztráty tvé armády: ${attackerLosses} mužů.`);
    }
  }

  function renderCountrySelection() {
    return (
      <main className="country-selection">
        <div className="selection-top">
          <div className="selection-emblem"><Crown size={38} /></div>
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
            const count = scenario.provinces.filter(
              p => p.owner === country.id
            ).length;

            return (
              <button
                className="country-choice"
                key={country.id}
                onClick={() => startGame(country)}
                style={{ borderTopColor: country.color }}
              >
                <div className="choice-color" style={{ background: country.color }}>
                  <Shield size={30} />
                </div>
                <span className="eyebrow">PANOVNICKÝ DVŮR</span>
                <h3>{country.name}</h3>
                <p className="choice-ruler">Vládce: {country.ruler}</p>
                <div className="choice-stats">
                  <span><Coins size={15} />{country.treasury.toLocaleString("cs-CZ")} zl.</span>
                  <span><Shield size={15} />{country.army.toLocaleString("cs-CZ")} mužů</span>
                  <span><Building2 size={15} />{count} provincie</span>
                </div>
                <span className="choice-button">Hrát za tento stát →</span>
              </button>
            );
          })}
        </div>

        <div className="selection-footer">
          HISTORICKÁ KAMPAŇ · EVROPA 1066 · VERZE 0.8.0
        </div>

        <button
          className="fullscreen-button selection-fullscreen"
          onClick={toggleFullscreen}
          title="Celá obrazovka"
          aria-label="Přepnout celou obrazovku"
        >
          {isFullscreen ? <Minimize2 size={19} /> : <Maximize2 size={19} />}
        </button>

        {fullscreenMessage && (
          <p className="fullscreen-message">{fullscreenMessage}</p>
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
          {scenario.countries.filter(c => c.id !== player.id).map(country => {
            const atWar = save.wars.includes(country.id);
            const relation = save.relations[country.id] ?? 0;

            return (
              <div className="war-country-card" key={country.id}>
                <div className="country-color" style={{ background: country.color }} />
                <div className="country-info">
                  <strong>{country.name}</strong>
                  <small>{country.ruler}</small>
                  <span>
                    Vztahy: {relation} · Armáda: {getArmy(country.id).toLocaleString("cs-CZ")}
                  </span>
                </div>
                {atWar ? (
                  <button className="action-button peace-button" onClick={() => makePeace(country.id)}>
                    <HeartHandshake size={15} /> Mír
                  </button>
                ) : (
                  <button className="action-button war-button" onClick={() => declareWar(country.id)}>
                    <Swords size={15} /> Válka
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
            <p>Můžeš útočit pouze na nepřátelské provincie sousedící s tvým územím.</p>
          </div>

          {save.wars.length === 0 ? (
            <p className="muted">Momentálně nejsi ve válce.</p>
          ) : save.wars.map(enemyId => {
            const enemy = scenario.countries.find(c => c.id === enemyId);
            const targets = gameProvinces.filter(
              p => p.owner === enemyId && canAttackProvince(p)
            );

            return (
              <div className="war-target-group" key={enemyId}>
                <div className="war-target-title">
                  <Flag size={16} /><strong>{enemy?.name ?? enemyId}</strong>
                </div>
                {targets.length === 0 ? (
                  <p className="muted">Zatím nemáš přístupnou nepřátelskou provincii.</p>
                ) : targets.map(province => (
                  <div className="battle-target" key={province.id}>
                    <div className="battle-target-info">
                      <strong>{province.name}</strong>
                      <small>
                        Rozvoj: {province.development} · Populace: {province.population.toLocaleString("cs-CZ")}
                      </small>
                    </div>
                    <button className="action-button attack-button" onClick={() => attackProvince(province)}>
                      <Swords size={15} /> Zaútočit
                    </button>
                  </div>
                ))}
              </div>
            );
          })}
        </div>

        <p className="muted war-rules">
          Výsledek bitvy závisí na velikosti armád, rozvoji a opevnění provincie.
          Každý útok stojí 100 zlatých.
        </p>
      </section>
    );
  }

  function renderArmyMovement() {
    if (!player) return null;

    return (
      <section className="content-panel" style={{ marginTop: 16, padding: 18 }}>
        <span className="eyebrow">VOJENSKÉ VELENÍ</span>
        <h3 style={{ display: "flex", alignItems: "center", gap: 9, margin: "8px 0" }}>
          <Move size={21} /> Přesun armády
        </h3>
        <div style={{
          display: "flex", alignItems: "center", gap: 10,
          padding: 12, margin: "12px 0", borderRadius: 10,
          background: "rgba(0,0,0,0.16)"
        }}>
          <MapPin size={21} />
          <div>
            <strong>{armyLocationProvince?.name ?? "Neznámá provincie"}</strong>
            <div className="muted">Aktuální pozice tvého vojska</div>
          </div>
        </div>
        <p>Vybraná provincie: <strong>{selectedProvince?.name ?? "Žádná"}</strong></p>
        {selectedIsArmyLocation && <p className="muted">Armáda se již nachází v této provincii.</p>}
        {selectedProvince && !selectedIsOwned && (
          <p className="muted">Do cizí provincie se běžným přesunem vydat nemůžeš.</p>
        )}
        {selectedProvince && selectedIsOwned && !selectedIsArmyLocation && !canMoveArmy && (
          <p className="muted">Tato provincie nesousedí s aktuální pozicí armády.</p>
        )}
        <button
          className="action-button"
          onClick={moveArmy}
          disabled={!canMoveArmy}
          style={{
            width: "100%", justifyContent: "center", marginTop: 8,
            opacity: canMoveArmy ? 1 : 0.5,
            cursor: canMoveArmy ? "pointer" : "not-allowed"
          }}
        >
          <Move size={16} /> Přesunout armádu sem
        </button>
        <p className="muted" style={{ marginTop: 10 }}>
          Přesun je možný o jednu sousední vlastní provincii a nestojí zlato.
        </p>
      </section>
    );
  }

  function renderProvinceManagement() {
    if (!player || !selectedProvince) return null;

    const owned = selectedProvince.owner === player.id;
    const buildings = getBuildings(selectedProvince.id);
    const unrest = save.unrest[selectedProvince.id] ?? 0;

    const options: {
      key: keyof Buildings;
      name: string;
      description: string;
      icon: typeof Store;
      cost: number;
    }[] = [
      {
        key: "market",
        name: "Tržiště",
        description: "+5 zlatých ročně za úroveň",
        icon: Store,
        cost: 180 + buildings.market * 140
      },
      {
        key: "fort",
        name: "Pevnost",
        description: "Zvyšuje obranu provincie",
        icon: Castle,
        cost: 220 + buildings.fort * 170
      },
      {
        key: "farm",
        name: "Hospodářský statek",
        description: "+4 zlata ročně a nižší nespokojenost",
        icon: Wheat,
        cost: 150 + buildings.farm * 120
      }
    ];

    return (
      <section className="content-panel" style={{ marginTop: 16 }}>
        <span className="eyebrow">SPRÁVA PROVINCIE</span>
        <h3><Building2 size={21} /> {selectedProvince.name}</h3>

        {!owned ? (
          <p className="muted">Tuto provincii nevlastníš. Správa budov je dostupná pouze ve vlastních provinciích.</p>
        ) : (
          <>
            <div className="stat-card">
              <AlertTriangle />
              <span>Nespokojenost obyvatelstva</span>
              <strong style={{ color: unrest >= 60 ? "#d87965" : undefined }}>
                {unrest}/100
              </strong>
            </div>

            <p className="muted">
              Při vysoké nespokojenosti hrozí povstání a odtržení provincie.
              Farmy a pevnosti pomáhají udržovat pořádek.
            </p>

            {options.map(option => {
              const Icon = option.icon;
              const level = buildings[option.key];

              return (
                <div className="country-row" key={option.key}>
                  <div className="country-info">
                    <strong><Icon size={16} /> {option.name} · úroveň {level}/3</strong>
                    <small>{option.description}</small>
                    <small>Další úroveň: {option.cost} zl.</small>
                  </div>
                  <button
                    className="action-button"
                    disabled={level >= 3 || save.treasury < option.cost}
                    onClick={() => buildInProvince(option.key, selectedProvince)}
                    style={{ opacity: level >= 3 || save.treasury < option.cost ? 0.5 : 1 }}
                  >
                    {level >= 3 ? "Maximum" : "Vylepšit"}
                  </button>
                </div>
              );
            })}
          </>
        )}
      </section>
    );
  }

  function renderEconomy() {
    if (!player) return null;

    return (
      <section className="content-panel">
        <span className="eyebrow">HOSPODÁŘSTVÍ ŘÍŠE</span>
        <h2><Coins /> Státní pokladna</h2>

        <div className="economy-grid">
          <div className="stat-card">
            <Coins /><span>Aktuální pokladna</span>
            <strong>{save.treasury.toLocaleString("cs-CZ")} zl.</strong>
          </div>
          <div className="stat-card">
            <TrendingUp /><span>Roční příjmy</span>
            <strong>+{yearlyIncome.toLocaleString("cs-CZ")} zl.</strong>
          </div>
          <div className="stat-card">
            <TrendingDown /><span>Roční výdaje</span>
            <strong>-{yearlyExpenses.toLocaleString("cs-CZ")} zl.</strong>
          </div>
          <div className="stat-card">
            <CalendarDays /><span>Čistý výsledek</span>
            <strong style={{ color: yearlyBalance >= 0 ? "#79b879" : "#d87965" }}>
              {yearlyBalance >= 0 ? "+" : ""}{yearlyBalance.toLocaleString("cs-CZ")} zl.
            </strong>
          </div>
        </div>

        <div className="economy-breakdown">
          <h3>Roční hospodářský rozpočet</h3>
          {[
            ["Základní příjem státu", `+${player.income} zl.`],
            ["Daně z dobytých provincií", `+${conqueredProvinceIncome} zl.`],
            ["Tržiště a statky", `+${buildingIncome} zl.`],
            ["Obchodní dohody", `+${tradeIncome} zl.`],
            ["Údržba armády", `-${yearlyExpenses} zl.`]
          ].map(([name, value]) => (
            <div className="country-row" key={name}>
              <div className="country-info"><strong>{name}</strong></div>
              <strong>{value}</strong>
            </div>
          ))}
          <div className="country-row economy-total">
            <div className="country-info"><strong>Roční výsledek</strong></div>
            <strong>{yearlyBalance >= 0 ? "+" : ""}{yearlyBalance} zl.</strong>
          </div>
        </div>

        <div className="economy-explanation">
          <p><strong>Tržiště:</strong> Každá úroveň přidává 5 zlatých ročně.</p>
          <p><strong>Statky:</strong> Každá úroveň přidává 4 zlaté ročně a snižuje nepokoje.</p>
          <p><strong>Obchod:</strong> Každá aktivní obchodní dohoda přináší 15 zlatých ročně.</p>
          <p><strong>Armáda:</strong> Za každých započatých 1 000 vojáků platíš 5 zlatých ročně.</p>
        </div>

        <button className="action-button" onClick={nextYear} style={{
          width: "100%", justifyContent: "center", marginTop: 18
        }}>
          <CalendarDays size={17} />
          Uzavřít rok {save.year} a pokračovat do roku {save.year + 1}
        </button>
      </section>
    );
  }

  function renderAiOverview() {
    if (!player) return null;

    return (
      <section className="content-panel" style={{ marginTop: 16 }}>
        <span className="eyebrow">EVROPSKÉ PANOVNICKÉ DVORY</span>
        <h3><Brain size={21} /> Ostatní státy a jejich politika</h3>
        <p className="muted">
          Ostatní státy spravují vlastní pokladnu, armádu a území.
          Jejich rozhodnutí se vyhodnocují při uzavření roku.
        </p>

        <div className="war-list">
          {aiCountries.map(country => {
            const provinces = gameProvinces.filter(p => p.owner === country.id);
            const conflicts = save.aiWars.filter(key => key.split("|").includes(country.id));
            const atWar = save.wars.includes(country.id);

            return (
              <div className="war-country-card" key={country.id}>
                <div className="country-color" style={{ background: country.color }} />
                <div className="country-info">
                  <strong>{country.name}</strong>
                  <small>Vládce: {country.ruler}</small>
                  <span>{provinces.length} provincií · {getArmy(country.id).toLocaleString("cs-CZ")} vojáků</span>
                  <span>Pokladna: {getCountryTreasury(save.countryTreasuries, country).toLocaleString("cs-CZ")} zl.</span>
                  <span>{atWar ? "Ve válce s tebou" : conflicts.length ? "V ozbrojeném konfliktu" : "Mír"}</span>
                </div>
              </div>
            );
          })}
        </div>

        <div className="country-row" style={{ marginTop: 14 }}>
          <div className="country-info">
            <strong>Celková síla ostatních armád</strong>
            <small>Vojáci všech nehráčských států</small>
          </div>
          <strong>{totalAiArmy.toLocaleString("cs-CZ")}</strong>
        </div>
      </section>
    );
  }

  function renderDiplomacy() {
    if (!player) return null;

    return (
      <section className="content-panel">
        <span className="eyebrow">ZAHRANIČNÍ VZTAHY</span>
        <h2><Handshake /> Diplomacie</h2>
        <p className="muted">
          Vztahy se státy ovlivňují možnosti uzavírání smluv.
          Vyhlášení války ruší uzavřené dohody s daným státem.
        </p>

        {scenario.countries.filter(c => c.id !== player.id).map(country => {
          const relation = save.relations[country.id] ?? 0;
          const alliance = save.alliances.includes(country.id);
          const pact = save.nonAggressionPacts.includes(country.id);
          const trade = save.tradeAgreements.includes(country.id);
          const atWar = save.wars.includes(country.id);

          return (
            <div className="content-panel" key={country.id} style={{ marginTop: 12 }}>
              <div className="country-row">
                <div className="country-color" style={{ background: country.color }} />
                <div className="country-info">
                  <strong>{country.name}</strong>
                  <small>{country.ruler}</small>
                  <span>Vztahy: {relation}/100</span>
                </div>
                <button
                  className="action-button"
                  disabled={atWar}
                  onClick={() => improveRelations(country.id)}
                >
                  Mise · 100 zl.
                </button>
              </div>

              <div style={{ display: "flex", flexWrap: "wrap", gap: 7, marginTop: 10 }}>
                {alliance ? (
                  <button className="action-button" onClick={() => cancelTreaty(country.id, "alliance")}>
                    <CheckCircle2 size={15} /> Zrušit spojenectví
                  </button>
                ) : (
                  <button
                    className="action-button"
                    disabled={atWar || relation < 50}
                    onClick={() => signTreaty(country.id, "alliance")}
                  >
                    <Users size={15} /> Spojenectví · 250 zl.
                  </button>
                )}

                {pact ? (
                  <button className="action-button" onClick={() => cancelTreaty(country.id, "pact")}>
                    <Ban size={15} /> Zrušit pakt
                  </button>
                ) : (
                  <button
                    className="action-button"
                    disabled={atWar || relation < 15}
                    onClick={() => signTreaty(country.id, "pact")}
                  >
                    <Shield size={15} /> Pakt · 120 zl.
                  </button>
                )}

                {trade ? (
                  <button className="action-button" onClick={() => cancelTreaty(country.id, "trade")}>
                    <Ban size={15} /> Zrušit obchod
                  </button>
                ) : (
                  <button
                    className="action-button"
                    disabled={atWar || relation < -10}
                    onClick={() => signTreaty(country.id, "trade")}
                  >
                    <Coins size={15} /> Obchod · 100 zl.
                  </button>
                )}
              </div>

              <div className="muted" style={{ marginTop: 8 }}>
                {alliance && "Aktivní spojenectví · "}
                {pact && "Pakt o neútočení · "}
                {trade && "Obchodní dohoda · "}
                {!alliance && !pact && !trade && "Žádná aktivní smlouva"}
              </div>
            </div>
          );
        })}

        {renderWarSection()}
        {renderAiOverview()}
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
                onSelectProvince={id => updateSave({ selectedProvince: id })}
                armyLocations={save.armyLocations}
                armyCounts={armyCounts}
              />
              {renderArmyMovement()}
              {renderProvinceManagement()}
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
              <p>Vládce: <strong>{player.ruler}</strong></p>
              <p>Rok vlády: <strong>{save.year}</strong></p>

              <div className="stat-card">
                <Building2 /><span>Počet provincií</span>
                <strong>{ownedProvinces.length}</strong>
              </div>
              <div className="stat-card">
                <Shield /><span>Velikost armády</span>
                <strong>{playerArmy.toLocaleString("cs-CZ")}</strong>
              </div>
              <div className="stat-card">
                <MapPin /><span>Pozice armády</span>
                <strong>{armyLocationProvince?.name ?? "Neznámá"}</strong>
              </div>
              <div className="stat-card">
                <AlertTriangle /><span>Provincie s nepokoji</span>
                <strong>
                  {ownedProvinces.filter(p => (save.unrest[p.id] ?? 0) >= 50).length}
                </strong>
              </div>
            </section>
            {renderAiOverview()}
          </>
        );

      case "diplomacy":
        return renderDiplomacy();

      case "economy":
        return renderEconomy();

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
        <button className="toolbar-button" onClick={returnToCountrySelection}>
          <ArrowLeft size={17} /><span>Výběr státu</span>
        </button>
        <button
          className="fullscreen-button"
          onClick={toggleFullscreen}
          title="Celá obrazovka"
          aria-label="Přepnout celou obrazovku"
        >
          {isFullscreen ? <Minimize2 size={19} /> : <Maximize2 size={19} />}
          <span>{isFullscreen ? "Zpět" : "Celá obrazovka"}</span>
        </button>
      </div>

      {fullscreenMessage && (
        <p className="fullscreen-message">{fullscreenMessage}</p>
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
        <span className="mode-label">VERZE 0.8.0</span>
      </div>

      <div className="game-content">{renderContent()}</div>

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
        <span>Vývojová verze 0.8.0</span>
      </footer>
    </main>
  );
}
