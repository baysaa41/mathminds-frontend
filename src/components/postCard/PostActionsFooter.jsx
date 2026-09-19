// src/components/postCard/PostActionsFooter.jsx
// X (Twitter)-ийн үйлдлийн мөр: хариулах → repost → таалагдах → үзэлт,
// баруун талд нь фонт хэмжээ, хадгалах, сурагчдын хариулт.

import Spinner from 'react-bootstrap/Spinner';

// 1200 → "1.2K", 1_500_000 → "1.5M" — x.com-ийн тооны товчлол
const formatCount = (n) => {
  if (!n) return null;
  if (n < 1000) return String(n);
  if (n < 1_000_000) {
    const k = n / 1000;
    return `${k < 10 ? k.toFixed(1) : Math.round(k)}K`.replace('.0K', 'K');
  }
  const m = n / 1_000_000;
  return `${m < 10 ? m.toFixed(1) : Math.round(m)}M`.replace('.0M', 'M');
};

export function PostActionsFooter({
  isFavorited,
  favoriteCount,
  onFavorite,
  commentCount,
  onCommentClick,
  currentViewCount,
  fontSizeIndex,
  fontSizesLength,
  onDecreaseFontSize,
  onIncreaseFontSize,
  isBookmarked,
  onBookmark,
  isReposting,
  isOriginalRepost,
  onRepost,
  canEdit,
  isQuizPost,
  quizUuid,
  onViewStudentAnswers,
}) {
  return (
    <div className="x-actions">
      {/* Хариулах */}
      <button
        type="button"
        className="x-action x-action--reply"
        onClick={onCommentClick}
        title="Хариулах"
        aria-label="Хариулах"
      >
        <span className="x-action__icon">
          <i className="bi bi-chat" style={{ fontSize: '1.05rem' }}></i>
        </span>
        {formatCount(commentCount) && (
          <span className="x-action__count">{formatCount(commentCount)}</span>
        )}
      </button>

      {/* Repost */}
      <button
        type="button"
        className="x-action x-action--repost"
        onClick={onRepost}
        disabled={isReposting || isOriginalRepost}
        title={isOriginalRepost ? 'Дахин repost хийх боломжгүй' : 'Repost'}
        aria-label="Repost"
      >
        <span className="x-action__icon">
          {isReposting ? (
            <Spinner as="span" animation="border" size="sm" />
          ) : (
            <i className="bi bi-repeat" style={{ fontSize: '1.15rem' }}></i>
          )}
        </span>
      </button>

      {/* Таалагдсан */}
      <button
        type="button"
        className={`x-action x-action--like ${isFavorited ? 'is-active' : ''}`}
        onClick={onFavorite}
        title="Таалагдсан"
        aria-label="Таалагдсан"
      >
        <span className="x-action__icon">
          <i
            className={`bi ${isFavorited ? 'bi-heart-fill' : 'bi-heart'}`}
            style={{ fontSize: '1.05rem' }}
          ></i>
        </span>
        {formatCount(favoriteCount) && (
          <span className="x-action__count">{formatCount(favoriteCount)}</span>
        )}
      </button>

      {/* Үзэлт */}
      <span className="x-action x-action--views" title="Үзсэн тоо">
        <span className="x-action__icon">
          <i className="bi bi-bar-chart" style={{ fontSize: '1.05rem' }}></i>
        </span>
        {formatCount(currentViewCount) && (
          <span className="x-action__count">{formatCount(currentViewCount)}</span>
        )}
      </span>

      <div className="ms-auto d-flex align-items-center">
        {/* Үсэг жижигрүүлэх */}
        <button
          type="button"
          className="x-action x-action--font"
          onClick={onDecreaseFontSize}
          disabled={fontSizeIndex === 0}
          title="Үсэг жижигрүүлэх"
          aria-label="Үсэг жижигрүүлэх"
        >
          <span className="x-action__icon">
            <small style={{ fontSize: '0.7rem', fontWeight: 'bold' }}>Aa</small>
          </span>
        </button>

        {/* Үсэг томруулах */}
        <button
          type="button"
          className="x-action x-action--font"
          onClick={onIncreaseFontSize}
          disabled={fontSizeIndex === fontSizesLength - 1}
          title="Үсэг томруулах"
          aria-label="Үсэг томруулах"
        >
          <span className="x-action__icon">
            <span style={{ fontSize: '1rem', fontWeight: 'bold' }}>Aa</span>
          </span>
        </button>

        {/* Хадгалах */}
        <button
          type="button"
          className={`x-action x-action--bookmark ${isBookmarked ? 'is-active' : ''}`}
          onClick={onBookmark}
          title="Хадгалах"
          aria-label="Хадгалах"
        >
          <span className="x-action__icon">
            <i
              className={`bi ${isBookmarked ? 'bi-bookmark-fill' : 'bi-bookmark'}`}
              style={{ fontSize: '1.05rem' }}
            ></i>
          </span>
        </button>

        {/* Сурагчдын хариулт — зөвхөн тест постын эзэнд харагдана */}
        {canEdit && isQuizPost && quizUuid && (
          <button
            type="button"
            className="x-action x-action--views"
            onClick={onViewStudentAnswers}
            title="Сурагчдын хариулт харах"
            aria-label="Сурагчдын хариулт харах"
          >
            <span className="x-action__icon">
              <i className="bi bi-people-fill" style={{ fontSize: '1.05rem' }}></i>
            </span>
          </button>
        )}
      </div>
    </div>
  );
}
