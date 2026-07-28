// src/components/postCard/PostContent.jsx

import { useNavigate } from 'react-router-dom';
import Card from 'react-bootstrap/Card';
import Badge from 'react-bootstrap/Badge';
import Button from 'react-bootstrap/Button';
import LivePreview from '../LivePreview';
import { AIChatExcerptCard } from './AIChatExcerptCard.jsx';
import { safeTruncate } from './textUtils.js';

export const PostContent = ({ post }) => {
  const navigate = useNavigate();

  if (!post) return null;

  if (
    post.content_type === 'post' ||
    post.content_type === 'repost' ||
    post.content_type === 'reply'
  ) {
    return null;
  }

  if (post.content_type === 'ai_chat') {
    return <AIChatExcerptCard post={post} excerpt={post.related_chat_excerpt} />;
  }

  const relatedItem =
    post.related_problem || post.related_formula || post.related_article || post.related_quiz;

  if (!relatedItem)
    return <div className="text-muted fst-italic">[Холбоотой контент олдсонгүй]</div>;

  const detailUrlMap = {
    article: `/article/${relatedItem.uuid}`,
    problem: `/problem/${relatedItem.uuid}`,
    formula: `/formula/${relatedItem.uuid}`,
    quiz:    `/quiz/${relatedItem.uuid}`,
  };
  const contentUrl = relatedItem.uuid ? detailUrlMap[post.content_type] : null;

  let title = relatedItem.title || relatedItem.name || `Контент #${relatedItem.id}`;

  let description =
    relatedItem.statement ||
    relatedItem.content ||
    relatedItem.abstract ||
    relatedItem.description ||
    '';

  let typeLabel;
  let badgeVariant;

  switch (post.content_type) {
    case 'problem':
      typeLabel = 'Бодлого';
      badgeVariant = 'secondary';
      break;
    case 'formula':
      typeLabel = 'Томьёо';
      badgeVariant = 'info';
      break;
    case 'article':
      typeLabel = 'Өгүүлэл';
      badgeVariant = 'danger';
      break;
    case 'quiz':
      typeLabel = 'Тест';
      badgeVariant = 'success';
      break;
    default:
      typeLabel = 'Контент';
      badgeVariant = 'warning';
  }

  const contentToShow =
    post.content_type === 'problem' || post.content_type === 'formula'
      ? description
      : safeTruncate(description, 100);

  return (
    <>
      <LivePreview content={post.content} />
      <Card
        className="bg-light border shadow-sm mt-2 post-content-card"
        onClick={() => navigate(`/post/${post.uuid}`)}
        style={{ cursor: 'pointer' }}
      >
        <Card.Body>
          <div className="mb-2">
            <Badge bg={badgeVariant}>{typeLabel}</Badge>
          </div>

          <Card.Title className="h6 mathjax-content mb-1">
            <LivePreview content={title} />
          </Card.Title>

          {description && (
            <Card.Text
              as="div"
              className="small text-muted mathjax-content"
              style={{ whiteSpace: 'pre-wrap' }}
            >
              <LivePreview content={contentToShow} />
            </Card.Text>
          )}

          {contentUrl && (
            <div className="text-end mt-2" onClick={(e) => e.stopPropagation()}>
              <Button
                variant={`outline-${badgeVariant}`}
                size="sm"
                onClick={() => navigate(contentUrl)}
                style={{ fontSize: '0.7rem', padding: '1px 8px' }}
              >
                {typeLabel} харах
              </Button>
            </div>
          )}
        </Card.Body>
      </Card>
    </>
  );
};
