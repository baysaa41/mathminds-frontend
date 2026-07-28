// src/components/curriculumAdmin/SaveButton.jsx
import { Button, Spinner } from 'react-bootstrap';

export default function SaveButton({ loading }) {
  return (
    <Button type="submit" variant="primary" disabled={loading}>
      {loading ? <Spinner size="sm" className="me-1" /> : null}
      Хадгалах
    </Button>
  );
}
