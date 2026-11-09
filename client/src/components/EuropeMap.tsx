
import { useRef, useState } from "react";
import type { PointerEvent, WheelEvent } from "react";
import type { Province } from "../data/scenarios";

type Props = {
  provinces: Province[];
  countryColors: Record<string, string>;
  selectedProvince: string;
  onSelectProvince: (id: string) => void;
  armyLocations: Record<string, string>;
  armyCounts: Record<string, number>;
};

const shapes: Record<string, string> = {
  london: "M175 245 L225 225 L260 250 L250 295 L205 310 L175 280 Z",
  normandy: "M260 315 L310 300 L345 335 L330 380 L285 385 L250 350 Z",
  paris: "M330 385 L380 365 L415 395 L400 445 L355 455 L325 425 Z",
  jutland: "M520 145 L550 125 L575 155 L560 205 L535 210 L515 180 Z",
  saxony: "M445 255 L500 230 L545 255 L540 305 L495 330 L450 310 Z",
  bavaria: "M430 345 L480 325 L530 345 L535 390 L490 425 L440 405 Z",
  prague: "M500 325 L545 310 L580 335 L570 375 L530 390 L495 365 Z",
  moravia: "M570 375 L610 350 L655 375 L650 420 L610 440 L570 415 Z",
  silesia: "M545 305 L590 285 L630 310 L610 350 L570 375 L545 345 Z",
  greater_poland: "M610 265 L665 245 L705 275 L690 325 L650 345 L610 310 Z",
  pest: "M650 445 L705 425 L750 455 L740 505 L690 520 L650 485 Z",
  constantinople: "M820 535 L875 515 L915 545 L900 590 L850 605 L815 575 Z"
};

const positions: Record<string, { x: number; y: number }> = {
  london: { x: 215, y: 270 },
  normandy: { x: 295, y: 350 },
  paris: { x: 370, y: 415 },
  jutland: { x: 545, y: 175 },
  saxony: { x: 495, y: 285 },
  bavaria: { x: 485, y: 385 },
  prague: { x: 535, y: 355 },
  moravia: { x: 615, y: 405 },
  silesia: { x: 575, y: 330 },
  greater_poland: { x: 655, y: 295 },
  pest: { x: 700, y: 475 },
  constantinople: { x: 865, y: 565 }
};

const countryNames: Record<string, string> = {
  bohemia: "České knížectví",
  germany: "Svatá říše římská",
  poland: "Polsko",
  england: "Anglie",
  france: "Francie",
  denmark: "Dánsko",
  hungary: "Uhersko",
  byzantium: "Byzantská říše"
};

