// src/components/postCard/PostMenu.jsx

import Dropdown from 'react-bootstrap/Dropdown';

export function PostMenu({
  postId, user, canEdit, canDelete, originalAuthor,
  onEditClick, onDeleteClick, onBlockUser, onMuteUser, onAIHelp, onReportClick,
}) {
  if (!user) return null;

  return (
    <Dropdown align="end">
      <Dropdown.Toggle
        variant="link"
        size="sm"
        className="text-muted no-caret p-0"
        id={`dropdown-post-${postId}`}
      >
        <i className="bi bi-three-dots-vertical"></i>
      </Dropdown.Toggle>
      <Dropdown.Menu>
        {/* Засах (эзэн/staff) */}
        {canEdit && (
          <Dropdown.Item onClick={onEditClick}>
            <i className="bi bi-pencil me-2"></i>
            Засах
          </Dropdown.Item>
        )}
        {/* Устгах (эзэн/staff/клубын багш) */}
        {canDelete && (
          <Dropdown.Item onClick={onDeleteClick}>
            <i className="bi bi-trash me-2"></i>
            Устгах
          </Dropdown.Item>
        )}
        {(canEdit || canDelete) && <Dropdown.Divider />}

        {/* Бусад хэрэглэгчийн үйлдлүүд */}
        {!canEdit && originalAuthor && user.id !== originalAuthor.id && (
          <>
            <Dropdown.Item onClick={onBlockUser}>
              <i className="bi bi-ban me-2"></i>@{originalAuthor.username}-г block хийх
            </Dropdown.Item>
            <Dropdown.Item onClick={onMuteUser}>
              <i className="bi bi-volume-mute me-2"></i>@{originalAuthor.username}-г
              mute хийх
            </Dropdown.Item>
            <Dropdown.Divider />
          </>
        )}

        {/* AI тусламж — бүх хэрэглэгчид */}
        <Dropdown.Item onClick={onAIHelp}>
          <i className="bi bi-stars me-2"></i>
          AI тусламж
        </Dropdown.Item>

        {/* Бүгдэд харагдах */}
        {user.id !== originalAuthor?.id && (
          <>
            <Dropdown.Divider />
            <Dropdown.Item onClick={onReportClick}>
              <i className="bi bi-flag me-2"></i>
              Report хийх
            </Dropdown.Item>
          </>
        )}
      </Dropdown.Menu>
    </Dropdown>
  );
}
