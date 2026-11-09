
import { useRef, useState } from "react";
import type { PointerEvent, WheelEvent } from "react";
import type { Province } from "../data/scenarios";

type Props = {
  provinces: Province[];
  countryColors: Record<string, string>;
  selectedProvince: string;
  onSelectProvince: (id: string) => void;
};

const provinceShapes: Record<string, string> = {
  prague:
    "M475 330 L515 305 L560 318 L575 350 L550 385 L500 380 L470 355 Z",

  moravia:
    "M575 350 L625 330 L670 355 L665 395 L620 420 L565 395 L550 385 Z",

  silesia:
    "M515 305 L550 270 L610 270 L645 300 L625 330 L575 350 L560 318 Z"
};

const provincePositions: Record<
  string,
  { x: number; y: number }
> = {
  prague: { x: 520, y: 350 },
  moravia: { x: 615, y: 385 },
  silesia: { x: 575, y: 310 }
};

const countryLabels = [
  { name: "ANGLIE", x: 255, y: 275 },
  { name: "FRANCIE", x: 365, y: 425 },
  { name: "SVATÁ ŘÍŠE", x: 490, y: 250 },
  { name: "POLSKO", x: 670, y: 275 },
  { name: "UHERSKO", x: 700, y: 465 },
  { name: "ITALIE", x: 510, y: 550 },
  { name: "BYZANC", x: 850, y: 570 },
  { name: "SKANDINÁVIE", x: 620, y: 105 }
];

