// frontend/src/components/common/PageHeader.jsx
import Stack from 'react-bootstrap/Stack';
import Button from 'react-bootstrap/Button';
import Spinner from 'react-bootstrap/Spinner';
import { Plus } from 'lucide-react';

const PageHeader = ({
                        title,
                        subtitle,
                        action,
                        loading = false
                    }) => {
    return (
        <Stack direction="horizontal" gap={3} className="mb-4">
            <div className="flex-grow-1">
                <h1 className="h4 fw-bold mb-0">{title}</h1>
                {subtitle && (
                    <p className="text-muted small mb-0 mt-1">{subtitle}</p>
                )}
            </div>
            {action && (
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
            )}
        </Stack>
    );
};

export default PageHeader;