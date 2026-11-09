import { useState } from "react";
import type { Province } from "../data/scenarios";

type Props = {
  provinces: Province[];
  countryColors: Record<string, string>;
  selectedProvince: string;
  onSelectProvince: (id: string) => void;
};

const shapes: Record<string, string> = {
  prague: "M170 145 L250 125 L285 175 L250 235 L165 220 L135 175 Z",
  moravia: "M285 175 L365 155 L410 205 L365 275 L275 255 L250 235 Z",
  silesia: "M250 125 L330 80 L405 110 L365 155 L285 175 Z"
};

const positions: Record<string, { x: number; y: number }> = {
  prague: { x: 205, y: 185 },
  moravia: { x: 330, y: 220 },
  silesia: { x: 320, y: 135 }
};

export default function EuropeMap({
  provinces,
  countryColors,
  selectedProvince,
  onSelectProvince
}: Props) {
  const [zoom, setZoom] = useState(1);

  return (
    <section className="map-panel">
      <div className="map-topline">
        <div>
          <span className="eyebrow">STRATEGICKÁ MAPA</span>
          <h2>Střední Evropa</h2>
        </div>

        <div className="map-controls">
          <button
            aria-label="Oddálit mapu"
            onClick={() => setZoom(v => Math.max(0.8, v - 0.1))}
          >
            −
          </button>
          <button
            aria-label="Přiblížit mapu"
            onClick={() => setZoom(v => Math.min(1.5, v + 0.1))}
          >
            +
          </button>
        </div>
      </div>

      <div className="map-viewport">
        <svg
          viewBox="0 0 600 390"
          role="img"
          aria-label="Schematická strategická mapa provincií"
          style={{
            transform: `scale(${zoom})`,
            touchAction: "pan-x pan-y"
          }}
        >
          <defs>
            <pattern
              id="terrain"
              width="18"
              height="18"
              patternUnits="userSpaceOnUse"
            >
              <path
                d="M0 18 L18 0"
                stroke="#a98b5e"
                strokeWidth="0.5"
                opacity="0.22"
              />
            </pattern>
          </defs>

          <rect
            width="600"
            height="390"
            fill="#b6a47c"
          />

          <rect
            width="600"
            height="390"
            fill="url(#terrain)"
          />

          <path
            d="M30 60 Q130 20 210 65 T390 55 T570 90"
            fill="none"
            stroke="#738b78"
            strokeWidth="22"
            opacity="0.3"
          />

          <path
            d="M30 315 Q170 275 260 325 T570 300"
            fill="none"
            stroke="#738b78"
            strokeWidth="28"
            opacity="0.25"
          />

          {provinces.map(province => {
            const path = shapes[province.id];
            if (!path) return null;

            const active = selectedProvince === province.id;

            return (
              <g
                key={province.id}
                onClick={() => onSelectProvince(province.id)}
                onTouchStart={() => onSelectProvince(province.id)}
                style={{ cursor: "pointer" }}
              >
                <path
                  d={path}
                  fill={countryColors[province.owner] ?? "#777"}
                  stroke={active ? "#fff0b5" : "#493d2d"}
                  strokeWidth={active ? 5 : 2}
                  opacity={active ? 1 : 0.85}
                />

                {positions[province.id] && (
                  <text
                    x={positions[province.id].x}
                    y={positions[province.id].y}
                    textAnchor="middle"
                    fontSize="14"
                    fontWeight="bold"
                    fill="#fff4d5"
                    stroke="#34291c"
                    strokeWidth="2.5"
                    paintOrder="stroke"
                    pointerEvents="none"
                  >
                    {province.name}
                  </text>
                )}
              </g>
            );
          })}

          <text
            x="55"
            y="55"
            fontSize="13"
            fill="#5b503c"
            letterSpacing="3"
          >
            ZÁPAD
          </text>

          <text
            x="465"
            y="350"
            fontSize="13"
            fill="#5b503c"
            letterSpacing="3"
          >
            VÝCHOD
          </text>
        </svg>
      </div>

      <div className="map-legend">
        <span><i style={{ background: "#a33d32" }} /> České knížectví</span>
        <span><i style={{ background: "#c39b48" }} /> Říše</span>
        <span><i style={{ background: "#547b50" }} /> Polsko</span>
      </div>
    </section>
  );
}