export default function EuropeMap({
  provinces,
  countryColors,
  selectedProvince,
  onSelectProvince,
  armyLocations,
  armyCounts
}: Props) {
  const [zoom, setZoom] = useState(1);
  const [offset, setOffset] = useState({ x: 0, y: 0 });
  const suppressClickRef = useRef(false);

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

    suppressClickRef.current = false;

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
      suppressClickRef.current = true;
    }

    if (drag.moved) {
      setOffset({
        x: drag.startX + deltaX,
        y: drag.startY + deltaY
      });
    }
  }

  function handlePointerUp(event: PointerEvent<HTMLDivElement>) {
    const drag = dragRef.current;

    if (!drag || drag.pointerId !== event.pointerId) return;

    if (drag.moved) {
      suppressClickRef.current = true;
    }

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

  function selectProvince(id: string) {
    if (suppressClickRef.current) {
      suppressClickRef.current = false;
      return;
    }

    onSelectProvince(id);
  }

  const owners = Array.from(
    new Set(provinces.map(province => province.owner))
  );

  const armiesOnMap = Object.entries(armyLocations)
    .map(([countryId, provinceId]) => {
      const province = provinces.find(
        item => item.id === provinceId
      );

      const position = positions[provinceId];

      if (!province || !position) return null;

      return {
        countryId,
        provinceId,
        position,
        count: armyCounts[countryId] ?? 0,
        color: countryColors[countryId] ?? "#777"
      };
    })
    .filter(
      (army): army is NonNullable<typeof army> =>
        army !== null && army.count > 0
    );

  return (
    <section className="map-panel">
      <div className="map-topline">
        <div>
          <span className="eyebrow">STRATEGICKÁ MAPA</span>
          <h2>Evropa</h2>
        </div>

        <div className="map-controls">
          <button type="button" onClick={zoomOut} aria-label="Oddálit mapu">
            −
          </button>
          <button type="button" onClick={zoomIn} aria-label="Přiblížit mapu">
            +
          </button>
          <button type="button" onClick={resetMap} aria-label="Obnovit mapu">
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
          aria-label="Strategická mapa Evropy s provinciemi a armádami"
          style={{
            display: "block",
            width: "100%",
            height: "auto",
            transform: `translate(${offset.x}px, ${offset.y}px) scale(${zoom})`,
            transformOrigin: "center center"
          }}
        >
          <defs>
            <pattern
              id="mapTerrain"
              width="22"
              height="22"
              patternUnits="userSpaceOnUse"
            >
              <path
                d="M0 22 L22 0"
                stroke="#a98b5e"
                strokeWidth="0.7"
                opacity="0.25"
              />
            </pattern>
          </defs>

          <rect width="1000" height="700" fill="#8da5a0" />

          <g
            fill="#b7a47b"
            stroke="#65573f"
            strokeWidth="3"
            strokeLinejoin="round"
          >
            <path d="M80 90 L120 65 L155 90 L145 125 L100 130 Z" />
            <path d="M180 205 L215 175 L245 185 L260 225 L245 260 L225 275 L205 255 L185 245 Z" />
            <path d="M205 395 L260 370 L330 380 L370 420 L350 480 L305 510 L245 490 L205 450 Z" />
            <path d="M285 285 L355 270 L415 300 L445 350 L410 410 L365 430 L330 395 L280 375 L260 330 Z" />
            <path d="M385 245 L445 235 L480 270 L475 320 L435 335 L405 305 Z" />
            <path d="M435 255 L490 225 L555 240 L595 280 L585 330 L550 355 L505 340 L475 320 L435 335 L405 305 Z" />
            <path d="M555 240 L625 220 L700 245 L730 295 L690 345 L645 350 L595 330 L585 280 Z" />
            <path d="M700 245 L785 215 L875 250 L930 315 L900 390 L835 420 L760 385 L690 345 L730 295 Z" />
            <path d="M465 25 L510 35 L540 75 L525 125 L500 170 L475 205 L445 190 L455 140 L435 100 Z" />
            <path d="M535 35 L575 20 L620 35 L635 75 L615 115 L575 105 L545 75 Z" />
            <path d="M420 420 L465 415 L490 455 L505 495 L485 535 L500 575 L475 605 L455 560 L435 525 L415 485 L395 455 Z" />
            <path d="M565 395 L625 365 L690 370 L750 405 L770 455 L730 500 L680 490 L645 455 L600 445 Z" />
            <path d="M710 485 L750 485 L770 515 L755 555 L730 545 L715 520 Z" />
            <path d="M770 510 L850 485 L930 510 L955 560 L900 595 L825 575 L780 545 Z" />
          </g>

          <rect
            width="1000"
            height="700"
            fill="url(#mapTerrain)"
            opacity="0.55"
            pointerEvents="none"
          />

          <g
            fill="none"
            stroke="#87775c"
            strokeWidth="18"
            strokeDasharray="5 9"
            opacity="0.55"
            pointerEvents="none"
          >
            <path d="M270 350 Q350 340 420 390" />
            <path d="M435 410 Q520 395 610 420" />
            <path d="M520 180 Q610 170 680 210" />
          </g>

          <g
            fill="none"
            stroke="#668d91"
            strokeWidth="3"
            opacity="0.8"
            pointerEvents="none"
          >
            <path d="M470 300 Q450 330 470 360 T490 420" />
            <path d="M555 320 Q575 350 560 390 T580 440" />
            <path d="M600 275 Q640 300 660 340" />
          </g>

          <g
            fill="#5d4a32"
            fontSize="19"
            fontWeight="bold"
            letterSpacing="2"
            textAnchor="middle"
            opacity="0.8"
            pointerEvents="none"
          >
            <text x="220" y="195">BRITÁNIE</text>
            <text x="330" y="470">FRANCIE</text>
            <text x="510" y="225">NĚMECKO</text>
            <text x="680" y="230">POLSKO</text>
            <text x="700" y="550">BALKÁN</text>
            <text x="530" y="90">SKANDINÁVIE</text>
          </g>

          {/* Provincie */}
          {provinces.map(province => {
            const shape = shapes[province.id];

            if (!shape) return null;

            const active = selectedProvince === province.id;
            const position = positions[province.id];

            return (
              <g
                key={province.id}
                onClick={() => selectProvince(province.id)}
                style={{ cursor: "pointer" }}
              >
                <path
                  d={shape}
                  fill={countryColors[province.owner] ?? "#777"}
                  stroke={active ? "#fff1bd" : "#51422e"}
                  strokeWidth={active ? 6 : 3}
                  opacity={active ? 1 : 0.92}
                />

                <path
                  d={shape}
                  fill="url(#mapTerrain)"
                  opacity="0.3"
                  pointerEvents="none"
                />

                {position && (
                  <text
                    x={position.x}
                    y={position.y}
                    textAnchor="middle"
                    fontSize="14"
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
              </g>
            );
          })}

          {/* Armády */}
          <g pointerEvents="none">
            {armiesOnMap.map(army => (
              <g
                key={army.countryId}
                transform={`translate(${army.position.x + 20} ${army.position.y - 25})`}
              >
                <circle
                  r="18"
                  fill="#2c241b"
                  stroke="#e7d3a4"
                  strokeWidth="2.5"
                />
                <circle
                  r="14"
                  fill={army.color}
                  stroke="#fff0c9"
                  strokeWidth="1"
                />
                <path
                  d="M0 -9 L7 -5 L6 5 L0 10 L-6 5 L-7 -5 Z"
                  fill="#f4e6c3"
                  stroke="#392b1d"
                  strokeWidth="1"
                />
                <text
                  x="0"
                  y="29"
                  textAnchor="middle"
                  fontSize="12"
                  fontWeight="bold"
                  fill="#fff4d7"
                  stroke="#34291c"
                  strokeWidth="3"
                  paintOrder="stroke"
                >
                  {army.count.toLocaleString("cs-CZ")}
                </text>
              </g>
            ))}
          </g>

          {/* Kompas */}
          <g transform="translate(910 100)" pointerEvents="none">
            <circle
              r="38"
              fill="#d8c69d"
              stroke="#6e593b"
              strokeWidth="2"
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

          <g
            fill="#e0e7d9"
            fontSize="16"
            fontStyle="italic"
            letterSpacing="3"
            opacity="0.9"
            pointerEvents="none"
          >
            <text x="330" y="185">SEVERNÍ MOŘE</text>
            <text x="65" y="350">ATLANTIK</text>
            <text x="610" y="625">STŘEDOZEMNÍ MOŘE</text>
          </g>

          <rect
            x="5"
            y="5"
            width="990"
            height="690"
            fill="none"
            stroke="#69573b"
            strokeWidth="5"
            opacity="0.7"
            pointerEvents="none"
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
            {countryNames[owner] ?? owner}
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
