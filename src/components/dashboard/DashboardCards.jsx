// "Миний өдөр" төрлийн dashboard-уудад (сурагчийн болон эцэг эхийн) хамтран ашиглах карт компонентууд.
import React from 'react';
import { Link } from 'react-router-dom';
import Badge from 'react-bootstrap/Badge';
import ProgressBar from 'react-bootstrap/ProgressBar';
import { Repeat, Target, BookOpen, ListChecks, Clock, Sparkles, CheckCircle2, Circle } from 'lucide-react';

const ITEM_TYPE_LABEL = {
  learn: 'Сурах',
  practice: 'Дадлага',
  review: 'Давталт',
};

const STATUS_CONFIG = {
  pending: { label: 'Хийгээгүй', bg: 'secondary' },
  in_progress: { label: 'Явагдаж байна', bg: 'warning' },
  done: { label: 'Дууссан', bg: 'success' },
};

const DAILY_REC_SOURCE_LABEL = {
  club_assignment: 'Клубын даалгаврын үр дүнд суурилав',
  topic_mastery: 'Ерөнхий сул сэдвүүдэд суурилав',
  cold_start: 'Шинэ сурагчид зориулсан санал',
};

const fmtDate = (iso) => iso ? new Date(iso).toLocaleDateString('mn-MN') : '—';

export const ReviewCard = ({ review }) => (
  <div className="card border-0 shadow-sm mb-3">
    <div className="card-header bg-white fw-semibold py-2 d-flex align-items-center gap-2" style={{ fontSize: '0.85rem' }}>
      <Repeat size={15} />
      <span>Давталт</span>
    </div>
    <div className="card-body py-3">
      <div className="row g-3 text-center">
        <div className="col-4">
          <div className="fw-bold fs-4" style={{ color: review.due_today > 0 ? '#dc3545' : '#198754' }}>
            {review.due_today}
          </div>
          <div className="text-muted" style={{ fontSize: '0.75rem' }}>Өнөөдөр давтах</div>
        </div>
        <div className="col-4">
          <div className="fw-bold fs-4 text-warning">{review.due_week}</div>
          <div className="text-muted" style={{ fontSize: '0.75rem' }}>7 хоногт</div>
        </div>
        <div className="col-4">
          <div className="fw-bold fs-4 text-info">{review.total}</div>
          <div className="text-muted" style={{ fontSize: '0.75rem' }}>Нийт</div>
        </div>
      </div>
      {review.due_today === 0 && (
        <div className="text-muted text-center mt-2" style={{ fontSize: '0.8rem' }}>
          Өнөөдөр давтах бодлого байхгүй 🎉
        </div>
      )}
    </div>
  </div>
);

