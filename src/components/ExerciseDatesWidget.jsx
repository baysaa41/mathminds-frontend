// ExerciseDatesWidget — клубын дасгал хуудасны өдрүүд (RightSidebar дотор)
import React, { useState, useEffect } from 'react';
import { useSearchParams } from 'react-router-dom';
import Badge from 'react-bootstrap/Badge';
import Spinner from 'react-bootstrap/Spinner';
import { Calendar, Clock } from 'lucide-react';
import apiClient from '../api/axiosConfig';
import { API_ENDPOINTS } from '../constants/api';

const MONTHS_MN = [
  '1-р сар', '2-р сар', '3-р сар', '4-р сар', '5-р сар', '6-р сар',
  '7-р сар', '8-р сар', '9-р сар', '10-р сар', '11-р сар', '12-р сар',
];

function formatDay(dateStr) {
  const d = new Date(dateStr + 'T00:00:00');
  return `${d.getDate()}`;
}

function fmtTime(secs) {
  if (!secs) return null;
  const m = Math.floor(secs / 60);
  const s = String(secs % 60).padStart(2, '0');
  return `${m}:${s}`;
}

function getSavedTime(clubId, date) {
  try {
    const saved = JSON.parse(localStorage.getItem(`exercises_time_${clubId}_${date}`) || '{}');
    return Object.values(saved).reduce((sum, v) => sum + v, 0);
  } catch {
    return 0;
  }
}

function groupByMonth(dates) {
  const groups = {};
  for (const item of dates) {
    const d = new Date(item.date + 'T00:00:00');
    const key = `${d.getFullYear()}-${d.getMonth()}`;
    if (!groups[key]) {
      groups[key] = {
        label: `${d.getFullYear()} / ${MONTHS_MN[d.getMonth()]}`,
        items: [],
      };
    }
    groups[key].items.unshift(item);
  }
  return Object.values(groups).reverse();
}

const ExerciseDatesWidget = ({ clubId }) => {
  const [searchParams, setSearchParams] = useSearchParams();
  const selectedDate = searchParams.get('date');

  const [dates, setDates] = useState([]);
  const [loading, setLoading] = useState(true);
  const [, forceUpdate] = useState(0);

  useEffect(() => {
    const handler = () => forceUpdate(n => n + 1);
    window.addEventListener('exercises-time-saved', handler);
    return () => window.removeEventListener('exercises-time-saved', handler);
  }, []);

  useEffect(() => {
    if (!clubId) return;
    let cancelled = false;
    setLoading(true);
    apiClient.get(`${API_ENDPOINTS.MINDS.POSTS}dates/`, {
      params: { club: clubId, content_type: 'problem' },
    }).then(res => {
      if (cancelled) return;
      const list = res.data || [];
      setDates(list);
      // Өдөр сонгогдоогүй бол хамгийн сүүлийн өдрийг автоматаар сонгох
      if (list.length > 0 && !searchParams.get('date')) {
        setSearchParams({ date: list[list.length - 1].date }, { replace: true });
      }
    }).catch(() => {
      if (!cancelled) setDates([]);
    }).finally(() => {
      if (!cancelled) setLoading(false);
    });
    return () => { cancelled = true; };
  }, [clubId]); // eslint-disable-line react-hooks/exhaustive-deps

  const handleSelect = (date) => {
    setSearchParams({ date }, { replace: false });
  };

  if (loading) {
    return (
      <div className="card shadow-sm">
        <div className="card-body text-center py-3">
          <Spinner animation="border" size="sm" />
        </div>
      </div>
    );
  }

  if (dates.length === 0) return null;

  const monthGroups = groupByMonth(dates);

  return (
    <div className="card shadow-sm">
      <div className="card-header bg-white py-2 px-3 border-bottom">
        <span className="small fw-semibold d-flex align-items-center gap-1">
          <Calendar size={14} />Өдрүүд
        </span>
      </div>
      <div className="list-group list-group-flush" style={{ maxHeight: 420, overflowY: 'auto' }}>
        {monthGroups.map(group => (
          <React.Fragment key={group.label}>
            <div className="list-group-item py-1 px-3 bg-light border-0">
              <span className="text-muted" style={{ fontSize: '0.7rem', fontWeight: 600 }}>
                {group.label}
              </span>
            </div>
            {group.items.map(item => {
              const timeStr = fmtTime(getSavedTime(clubId, item.date));
              const isActive = selectedDate === item.date;
              return (
                <button
                  key={item.date}
                  type="button"
                  className={`list-group-item list-group-item-action d-flex justify-content-between align-items-center py-2 px-3 border-0${isActive ? ' active' : ''}`}
                  onClick={() => handleSelect(item.date)}
                >
                  <span className="small">{item.date}</span>
                  <div className="d-flex align-items-center gap-2">
                    {timeStr && (
                      <span
                        className="d-flex align-items-center gap-1"
                        style={{
                          fontSize: '0.65rem',
                          color: isActive ? 'rgba(255,255,255,0.8)' : '#6c757d',
                          fontVariantNumeric: 'tabular-nums',
                        }}
                      >
                        <Clock size={10} />
                        {timeStr}
                      </span>
                    )}
                    <Badge
                      bg={isActive ? 'light' : 'primary'}
                      text={isActive ? 'dark' : undefined}
                      style={{ fontSize: '0.65rem' }}
                    >
                      {item.count}
                    </Badge>
                  </div>
                </button>
              );
            })}
          </React.Fragment>
        ))}
      </div>
    </div>
  );
};

export default ExerciseDatesWidget;
