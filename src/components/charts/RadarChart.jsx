// Хамааралгүй, жижиг SVG радар chart (chart сан ашиглаагүй).
// Өнгийг Bootstrap 5.3-ийн CSS хувьсагчаас авдаг тул dark theme-д ажиллана.
import React, { useMemo, useRef, useState } from 'react';

const W = 640;
const H = 476;
const Y0 = 44; // viewBox-ийн дээд ирмэг (тэнхлэгийн шошгонд хангалттай зай үлдээнэ)
const CX = 320;
const CY = 268;
const R = 172;
const RINGS = [25, 50, 75, 100];

const C_SERIES = 'var(--bs-primary, #0d6efd)';
const C_PEER = 'var(--bs-secondary-color, #6c757d)';
const C_SURFACE = 'var(--bs-body-bg, #fff)';
const C_TEXT = 'var(--bs-body-color, #212529)';
const C_MUTED = 'var(--bs-secondary-color, #6c757d)';
const C_GRID = 'var(--bs-border-color, #dee2e6)';
const C_GRID_OUTER = 'var(--bs-border-color-translucent, #adb5bd)';

const angleOf = (i, n) => ((-90 + (360 / n) * i) * Math.PI) / 180;
const pointAt = (i, n, v) => {
  const a = angleOf(i, n);
  const r = (R * v) / 100;
  return [CX + r * Math.cos(a), CY + r * Math.sin(a)];
};
const toPoints = (pts) => pts.map((p) => `${p[0].toFixed(1)},${p[1].toFixed(1)}`).join(' ');

const wrapLabel = (label) => {
  if (label.length <= 13 || !label.includes(' ')) return [label];
  const mid = label.length / 2;
  let best = -1;
  let bestDist = Infinity;
  for (let i = 0; i < label.length; i += 1) {
    if (label[i] === ' ' && Math.abs(i - mid) < bestDist) {
      best = i;
      bestDist = Math.abs(i - mid);
    }
  }
  return [label.slice(0, best), label.slice(best + 1)];
};

/**
 * axes: [{ key, label, sub, value, peer, reliable, tooltip: string[] }]
 *   value / peer: 0–100 эсвэл null (дата байхгүй → оройг зурахгүй)
 *   reliable=false бол оройг хоосон тойрог болгоно (дата хангалтгүй)
 */
