
export type Country = {
  id: string;
  name: string;
  ruler: string;
  treasury: number;
  income: number;
  army: number;
  color: string;
  relations: Record<string, number>;
};

export type Province = {
  id: string;
  name: string;
  owner: string;
  population: number;
  development: number;
  tax: number;
  neighbors: string[];
};

export type Scenario = {
  id: string;
  name: string;
  year: number;
  mode: "historical" | "alternate";
  countries: Country[];
  provinces: Province[];
};

export const scenario1066: Scenario = {
  id: "europe-1066",
  name: "Evropa v roce 1066",
  year: 1066,
  mode: "historical",

  countries: [
    {
      id: "bohemia",
      name: "České knížectví",
      ruler: "Vratislav II.",
      treasury: 1200,
      income: 45,
      army: 4500,
      color: "#a33d32",
      relations: {
        germany: 25,
        poland: 10,
        hungary: 15
      }
    },
    {
      id: "germany",
      name: "Svatá říše římská",
      ruler: "Jindřich IV.",
      treasury: 5000,
      income: 120,
      army: 18000,
      color: "#c39b48",
      relations: {
        bohemia: 25,
        poland: 0,
        france: 10,
        denmark: 15,
        hungary: 10
      }
    },
    {
      id: "poland",
      name: "Polské knížectví",
      ruler: "Boleslav II.",
      treasury: 1800,
      income: 55,
      army: 6000,
      color: "#547b50",
      relations: {
        bohemia: 10,
        germany: 0,
        hungary: 20
      }
    },
    {
      id: "england",
      name: "Anglické království",
      ruler: "Vilém I. Dobyvatel",
      treasury: 2600,
      income: 75,
      army: 10000,
      color: "#557b9c",
      relations: {
        france: 10,
        germany: 5,
        denmark: 0
      }
    },
    {
      id: "france",
      name: "Francouzské království",
      ruler: "Filip I.",
      treasury: 3200,
      income: 95,
      army: 12000,
      color: "#5476a6",
      relations: {
        england: 10,
        germany: 10
      }
    },
    {
      id: "denmark",
      name: "Dánské království",
      ruler: "Sven II.",
      treasury: 1400,
      income: 40,
      army: 5000,
      color: "#a75d43",
      relations: {
        germany: 15,
        england: 0
      }
    },
    {
      id: "hungary",
      name: "Uherské království",
      ruler: "Šalamoun",
      treasury: 1900,
      income: 60,
      army: 7500,
      color: "#9b7a42",
      relations: {
        bohemia: 15,
        poland: 20,
        germany: 10
      }
    },
    {
      id: "byzantium",
      name: "Byzantská říše",
      ruler: "Konstantin X. Dukas",
      treasury: 6000,
      income: 150,
      army: 22000,
      color: "#80619b",
      relations: {
        hungary: 0,
        poland: 0
      }
    }
  ],

  provinces: [
    {
      id: "prague",
      name: "Praha",
      owner: "bohemia",
      population: 85000,
      development: 4,
      tax: 12,
      neighbors: ["moravia", "silesia", "bavaria", "saxony"]
    },
    {
      id: "moravia",
      name: "Morava",
      owner: "bohemia",
      population: 65000,
      development: 3,
      tax: 9,
      neighbors: ["prague", "silesia", "pest"]
    },
    {
      id: "silesia",
      name: "Slezsko",
      owner: "poland",
      population: 55000,
      development: 2,
      tax: 7,
      neighbors: ["prague", "moravia", "greater_poland"]
    },
    {
      id: "saxony",
      name: "Sasko",
      owner: "germany",
      population: 90000,
      development: 4,
      tax: 11,
      neighbors: ["prague", "bavaria", "jutland", "greater_poland"]
    },
    {
      id: "bavaria",
      name: "Bavorsko",
      owner: "germany",
      population: 110000,
      development: 4,
      tax: 14,
      neighbors: ["prague", "saxony", "paris", "pest"]
    },
    {
      id: "greater_poland",
      name: "Velkopolsko",
      owner: "poland",
      population: 75000,
      development: 3,
      tax: 10,
      neighbors: ["silesia", "saxony"]
    },
    {
      id: "london",
      name: "Londýn",
      owner: "england",
      population: 95000,
      development: 5,
      tax: 16,
      neighbors: ["normandy"]
    },
    {
      id: "paris",
      name: "Paříž",
      owner: "france",
      population: 130000,
      development: 5,
      tax: 18,
      neighbors: ["normandy", "bavaria"]
    },
    {
      id: "normandy",
      name: "Normandie",
      owner: "france",
      population: 80000,
      development: 4,
      tax: 12,
      neighbors: ["london", "paris"]
    },
    {
      id: "jutland",
      name: "Jutsko",
      owner: "denmark",
      population: 60000,
      development: 3,
      tax: 8,
      neighbors: ["saxony"]
    },
    {
      id: "pest",
      name: "Pešť",
      owner: "hungary",
      population: 70000,
      development: 3,
      tax: 10,
      neighbors: ["moravia", "bavaria", "constantinople"]
    },
    {
      id: "constantinople",
      name: "Konstantinopol",
      owner: "byzantium",
      population: 250000,
      development: 7,
      tax: 25,
      neighbors: ["pest"]
    }
  ]
};
