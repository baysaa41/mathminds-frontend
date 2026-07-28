// src/pages/CurriculumAdminPage.jsx
import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { Container, Card, Tabs, Tab, Spinner } from 'react-bootstrap';
import { ChevronLeft, BookOpen } from 'lucide-react';
import * as svc from '../services/curriculumAdminService';
import ProgramsTab from '../components/curriculumAdmin/ProgramsTab.jsx';
import WeeklyTopicsTab from '../components/curriculumAdmin/WeeklyTopicsTab.jsx';

function CurriculumAdminPage() {
  const [programs, setPrograms] = useState([]);
  const [initLoading, setInitLoading] = useState(true);

  useEffect(() => {
    svc.getPrograms().then(res => {
      setPrograms(res.data);
    }).finally(() => setInitLoading(false));
  }, []);

  if (initLoading) {
    return (
      <div className="text-center py-5">
        <Spinner className="text-primary" />
      </div>
    );
  }

  return (
    <Container className="py-4">
      <div className="d-flex align-items-center mb-4 gap-2">
        <Link to="/admin" className="btn btn-sm btn-outline-secondary">
          <ChevronLeft size={16} />
        </Link>
        <h2 className="mb-0">
          <BookOpen size={24} className="me-2 text-primary" />
          Хичээлийн хөтөлбөр
        </h2>
      </div>

      <Card className="shadow-sm">
        <Card.Body>
          <Tabs defaultActiveKey="programs" className="mb-3">
            <Tab eventKey="programs" title="Хөтөлбөрүүд">
              <ProgramsTab />
            </Tab>
            <Tab eventKey="topics" title="Долоо хоногийн сэдвүүд">
              <WeeklyTopicsTab programs={programs} />
            </Tab>
          </Tabs>
        </Card.Body>
      </Card>
    </Container>
  );
}

export default CurriculumAdminPage;