export default function EuropeMap({
  provinces,
  countryColors,
  selectedProvince,
  onSelectProvince
}: Props) {
  const [zoom, setZoom] = useState(1);
  const [offset, setOffset] = useState({ x: 0, y: 0 });

  const dragRef = useRef<{
    pointerId: number;
    x: number;
    y: number;
    startX: number;
    startY: number;
    moved: boolean;
  } | null>(null);

  function zoomIn() {
    setZoom(value => Math.min(2.5, value + 0.15));
  }

  function zoomOut() {
    setZoom(value => Math.max(0.75, value - 0.15));
  }

  function resetMap() {
    setZoom(1);
    setOffset({ x: 0, y: 0 });
  }

  function handlePointerDown(event: PointerEvent<HTMLDivElement>) {
    if (event.button !== 0 && event.pointerType === "mouse") return;

    event.currentTarget.setPointerCapture(event.pointerId);

    dragRef.current = {
      pointerId: event.pointerId,
      x: event.clientX,
      y: event.clientY,
      startX: offset.x,
      startY: offset.y,
      moved: false
    };
  }

  function handlePointerMove(event: PointerEvent<HTMLDivElement>) {
    const drag = dragRef.current;

    if (!drag || drag.pointerId !== event.pointerId) return;

    const deltaX = event.clientX - drag.x;
    const deltaY = event.clientY - drag.y;

    if (Math.abs(deltaX) > 4 || Math.abs(deltaY) > 4) {
      drag.moved = true;
    }

    setOffset({
      x: drag.startX + deltaX,
      y: drag.startY + deltaY
    });
  }

  function handlePointerUp(event: PointerEvent<HTMLDivElement>) {
    if (dragRef.current?.pointerId !== event.pointerId) return;

    dragRef.current = null;
  }

  function handleWheel(event: WheelEvent<HTMLDivElement>) {
    event.preventDefault();

    setZoom(value =>
      Math.min(
        2.5,
        Math.max(0.75, value + (event.deltaY < 0 ? 0.1 : -0.1))
      )
    );
  }

  const owners = Array.from(
    new Set(provinces.map(province => province.owner))
  );

  return (
    <section className="map-panel">
      <div className="map-topline">
        <div>
          <span className="eyebrow">STRATEGICKÁ MAPA</span>
          <h2>Evropa</h2>
        </div>

        <div className="map-controls">
          <button
            aria-label="Oddálit mapu"
            onClick={zoomOut}
            type="button"
          >
            −
          </button>

          <button
            aria-label="Přiblížit mapu"
            onClick={zoomIn}
            type="button"
          >
            +
          </button>

          <button
            aria-label="Obnovit mapu"
            onClick={resetMap}
            type="button"
          >
            ↺
          </button>
        </div>
      </div>

      <div
        className="map-viewport"
        onPointerDown={handlePointerDown}
        onPointerMove={handlePointerMove}
        onPointerUp={handlePointerUp}
        onPointerCancel={handlePointerUp}
        onWheel={handleWheel}
        style={{
          overflow: "hidden",
          position: "relative",
          cursor: "grab",
          touchAction: "none",
          userSelect: "none"
        }}
      >
        <svg
          viewBox="0 0 1000 700"
          role="img"
          aria-label="Strategická mapa Evropy"
          style={{
            display: "block",
            width: "100%",
            minWidth: "100%",
            height: "auto",
            transform: `translate(${offset.x}px, ${offset.y}px) scale(${zoom})`,
            transformOrigin: "center center",
            pointerEvents: "none"
          }}
        >
          <defs>
            <pattern
              id="mapTerrain"
              width="24"
              height="24"
              patternUnits="userSpaceOnUse"
            >
              <path
                d="M0 24 L24 0"
                stroke="#c4b18a"
                strokeWidth="0.8"
                opacity="0.2"
              />
              <circle
                cx="12"
                cy="12"
                r="1"
                fill="#8e7954"
                opacity="0.2"
              />
            </pattern>

            <pattern
              id="mountainPattern"
              width="35"
              height="28"
              patternUnits="userSpaceOnUse"
            >
              <path
                d="M2 25 L13 5 L24 25 Z"
                fill="#87775c"
                opacity="0.35"
                stroke="#695a43"
                strokeWidth="1"
              />
            </pattern>

            <filter id="mapShadow">
              <feDropShadow
                dx="2"
                dy="3"
                stdDeviation="3"
                floodColor="#34291c"
                floodOpacity="0.35"
              />
            </filter>
          </defs>

          {/* Moře */}
          <rect
            width="1000"
            height="700"
            fill="#8da5a0"
          />

          <rect
            width="1000"
            height="700"
            fill="#a8b8aa"
            opacity="0.2"
          />

          <g
            fill="none"
            stroke="#d4ded0"
            strokeWidth="2"
            opacity="0.4"
          >
            <path d="M0 150 Q250 180 400 130 T800 150" />
            <path d="M0 500 Q300 470 500 520 T1000 490" />
            <path d="M100 0 Q130 180 90 350 T130 700" />
          </g>

          {/* Pevnina Evropy */}
          <g
            filter="url(#mapShadow)"
            stroke="#65573f"
            strokeWidth="3"
            strokeLinejoin="round"
          >
            {/* Britské ostrovy */}
            <path
              d="M180 205 L215 175 L245 185 L260 225 L245 260 L225 275 L205 255 L185 245 Z"
              fill="#b7a47b"
            />
            <path
              d="M155 145 L170 125 L185 145 L178 175 L160 180 Z"
              fill="#b7a47b"
            />
            <path
              d="M255 245 L275 255 L270 280 L250 275 Z"
              fill="#b7a47b"
            />

            {/* Pyrenejský poloostrov */}
            <path
              d="M205 395 L260 370 L330 380 L370 420 L350 480 L305 510 L245 490 L205 450 Z"
              fill="#b5a17a"
            />

            {/* Francie */}
            <path
              d="M285 285 L355 270 L415 300 L445 350 L410 410 L365 430 L330 395 L280 375 L260 330 Z"
              fill="#b7a47b"
            />

            {/* Benelux a západní Německo */}
            <path
              d="M385 245 L445 235 L480 270 L475 320 L435 335 L405 305 Z"
              fill="#b7a47b"
            />

            {/* Skandinávie */}
            <path
              d="M465 25 L510 35 L540 75 L525 125 L500 170 L475 205 L445 190 L455 140 L435 100 Z"
              fill="#b7a47b"
            />
            <path
              d="M535 35 L575 20 L620 35 L635 75 L615 115 L575 105 L545 75 Z"
              fill="#b7a47b"
            />

            {/* Německo a střední Evropa */}
            <path
              d="M435 255 L490 225 L555 240 L595 280 L585 330 L550 355 L505 340 L475 320 L435 335 L405 305 Z"
              fill="#c4ae7e"
            />

            {/* Polsko */}
            <path
              d="M555 240 L625 220 L700 245 L730 295 L690 345 L645 350 L595 330 L585 280 Z"
              fill="#b5a17a"
            />

            {/* Východní Evropa */}
            <path
              d="M700 245 L785 215 L875 250 L930 315 L900 390 L835 420 L760 385 L690 345 L730 295 Z"
              fill="#b9a77f"
            />

            {/* Apeninský poloostrov */}
            <path
              d="M420 420 L465 415 L490 455 L505 495 L485 535 L500 575 L475 605 L455 560 L435 525 L415 485 L395 455 Z"
              fill="#b6a27a"
            />

            {/* Balkán */}
            <path
              d="M565 395 L625 365 L690 370 L750 405 L770 455 L730 500 L680 490 L645 455 L600 445 Z"
              fill="#b5a17a"
            />

            {/* Řecko */}
            <path
              d="M710 485 L750 485 L770 515 L755 555 L730 545 L715 520 Z"
              fill="#b6a27a"
            />

            {/* Malá Asie */}
            <path
              d="M770 510 L850 485 L930 510 L955 560 L900 595 L825 575 L780 545 Z"
              fill="#b6a27a"
            />

            {/* Island */}
            <path
              d="M80 90 L120 65 L155 90 L145 125 L100 130 Z"
              fill="#b7a47b"
            />
          </g>

          {/* Textura pevniny */}
          <g opacity="0.55">
            <path
              d="M180 205 L215 175 L245 185 L260 225 L245 260 L225 275 L205 255 L185 245 Z"
              fill="url(#mapTerrain)"
            />
            <path
              d="M205 395 L260 370 L330 380 L370 420 L350 480 L305 510 L245 490 L205 450 Z"
              fill="url(#mapTerrain)"
            />
            <path
              d="M285 285 L355 270 L415 300 L445 350 L410 410 L365 430 L330 395 L280 375 L260 330 Z"
              fill="url(#mapTerrain)"
            />
            <path
              d="M435 255 L490 225 L555 240 L595 280 L585 330 L550 355 L505 340 L475 320 L435 335 L405 305 Z"
              fill="url(#mapTerrain)"
            />
            <path
              d="M555 240 L625 220 L700 245 L730 295 L690 345 L645 350 L595 330 L585 280 Z"
              fill="url(#mapTerrain)"
            />
          </g>

          {/* Horské oblasti */}
          <g opacity="0.8">
            <path
              d="M270 350 Q350 340 420 390"
              fill="none"
              stroke="url(#mountainPattern)"
              strokeWidth="35"
            />
            <path
              d="M435 410 Q520 395 610 420"
              fill="none"
              stroke="url(#mountainPattern)"
              strokeWidth="28"
            />
            <path
              d="M520 180 Q610 170 680 210"
              fill="none"
              stroke="url(#mountainPattern)"
              strokeWidth="20"
            />
          </g>

          {/* Velké řeky */}
          <g
            fill="none"
            stroke="#668d91"
            strokeWidth="3"
            opacity="0.8"
          >
            <path d="M470 300 Q450 330 470 360 T490 420" />
            <path d="M555 320 Q575 350 560 390 T580 440" />
            <path d="M600 275 Q640 300 660 340" />
          </g>

          {/* Popisky států */}
          <g
            fill="#5d4a32"
            fontSize="19"
            fontWeight="bold"
            letterSpacing="2"
            textAnchor="middle"
            opacity="0.8"
            style={{ pointerEvents: "none" }}
          >
            {countryLabels.map(label => (
              <text
                key={label.name}
                x={label.x}
                y={label.y}
              >
                {label.name}
              </text>
            ))}
          </g>

          {/* Herní provincie */}
          {provinces.map(province => {
            const shape = provinceShapes[province.id];

            if (!shape) return null;

            const active = selectedProvince === province.id;

            return (
              <g
                key={province.id}
                style={{ pointerEvents: "auto", cursor: "pointer" }}
                onClick={() => {
                  if (!dragRef.current?.moved) {
                    onSelectProvince(province.id);
                  }
                }}
              >
                <path
                  d={shape}
                  fill={countryColors[province.owner] ?? "#777777"}
                  stroke={active ? "#fff1bd" : "#51422e"}
                  strokeWidth={active ? 6 : 3}
                  opacity={active ? 1 : 0.92}
                />

                <path
                  d={shape}
                  fill="url(#mapTerrain)"
                  opacity="0.25"
                  pointerEvents="none"
                />

                {provincePositions[province.id] && (
                  <text
                    x={provincePositions[province.id].x}
                    y={provincePositions[province.id].y}
                    textAnchor="middle"
                    fontSize="16"
                    fontWeight="bold"
                    fill="#fff4d7"
                    stroke="#34291c"
                    strokeWidth="3"
                    paintOrder="stroke"
                    pointerEvents="none"
                  >
                    {province.name}
                  </text>
                )}

                {active && provincePositions[province.id] && (
                  <circle
                    cx={provincePositions[province.id].x}
                    cy={provincePositions[province.id].y + 10}
                    r="4"
                    fill="#fff1bd"
                    pointerEvents="none"
                  />
                )}
              </g>
            );
          })}

          {/* Kompas */}
          <g transform="translate(910 100)">
            <circle
              r="38"
              fill="#d8c69d"
              stroke="#6e593b"
              strokeWidth="2"
              opacity="0.9"
            />
            <path
              d="M0 -28 L9 0 L0 28 L-9 0 Z"
              fill="#6f4932"
            />
            <path
              d="M0 -28 L0 28 L-9 0 Z"
              fill="#eee0bd"
            />
            <text
              x="0"
              y="-46"
              textAnchor="middle"
              fontSize="14"
              fontWeight="bold"
              fill="#493923"
            >
              S
            </text>
          </g>

          {/* Dekorativní označení moří */}
          <g
            fill="#e0e7d9"
            fontSize="17"
            fontStyle="italic"
            letterSpacing="3"
            opacity="0.9"
          >
            <text x="330" y="185">SEVERNÍ MOŘE</text>
            <text x="70" y="350">ATLANTIK</text>
            <text x="610" y="625">STŘEDOZEMNÍ MOŘE</text>
            <text x="830" y="185">VÝCHODNÍ EVROPA</text>
          </g>

          {/* Rámeček mapy */}
          <rect
            x="5"
            y="5"
            width="990"
            height="690"
            fill="none"
            stroke="#69573b"
            strokeWidth="5"
            opacity="0.7"
          />
        </svg>
      </div>

      <div className="map-legend">
        {owners.map(owner => (
          <span key={owner}>
            <i
              style={{
                background: countryColors[owner] ?? "#777"
              }}
            />
            {owner === "bohemia"
              ? "České knížectví"
              : owner === "germany"
                ? "Svatá říše římská"
                : owner === "poland"
                  ? "Polsko"
                  : owner}
          </span>
        ))}
      </div>

      <div
        style={{
          padding: "8px 12px",
          fontSize: "12px",
          opacity: 0.7,
          textAlign: "center"
        }}
      >
        Přibližování: tlačítka nebo kolečko myši · Posouvání: tažením prstem
      </div>
    </section>
  );
}
