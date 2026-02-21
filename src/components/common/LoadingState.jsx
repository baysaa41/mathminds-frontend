// frontend/src/components/common/LoadingState.jsx
import Spinner from 'react-bootstrap/Spinner';
import Container from 'react-bootstrap/Container';

const LoadingState = ({ message = 'Ачааллаж байна...', size = 'md', fullPage = false }) => {
  const content = (
    <div className="text-center">
      <Spinner animation="border" variant="primary" size={size === 'sm' ? 'sm' : undefined} />
      {message && <div className="mt-3 text-muted">{message}</div>}
    </div>
  );

  if (fullPage) {
    return (
      <Container className="d-flex justify-content-center align-items-center min-vh-100">
        {content}
      </Container>
    );
  }

  return <div className="d-flex justify-content-center align-items-center py-5">{content}</div>;
};

export default LoadingState;