const RadarChart = ({ axes, ariaLabel, seriesName, peerName }) => {
  const n = axes.length;
  const boxRef = useRef(null);
  const [active, setActive] = useState(null); // { i, x, y } — x, y нь хувиар

  const { studentPts, peerPts } = useMemo(() => ({
    studentPts: axes.map((a, i) => (a.value == null ? null : pointAt(i, n, a.value))).filter(Boolean),
    peerPts: axes.map((a, i) => (a.peer == null ? null : pointAt(i, n, a.peer))).filter(Boolean),
  }), [axes, n]);

  const showFromPointer = (i, e) => {
    const box = boxRef.current.getBoundingClientRect();
    setActive({
      i,
      x: ((e.clientX - box.left) / box.width) * 100,
      y: ((e.clientY - box.top) / box.height) * 100,
    });
  };
  const showFromFocus = (i) => {
    const p = pointAt(i, n, 60);
    setActive({ i, x: (p[0] / W) * 100, y: ((p[1] - Y0) / H) * 100 });
  };

  const tipAxis = active ? axes[active.i] : null;

  return (
    <div ref={boxRef} style={{ position: 'relative' }}>
      <svg
        viewBox={`0 ${Y0} ${W} ${H}`}
        style={{ width: '100%', height: 'auto', display: 'block', overflow: 'visible' }}
        role="img"
        aria-label={ariaLabel}
      >
        {RINGS.map((v) => (
          <g key={v}>
            <polygon
              points={toPoints(axes.map((_, i) => pointAt(i, n, v)))}
              fill="none"
              stroke={v === 100 ? C_GRID_OUTER : C_GRID}
              strokeWidth="1"
            />
            <text x={CX + 6} y={CY - (R * v) / 100 - 4} fontSize="11" fill={C_MUTED}>{v}%</text>
          </g>
        ))}

        {axes.map((a, i) => {
          const e = pointAt(i, n, 100);
          return <line key={a.key} x1={CX} y1={CY} x2={e[0]} y2={e[1]} stroke={C_GRID} strokeWidth="1" />;
        })}

        {peerPts.length > 1 && (
          <polygon points={toPoints(peerPts)} fill="none" stroke={C_PEER} strokeWidth="2" strokeLinejoin="round" />
        )}
        {axes.map((a, i) => {
          if (a.peer == null) return null;
          const p = pointAt(i, n, a.peer);
          return <circle key={`p-${a.key}`} cx={p[0]} cy={p[1]} r="4" fill={C_PEER} stroke={C_SURFACE} strokeWidth="2" />;
        })}

        {studentPts.length > 1 && (
          <polygon
            points={toPoints(studentPts)}
            fill={C_SERIES}
            fillOpacity="0.14"
            stroke={C_SERIES}
            strokeWidth="2"
            strokeLinejoin="round"
          />
        )}
        {axes.map((a, i) => {
          if (a.value == null) return null;
          const p = pointAt(i, n, a.value);
          return (
            <circle
              key={`s-${a.key}`}
              cx={p[0]}
              cy={p[1]}
              r="5.5"
              fill={a.reliable ? C_SERIES : C_SURFACE}
              stroke={a.reliable ? C_SURFACE : C_SERIES}
              strokeWidth={a.reliable ? 2 : 2.25}
            />
          );
        })}

        {axes.map((a, i) => {
          const ang = angleOf(i, n);
          const lx = CX + (R + 26) * Math.cos(ang);
          const ly = CY + (R + 26) * Math.sin(ang);
          const cs = Math.cos(ang);
          const sn = Math.sin(ang);
          const anchor = Math.abs(cs) < 0.2 ? 'middle' : cs > 0 ? 'start' : 'end';
          const lines = wrapLabel(a.label);
          const lh = 16;
          const total = lines.length + 1;
          let top;
          if (sn < -0.9) top = ly - (total - 1) * lh;
          else if (sn > 0.9) top = ly + 6;
          else top = ly - ((total - 1) * lh) / 2;
          return (
            <g key={`l-${a.key}`}>
              {lines.map((ln, j) => (
                <text key={ln} x={lx} y={top + j * lh + 4} textAnchor={anchor} fontSize="13.5" fontWeight="600" fill={C_TEXT}>
                  {ln}
                </text>
              ))}
              <text x={lx} y={top + lines.length * lh + 4} textAnchor={anchor} fontSize="11.5" fill={C_MUTED}>
                {a.sub}
              </text>
            </g>
          );
        })}

        {axes.map((a, i) => {
          const e = pointAt(i, n, 100);
          return (
            <line
              key={`h-${a.key}`}
              x1={CX}
              y1={CY}
              x2={e[0]}
              y2={e[1]}
              stroke="transparent"
              strokeWidth="40"
              strokeLinecap="round"
              tabIndex={0}
              aria-label={`${a.label}: ${(a.tooltip || []).join(', ')}`}
              style={{ outline: 'none', cursor: 'default' }}
              onPointerEnter={(ev) => showFromPointer(i, ev)}
              onPointerMove={(ev) => showFromPointer(i, ev)}
              onPointerLeave={() => setActive(null)}
              onFocus={() => showFromFocus(i)}
              onBlur={() => setActive(null)}
            />
          );
        })}
      </svg>

      {tipAxis && (
        <div
          role="tooltip"
          style={{
            position: 'absolute',
            left: `${active.x}%`,
            top: `${active.y}%`,
            transform: `translate(${active.x > 60 ? 'calc(-100% - 12px)' : '12px'}, ${active.y > 60 ? 'calc(-100% - 12px)' : '12px'})`,
            pointerEvents: 'none',
            zIndex: 5,
            maxWidth: 260,
            padding: '8px 11px',
            borderRadius: 8,
            fontSize: '0.78rem',
            lineHeight: 1.45,
            background: 'var(--bs-emphasis-color, #212529)',
            color: 'var(--bs-body-bg, #fff)',
            boxShadow: '0 6px 20px rgba(0,0,0,0.22)',
          }}
        >
          <div className="fw-semibold" style={{ marginBottom: 2 }}>{tipAxis.label}</div>
          {(tipAxis.tooltip || []).map((line) => (<div key={line}>{line}</div>))}
        </div>
      )}

      <div className="d-flex flex-wrap gap-3 mt-2 text-muted" style={{ fontSize: '0.78rem' }}>
        <span className="d-inline-flex align-items-center gap-2">
          <i style={{ display: 'inline-block', width: 22, borderTop: `2px solid ${C_SERIES}` }} />{seriesName}
        </span>
        <span className="d-inline-flex align-items-center gap-2">
          <i style={{ display: 'inline-block', width: 22, borderTop: `2px solid ${C_PEER}` }} />{peerName}
        </span>
        <span className="d-inline-flex align-items-center gap-2">
          <i style={{ display: 'inline-block', width: 10, height: 10, borderRadius: '50%', border: `2px solid ${C_SERIES}`, background: C_SURFACE }} />
          Дата хангалтгүй
        </span>
      </div>
    </div>
  );
};

export default RadarChart;
