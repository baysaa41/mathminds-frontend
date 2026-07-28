// src/components/postCard/PostActionsFooter.jsx

import Card from 'react-bootstrap/Card';
import Stack from 'react-bootstrap/Stack';
import Button from 'react-bootstrap/Button';
import Spinner from 'react-bootstrap/Spinner';

export function PostActionsFooter({
  isFavorited, favoriteCount, onFavorite,
  commentCount, onCommentClick,
  currentViewCount,
  fontSizeIndex, fontSizesLength, onDecreaseFontSize, onIncreaseFontSize,
  isBookmarked, onBookmark,
  isReposting, isOriginalRepost, onRepost,
  canEdit, isQuizPost, quizUuid, onViewStudentAnswers,
}) {
  return (
    <Card.Footer className="bg-white border-top-0 pt-0">
      <Stack direction="horizontal" gap={3} className="post-actions align-items-center">
        {/* Таалагдсан */}
        <Button
          variant="link"
          className="text-decoration-none p-1 d-flex align-items-center text-muted"
          onClick={onFavorite}
          title="Таалагдсан"
        >
          <i className={`bi ${isFavorited ? 'bi-heart-fill text-danger' : 'bi-heart'}`}></i>
          <span className={`ms-1 small ${isFavorited ? 'text-danger' : ''}`}>
            {favoriteCount}
          </span>
        </Button>

        {/* Коммент (State-с авсан тоо) - PostDetailPage руу үсрэх */}
        <div
          className="p-1 d-flex align-items-center text-muted"
          style={{ cursor: 'pointer' }}
          title="Сэтгэгдэл"
          onClick={onCommentClick}
        >
          <i className="bi bi-chat-square me-1"></i>
          <span className="ms-1 small">{commentCount}</span>
        </div>

        {/* Үзэлт */}
        <span className="text-muted small ms-2 d-flex align-items-center" title="Үзсэн тоо">
          <i className="bi bi-eye me-1"></i>
          {currentViewCount || 0}
        </span>

        {/* Үсэг томруулах/жижигрүүлэх */}
        <div className="ms-auto d-flex align-items-center">
          <Button
            variant="link"
            className="text-decoration-none p-1 text-muted"
            onClick={onDecreaseFontSize}
            title="Үсэг жижигрүүлэх"
            disabled={fontSizeIndex === 0}
          >
            <small style={{ fontSize: '0.7rem', fontWeight: 'bold' }}>Aa</small>
          </Button>
          <Button
            variant="link"
            className="text-decoration-none p-1 text-muted"
            onClick={onIncreaseFontSize}
            title="Үсэг томруулах"
            disabled={fontSizeIndex === fontSizesLength - 1}
          >
            <span style={{ fontSize: '1rem', fontWeight: 'bold' }}>Aa</span>
          </Button>
        </div>

        {/* Хадгалах */}
        <Button
          variant="link"
          className={`text-decoration-none p-1 ${isBookmarked ? 'text-primary' : 'text-muted'}`}
          onClick={onBookmark}
          title="Хадгалах"
        >
          <i className={`bi ${isBookmarked ? 'bi-bookmark-fill' : 'bi-bookmark'}`}></i>
        </Button>

        {/* Repost */}
        <Button
          variant="link"
          className="text-decoration-none text-muted p-1"
          onClick={onRepost}
          disabled={isReposting || isOriginalRepost}
          title={isOriginalRepost ? 'Дахин repost хийх боломжгүй' : 'Repost'}
        >
          {isReposting ? <Spinner as="span" size="sm" /> : <i className="bi bi-repeat"></i>}
        </Button>

        {/* Сурагчдын хариулт — зөвхөн тест постын эзэнд харагдана */}
        {canEdit && isQuizPost && quizUuid && (
          <Button
            variant="link"
            className="text-decoration-none text-muted p-1"
            title="Сурагчдын хариулт харах"
            onClick={onViewStudentAnswers}
          >
            <i className="bi bi-people-fill"></i>
          </Button>
        )}
      </Stack>
    </Card.Footer>
  );
}
