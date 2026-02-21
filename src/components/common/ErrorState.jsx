// frontend/src/components/common/ErrorState.jsx
import Alert from 'react-bootstrap/Alert';
import Button from 'react-bootstrap/Button';
import Container from 'react-bootstrap/Container';
import { AlertCircle, RefreshCw } from 'lucide-react';

const ErrorState = ({
  message = 'Алдаа гарлаа. Дахин оролдоно уу.',
  onRetry,
  fullPage = false,
  variant = 'danger',
}) => {
  const content = (
    <Alert variant={variant} className="d-flex align-items-start gap-3">
      <AlertCircle size={24} className="flex-shrink-0 mt-1" />
      <div className="flex-grow-1">
        <Alert.Heading className="h6 mb-2">Уучлаарай!</Alert.Heading>
        <p className="mb-0">{message}</p>
        {onRetry && (
          <Button variant={`outline-${variant}`} size="sm" onClick={onRetry} className="mt-3">
            <RefreshCw size={16} className="me-1" />
            Дахин оролдох
          </Button>
        )}
      </div>
    </Alert>
  );

  if (fullPage) {
    return <Container className="py-5">{content}</Container>;
  }

  return content;
};

export default ErrorState;
