// frontend/src/pages/ClassroomPostersPage.jsx
// /posters — ангид өлгөх A0 постерууд. Гишүүд (14 хоногийн «Туршаад үзье» ч) үнэгүй татна.
import { useEffect, useState } from 'react';
import { Link, useSearchParams } from 'react-router-dom';
import Container from 'react-bootstrap/Container';
import Row from 'react-bootstrap/Row';
import Col from 'react-bootstrap/Col';
import Spinner from 'react-bootstrap/Spinner';
import Alert from 'react-bootstrap/Alert';
import ButtonGroup from 'react-bootstrap/ButtonGroup';
import Button from 'react-bootstrap/Button';
import ClassroomPosterCard from '../components/ClassroomPosterCard';
import { getClassroomPosters } from '../services/curriculumService';

const GRADES = [6, 7, 8, 9, 10, 11, 12];

const ClassroomPostersPage = () => {
  const [searchParams, setSearchParams] = useSearchParams();
  const grade = Number(searchParams.get('grade')) || null;
  const [posters, setPosters] = useState(null);
  const [error, setError] = useState(null);

  useEffect(() => {
    document.title = 'Ангид өлгөх A0 постер — MathMinds.Club';
  }, []);

  useEffect(() => {
    setPosters(null);
    getClassroomPosters(grade)
      .then(setPosters)
      .catch(() => setError('Постеруудыг ачаалж чадсангүй.'));
  }, [grade]);

  const pickGrade = (g) => setSearchParams(g ? { grade: String(g) } : {});
  const canDownload = posters?.some((p) => p.can_download);

  return (
    <Container className="py-4" style={{ maxWidth: 1100 }}>
      <h1 className="h4 fw-bold mb-1">Ангид өлгөх A0 постер</h1>
      <p className="text-muted mb-3">
        Долоо хоногийн сэдвийн томьёо, дүрмийг нэг хуудсанд — A0 (84×119 см) хэмжээгээр хэвлэхэд тод,
        вектор PDF. <strong>MathMinds-ийн гишүүд үнэгүй татна.</strong>
      </p>
      {posters && !canDownload && (
        <Alert variant="warning" className="d-flex flex-wrap align-items-center gap-2">
          <span className="me-auto">
            Багш та гишүүн болбол бүх A0 постерыг ангидаа үнэгүй хэвлэж өлгөнө.
            «Туршаад үзье» гишүүнчлэл ердөө 5,000₮ (14 хоног).
          </span>
          <Button as={Link} to="/membership?from=a0" size="sm">Гишүүн болох</Button>
        </Alert>
      )}
      <ButtonGroup size="sm" className="mb-3 flex-wrap">
        <Button variant={grade ? 'outline-secondary' : 'secondary'} onClick={() => pickGrade(null)}>Бүгд</Button>
        {GRADES.map((g) => (
          <Button key={g} variant={grade === g ? 'secondary' : 'outline-secondary'} onClick={() => pickGrade(g)}>
            {g}-р анги
          </Button>
        ))}
      </ButtonGroup>
      {error && <Alert variant="danger">{error}</Alert>}
      {!posters && !error && <div className="text-center py-5"><Spinner animation="border" /></div>}
      {posters?.length === 0 && <p className="text-muted">Энэ ангид A0 постер хараахан алга. Удахгүй нэмэгдэнэ.</p>}
      <Row xs={2} md={3} lg={4} className="g-3">
        {posters?.map((p) => (
          <Col key={p.id}><ClassroomPosterCard poster={p} showTopicLink /></Col>
        ))}
      </Row>
    </Container>
  );
};

export default ClassroomPostersPage;
