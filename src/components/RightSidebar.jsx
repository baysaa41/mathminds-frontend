// frontend/src/components/RightSidebar.jsx
import React from 'react';
import { useLocation, Link } from 'react-router-dom';
import Stack from 'react-bootstrap/Stack';
import ClubMenuWidget from './ClubMenuWidget';
import ClubPaymentInfoWidget from './ClubPaymentInfoWidget';
import TrendingPostsWidget from './TrendingPostsWidget';
import ExerciseDatesWidget from './ExerciseDatesWidget';
import SearchWidget from './SearchWidget';
import MyClubsWidget from './MyClubsWidget';
import { ChevronLeft } from 'lucide-react';

function fmtTime(secs) {
  if (!secs) return null;
  return `${Math.floor(secs / 60)}:${String(secs % 60).padStart(2, '0')}`;
}

function ProblemNavList({ items, currentIdx, userAnswers, times, onSelect }) {
  if (!items || items.length === 0) return null;
  return (
    <div>
      <div className="fw-semibold small text-muted mb-2 text-uppercase" style={{ letterSpacing: '0.04em' }}>
        Бодлогууд
      </div>
      <div className="d-flex flex-column gap-1">
        {items.map((item, i) => {
          const ua = userAnswers?.[item.item_id];
          const isCorrect = ua?.is_correct === true;
          const isWrong = ua && !isCorrect;
          const isCurrent = i === currentIdx;
          const timeStr = fmtTime(times?.[item.item_id]);
          return (
            <button
              key={item.item_id}
              type="button"
              onClick={() => onSelect(i)}
              style={{
                display: 'flex', alignItems: 'center', gap: '0.5rem',
                padding: '0.4rem 0.6rem',
                border: `1.5px solid ${isCurrent ? '#0d6efd' : '#dee2e6'}`,
                borderRadius: '0.4rem',
                background: isCurrent ? '#e8f0fe' : isCorrect ? '#f0fff4' : '#fff',
                cursor: 'pointer', textAlign: 'left', width: '100%',
                transition: 'border-color 0.15s, background 0.15s',
              }}
            >
              <span style={{
                display: 'inline-flex', alignItems: 'center', justifyContent: 'center',
                minWidth: 22, height: 22, borderRadius: '50%', flexShrink: 0,
                background: isCorrect ? '#198754' : isWrong ? '#dc3545' : isCurrent ? '#0d6efd' : '#e9ecef',
                color: (isCorrect || isWrong || isCurrent) ? '#fff' : '#6c757d',
                fontSize: '0.7rem', fontWeight: 700,
              }}>
                {i + 1}
              </span>
              <span className="small text-truncate" style={{ flex: 1, color: isCurrent ? '#0d6efd' : '#212529' }}>
                {item.problem?.title || `Бодлого ${i + 1}`}
              </span>
              {timeStr && (
                <span style={{
                  fontSize: '0.65rem', flexShrink: 0,
                  color: isCurrent ? '#0d6efd' : '#6c757d',
                  fontVariantNumeric: 'tabular-nums',
                }}>
                  {timeStr}
                </span>
              )}
            </button>
          );
        })}
      </div>
    </div>
  );
}

const RightSidebar = ({ clubData = null, problemNavData = null }) => {
  const location = useLocation();
  const isClubsPage = location.pathname.startsWith('/clubs');
  const isExercisesPage = /^\/clubs\/(\d+)\/exercises$/.test(location.pathname);
  const isExercisesReportPage = /^\/clubs\/(\d+)\/exercises-report/.test(location.pathname);
  const exercisesClubId = (isExercisesPage || isExercisesReportPage)
    ? location.pathname.match(/^\/clubs\/(\d+)\//)?.[1]
    : null;

  if (isExercisesPage) {
    return (
      <Stack gap={3}>
        {problemNavData && (
          <ProblemNavList
            items={problemNavData.items}
            currentIdx={problemNavData.currentIdx}
            userAnswers={problemNavData.userAnswers}
            times={problemNavData.times}
            onSelect={problemNavData.onSelect}
          />
        )}
        {exercisesClubId && <ExerciseDatesWidget clubId={exercisesClubId} />}
      </Stack>
    );
  }

  if (isExercisesReportPage) {
    return (
      <Stack gap={3}>
        {clubData && <ClubMenuWidget club={clubData} />}
        {exercisesClubId && <ExerciseDatesWidget clubId={exercisesClubId} autoSelect={false} />}
      </Stack>
    );
  }

  return (
    <Stack gap={3}>
      {!clubData && <SearchWidget />}
      {!clubData && <MyClubsWidget />}
      {clubData && <ClubMenuWidget club={clubData} />}
      {clubData && clubData.club_type === 'STUDY' && <ClubPaymentInfoWidget club={clubData} />}
      {!clubData && !isClubsPage && <TrendingPostsWidget />}
    </Stack>
  );
};

export default RightSidebar;