export const StudyPlanCard = ({ plan }) => (
  <div className="card border-0 shadow-sm mb-3">
    <div className="card-header bg-white fw-semibold py-2 d-flex align-items-center gap-2" style={{ fontSize: '0.85rem' }}>
      <ListChecks size={15} />
      <span>Энэ 7 хоногийн төлөвлөгөө</span>
      <Badge bg="secondary" className="ms-1" style={{ fontSize: '0.65rem' }}>
        {fmtDate(plan.week_start)}
      </Badge>
    </div>
    <div className="card-body py-3">
      {plan.ai_summary && (
        <p className="text-muted mb-3" style={{ fontSize: '0.82rem' }}>{plan.ai_summary}</p>
      )}
      {plan.items.length === 0 ? (
        <div className="text-muted text-center py-2" style={{ fontSize: '0.82rem' }}>
          Энэ 7 хоногт төлөвлөгөөний зүйл алга
        </div>
      ) : (
        <div className="d-flex flex-column gap-2">
          {plan.items.map((item) => {
            const si = STATUS_CONFIG[item.status] || STATUS_CONFIG.pending;
            const pct = item.target_count > 0
              ? Math.min(100, Math.round(item.completed_count / item.target_count * 100)) : 0;
            return (
              <div key={item.id} className="border rounded-3 p-2">
                <div className="d-flex align-items-center justify-content-between mb-1">
                  <div>
                    <span className="fw-medium" style={{ fontSize: '0.85rem' }}>{item.topic_name}</span>
                    <Badge bg="light" text="dark" className="border ms-2" style={{ fontSize: '0.65rem' }}>
                      {ITEM_TYPE_LABEL[item.item_type] || item.item_type}
                    </Badge>
                  </div>
                  <Badge bg={si.bg} style={{ fontSize: '0.65rem' }}>{si.label}</Badge>
                </div>
                <div className="d-flex align-items-center gap-2">
                  <ProgressBar now={pct} variant={pct >= 100 ? 'success' : 'primary'}
                    style={{ height: 6, flex: 1 }} />
                  <span className="text-muted" style={{ fontSize: '0.72rem', minWidth: 40 }}>
                    {item.completed_count}/{item.target_count}
                  </span>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  </div>
);

/**
 * onItemClick өгөгдсөн бол (сурагчийн өөрийн "Миний өдөр" хуудас) бодлого дээр
 * дарахад тэрхэн callback ажиллана — AI чат горимоор үргэлжлүүлэхэд ашиглана.
 * Өгөгдөөгүй бол (жишээ нь эцэг эхийн зөвхөн-унших dashboard) хуучин шигээ
 * шууд бодлогын хуудас руу шилждэг Link хэвээр үлдэнэ.
 */
export const DailyRecommendationCard = ({ recommendation, onItemClick, loadingItemId }) => (
  <div className="card border-0 shadow-sm mb-3">
    <div className="card-header bg-white fw-semibold py-2 d-flex align-items-center gap-2" style={{ fontSize: '0.85rem' }}>
      <Sparkles size={15} />
      <span>Өнөөдрийн 5 бодлого</span>
      <Badge bg="secondary" className="ms-1" style={{ fontSize: '0.65rem' }}>
        {fmtDate(recommendation.date)}
      </Badge>
    </div>
    <div className="card-body py-3">
      <p className="text-muted mb-3" style={{ fontSize: '0.78rem' }}>
        {DAILY_REC_SOURCE_LABEL[recommendation.source] || ''}
      </p>
      {recommendation.items.length === 0 ? (
        <div className="text-muted text-center py-2" style={{ fontSize: '0.82rem' }}>
          Өнөөдөр санал болгох бодлого алга
        </div>
      ) : (
        <div className="list-group list-group-flush">
          {recommendation.items.map((item) => {
            const isLoading = loadingItemId === item.id;
            const rowContent = (
              <>
                {isLoading ? (
                  <span className="spinner-border spinner-border-sm text-muted flex-shrink-0" style={{ width: '1rem', height: '1rem' }} />
                ) : item.status === 'done'
                  ? <CheckCircle2 size={16} className="text-success flex-shrink-0" />
                  : <Circle size={16} className="text-muted flex-shrink-0" />}
                <span
                  className="fw-medium text-truncate"
                  style={{
                    fontSize: '0.85rem',
                    textDecoration: item.status === 'done' ? 'line-through' : 'none',
                    opacity: item.status === 'done' ? 0.6 : 1,
                  }}
                >
                  {item.title || `Бодлого #${item.problem_id}`}
                </span>
                {item.category_mn && (
                  <Badge bg="light" text="dark" className="border ms-auto" style={{ fontSize: '0.65rem', color: item.category_color || undefined }}>
                    {item.category_mn}
                  </Badge>
                )}
              </>
            );

            if (onItemClick) {
              return (
                <button
                  key={item.id}
                  type="button"
                  disabled={isLoading}
                  onClick={() => onItemClick(item)}
                  className="list-group-item list-group-item-action px-0 py-2 border-0 border-top d-flex align-items-center gap-2 text-start bg-transparent"
                >
                  {rowContent}
                </button>
              );
            }

            return (
              <Link key={item.id} to={`/problem/${item.problem_uuid}`}
                className="list-group-item list-group-item-action px-0 py-2 border-0 border-top d-flex align-items-center gap-2">
                {rowContent}
              </Link>
            );
          })}
        </div>
      )}
    </div>
  </div>
);

export const NextTopicCard = ({ topic }) => (
  <div className="card border-0 shadow-sm mb-3">
    <div className="card-header bg-white fw-semibold py-2 d-flex align-items-center gap-2" style={{ fontSize: '0.85rem' }}>
      <Target size={15} />
      <span>Дараагийн санал болгож буй сэдэв</span>
    </div>
    <div className="card-body py-3">
      {topic ? (
        <div className="fw-medium" style={{ fontSize: '0.9rem' }}>{topic.name}</div>
      ) : (
        <div className="text-muted" style={{ fontSize: '0.82rem' }}>
          Одоогоор санал болгох сэдэв алга — цааш үргэлжлүүлээрэй.
        </div>
      )}
    </div>
  </div>
);

export const RecentQuizzesCard = ({ quizzes }) => (
  <div className="card border-0 shadow-sm mb-3">
    <div className="card-header bg-white fw-semibold py-2 d-flex align-items-center gap-2" style={{ fontSize: '0.85rem' }}>
      <BookOpen size={15} />
      <span>Сүүлийн quiz үр дүн</span>
    </div>
    {quizzes.length === 0 ? (
      <div className="card-body text-muted text-center py-3" style={{ fontSize: '0.82rem' }}>
        Одоогоор өгсөн quiz алга
      </div>
    ) : (
      <div className="list-group list-group-flush">
        {quizzes.map((qs) => {
          const content = (
            <div className="d-flex align-items-center justify-content-between py-2 px-3">
              <div>
                <div className="fw-medium" style={{ fontSize: '0.85rem' }}>{qs.quiz_title || 'Quiz'}</div>
                <div className="text-muted" style={{ fontSize: '0.72rem' }}>{fmtDate(qs.started_at)}</div>
              </div>
              <span className="fw-semibold" style={{ fontSize: '0.9rem' }}>
                {qs.score != null ? qs.score : '—'}
              </span>
            </div>
          );
          return qs.quiz_uuid ? (
            <Link key={qs.id} to={`/quiz/${qs.quiz_uuid}/result/${qs.id}`}
              className="list-group-item list-group-item-action p-0 border-0 border-top">
              {content}
            </Link>
          ) : (
            <div key={qs.id} className="border-top">{content}</div>
          );
        })}
      </div>
    )}
  </div>
);

export const UpcomingAssignmentsCard = ({ assignments }) => (
  <div className="card border-0 shadow-sm mb-3">
    <div className="card-header bg-white fw-semibold py-2 d-flex align-items-center gap-2" style={{ fontSize: '0.85rem' }}>
      <Clock size={15} />
      <span>Клубын дөхөж буй даалгавар</span>
    </div>
    {assignments.length === 0 ? (
      <div className="card-body text-muted text-center py-3" style={{ fontSize: '0.82rem' }}>
        Дөхөж буй даалгавар алга
      </div>
    ) : (
      <div className="list-group list-group-flush">
        {assignments.map((a) => (
          <Link key={a.id} to={`/clubs/${a.club_id}/assignments/${a.id}`}
            className="list-group-item list-group-item-action p-0 border-0 border-top">
            <div className="d-flex align-items-center justify-content-between py-2 px-3">
              <div>
                <div className="fw-medium" style={{ fontSize: '0.85rem' }}>{a.title}</div>
                <div className="text-muted" style={{ fontSize: '0.72rem' }}>{a.club_name}</div>
              </div>
              <span className="text-muted" style={{ fontSize: '0.75rem' }}>{fmtDate(a.deadline)}</span>
            </div>
          </Link>
        ))}
      </div>
    )}
  </div>
);
