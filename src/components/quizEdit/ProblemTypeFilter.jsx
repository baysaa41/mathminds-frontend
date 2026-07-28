// src/components/quizEdit/ProblemTypeFilter.jsx
// AddProblemModal/ReplaceProblemModal хоёулаа ашигладаг төрлийн шүүлтүүрийн товчнууд

const TYPE_OPTIONS = [
  { label: 'Бүгд', value: '' },
  { label: 'Сонгох', value: '1' },
  { label: 'Нөхөх', value: '4' },
  { label: 'Уламжлалт', value: '0' },
];

export function ProblemTypeFilter({ value, onChange }) {
  return (
    <div className="btn-group btn-group-sm mb-3 w-100" role="group" aria-label="Бодлогын төрлөөр шүүх">
      {TYPE_OPTIONS.map(({ label, value: v }) => (
        <button
          key={v}
          type="button"
          className={`btn ${value === v ? 'btn-primary' : 'btn-outline-secondary'}`}
          onClick={() => onChange(v)}
        >
          {label}
        </button>
      ))}
    </div>
  );
}
