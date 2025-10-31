// frontend/src/components/common/EmptyState.jsx
import Card from 'react-bootstrap/Card';
import Button from 'react-bootstrap/Button';
import { Inbox, Plus } from 'lucide-react';

const EmptyState = ({
                        icon: Icon = Inbox,
                        title = 'Хоосон байна',
                        message = 'Одоогоор мэдээлэл байхгүй байна.',
                        actionLabel,
                        onAction,
                        variant = 'light'
                    }) => {
    return (
        <Card className={`border-0 bg-${variant}`}>
            <Card.Body className="text-center py-5">
                <Icon size={64} className="text-muted mb-3" />
                <h5 className="text-muted mb-2">{title}</h5>
                <p className="text-muted mb-4">{message}</p>
                {actionLabel && onAction && (
                    <Button
                        variant="primary"
                        size="sm"
                        onClick={onAction}
                    >
                        <Plus size={16} className="me-1" />
                        {actionLabel}
                    </Button>
                )}
            </Card.Body>
        </Card>
    );
};

export default EmptyState;