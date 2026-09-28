// Сар бүрийн дундаж оноо (%) — нэг цуваа баганан график (chart сан ашиглаагүй, SVG).
// Өнгийг Bootstrap 5.3-ийн CSS хувьсагчаас авдаг (RadarChart-тай ижил) тул dark theme-д ажиллана.
// Дүнгүй сар 0 биш — баганагүй, "—" тэмдэгтэй (0% гэж андуурагдахгүй).
import React, { useRef, useState } from 'react';
import { monthLabel } from '../../utils/dateFormatter';

const W = 640;
const H = 240;
const PAD_L = 40;
const PAD_R = 8;
const PAD_T = 22;
const PAD_B = 34;
const TICKS = [0, 25, 50, 75, 100];

const C_SERIES = 'var(--bs-primary, #0d6efd)';
const C_TEXT = 'var(--bs-body-color, #212529)';
const C_MUTED = 'var(--bs-secondary-color, #6c757d)';
const C_GRID = 'var(--bs-border-color, #dee2e6)';

const MONTHS_MN = ['1', '2', '3', '4', '5', '6', '7', '8', '9', '10', '11', '12'];
const shortMonth = (key) => `${MONTHS_MN[Number(key.slice(5)) - 1]}-р`;

const MonthlyScoreChart = ({ data, ariaLabel }) => {
  const boxRef = useRef(null);
  const [active, setActive] = useState(null); // { i, x, y } — хувиар

  const plotW = W - PAD_L - PAD_R;
  const plotH = H - PAD_T - PAD_B;
  const slot = plotW / data.length;
  const barW = Math.min(28, slot * 0.6);
  const yOf = (v) => PAD_T + plotH * (1 - v / 100);
  // Зөвхөн хамгийн сүүлийн дүнтэй сард утгыг шууд бичнэ (тоог бүх баганад бичихгүй)
  const lastIdx = data.map((d) => d.avg_pct != null).lastIndexOf(true);

  const show = (i, e) => {
    const box = boxRef.current.getBoundingClientRect();
    setActive({ i, x: ((e.clientX - box.left) / box.width) * 100, y: ((e.clientY - box.top) / box.height) * 100 });
  };
  const showFocus = (i) => {
    const d = data[i];
    setActive({ i, x: ((PAD_L + slot * (i + 0.5)) / W) * 100, y: (yOf(d.avg_pct ?? 0) / H) * 100 });
  };
  const tip = active ? data[active.i] : null;

  return (
    <div ref={boxRef} style={{ position: 'relative' }}>
      <svg viewBox={`0 0 ${W} ${H}`} style={{ width: '100%', height: 'auto', display: 'block' }}
        role="img" aria-label={ariaLabel}>
        {TICKS.map((t) => (
          <g key={t}>
            <line x1={PAD_L} x2={W - PAD_R} y1={yOf(t)} y2={yOf(t)} stroke={C_GRID} strokeWidth="1"
              strokeDasharray={t === 0 ? undefined : '2 4'} />
            <text x={PAD_L - 6} y={yOf(t) + 4} fontSize="11" textAnchor="end" fill={C_MUTED}>{t}%</text>
          </g>
        ))}
        {data.map((d, i) => {
          const cx = PAD_L + slot * (i + 0.5);
          const has = d.avg_pct != null;
          const top = has ? yOf(Math.max(d.avg_pct, 1)) : yOf(0);
          const h = yOf(0) - top;
          return (
            <g key={d.month}>
              {has ? (
                // Дээд талдаа 4px бөөрөнхий, суурьтайгаа тэгш
                <path
                  d={`M${cx - barW / 2},${yOf(0)} V${top + Math.min(4, h)} Q${cx - barW / 2},${top} ${cx - barW / 2 + Math.min(4, h)},${top}
                     H${cx + barW / 2 - Math.min(4, h)} Q${cx + barW / 2},${top} ${cx + barW / 2},${top + Math.min(4, h)} V${yOf(0)} Z`}
                  fill={C_SERIES}
                  opacity={active && active.i !== i ? 0.55 : 1}
                />
              ) : (
                <text x={cx} y={yOf(0) - 5} fontSize="11" textAnchor="middle" fill={C_MUTED}>—</text>
              )}
              {i === lastIdx && has && (
                <text x={cx} y={top - 6} fontSize="11" fontWeight="600" textAnchor="middle" fill={C_TEXT}>
                  {Math.round(d.avg_pct)}%
                </text>
              )}
              <text x={cx} y={H - PAD_B + 16} fontSize="11" textAnchor="middle" fill={C_MUTED}>{shortMonth(d.month)}</text>
              {/* Hit target: баганаас том (бүтэн өндөр, бүтэн slot) */}
              <rect
                x={cx - slot / 2} y={PAD_T} width={slot} height={plotH} fill="transparent"
                tabIndex={0}
                aria-label={`${monthLabel(d.month)}: ${has ? `${d.avg_pct}%, ${d.count} даалгавар` : 'дүн алга'}`}
                onMouseMove={(e) => show(i, e)}
                onMouseLeave={() => setActive(null)}
                onFocus={() => showFocus(i)}
                onBlur={() => setActive(null)}
                style={{ outline: 'none', cursor: 'default' }}
              />
            </g>
          );
        })}
      </svg>

      {tip && (
        <div role="tooltip" style={{
          position: 'absolute', left: `${active.x}%`, top: `${active.y}%`,
          transform: `translate(${active.x > 60 ? 'calc(-100% - 12px)' : '12px'}, ${active.y > 50 ? 'calc(-100% - 12px)' : '12px'})`,
          pointerEvents: 'none', zIndex: 5, maxWidth: 280, padding: '8px 11px', borderRadius: 8,
          fontSize: '0.78rem', lineHeight: 1.45,
          background: 'var(--bs-emphasis-color, #212529)', color: 'var(--bs-body-bg, #fff)',
          boxShadow: '0 6px 20px rgba(0,0,0,0.22)',
        }}>
          <div className="fw-semibold" style={{ marginBottom: 2 }}>
            {monthLabel(tip.month)} · {tip.avg_pct == null ? 'дүн алга' : `дундаж ${tip.avg_pct}%`}
          </div>
          {tip.items.slice(0, 5).map((it) => (
            <div key={`${it.title}-${it.graded_at}`}>{it.title}: {it.score}/{it.max_score} ({Math.round(it.pct)}%)</div>
          ))}
          {tip.items.length > 5 && <div>… нийт {tip.items.length} даалгавар</div>}
        </div>
      )}
    </div>
  );
};

export default MonthlyScoreChart;
