// frontend/src/components/common/PageHeader.jsx
import Stack from 'react-bootstrap/Stack';
import Button from 'react-bootstrap/Button';
import Spinner from 'react-bootstrap/Spinner';
import { Plus } from 'lucide-react';

const PageHeader = ({ title, subtitle, action, loading = false }) => {
  // Action нь JSX element эсвэл object байж болно
  const isActionObject = action && typeof action === 'object' && !action.$$typeof;

  return (
    <Stack direction="horizontal" gap={3} className="mb-4">
      <div className="flex-grow-1">
        <h1 className="h4 fw-bold mb-0">{title}</h1>
        {subtitle && <p className="text-muted small mb-0 mt-1">{subtitle}</p>}
      </div>
      {action && (
        <>
          {isActionObject ? (
            // Object хэлбэр: { label, onClick, variant, icon }
            <Button
              variant={action.variant || 'primary'}
              size="sm"
              onClick={action.onClick}
              disabled={loading}
              className="ms-auto flex-shrink-0"
            >
              {loading ? (
                <Spinner as="span" animation="border" size="sm" />
              ) : (
                <>
                  {action.icon || <Plus size={16} className="me-1" />}
                  {action.label}
                </>
              )}
            </Button>
          ) : (
            // JSX element хэлбэр: <div>...</div>
            <div className="ms-auto flex-shrink-0">{action}</div>
          )}
        </>
      )}
    </Stack>
  );
};

export default PageHeader;
