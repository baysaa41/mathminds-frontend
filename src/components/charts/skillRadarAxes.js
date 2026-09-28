// student_report.build_student_skill_report()-ийн `axes`-ийг RadarChart-ын тэнхлэг болгоно.
// Багшийн сурагчийн тайлан болон эцэг эхийн "Хүүхдийн явц" хоёулаа ашиглана.

export const f1 = (v) => (v == null ? '—' : `${v.toFixed(1)}%`);

export const buildSkillRadarAxes = (axes, minReliable) => axes.map((a) => ({
  key: a.key,
  label: a.label,
  sub: a.attempted > 0 ? `n = ${a.attempted}` : (a.peer_pct != null ? 'хариулаагүй' : 'дата алга'),
  value: a.pct,
  peer: a.peer_pct,
  reliable: a.reliable,
  tooltip: [
    a.pct == null
      ? 'Сурагч: хариулт бүртгэгдээгүй'
      : `Сурагч: ${a.correct} / ${a.attempted} зөв · ${f1(a.pct)}${a.reliable ? '' : ` (дата хангалтгүй, n < ${minReliable})`}`,
    a.peer_pct == null
      ? 'Үе тэнгийнхэн: хариулт байхгүй'
      : `Үе тэнгийнхэн: ${f1(a.peer_pct)} · ${a.peer_attempted} хариулт`,
  ],
}));

export const skillRadarAriaLabel = (axes) => `Сэдэв тус бүрийн зөв хариултын хувийн радар: ${axes
  .map((a) => `${a.label} ${a.pct == null ? 'хариулт алга' : f1(a.pct)}`)
  .join(', ')}`;
