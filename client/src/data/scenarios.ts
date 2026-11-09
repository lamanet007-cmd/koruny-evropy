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
        poland: 10
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
        poland: 0
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
        germany: 0
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
      neighbors: ["moravia", "silesia"]
    },
    {
      id: "moravia",
      name: "Morava",
      owner: "bohemia",
      population: 65000,
      development: 3,
      tax: 9,
      neighbors: ["prague", "silesia"]
    },
    {
      id: "silesia",
      name: "Slezsko",
      owner: "poland",
      population: 55000,
      development: 2,
      tax: 7,
      neighbors: ["prague", "moravia"]
    }
  ]
};
