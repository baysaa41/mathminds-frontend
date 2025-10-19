// frontend/src/components/RightSidebar.jsx

import Card from 'react-bootstrap/Card';
import Form from 'react-bootstrap/Form';
import ListGroup from 'react-bootstrap/ListGroup';
import InputGroup from 'react-bootstrap/InputGroup';
import { Search } from 'lucide-react';

const RightSidebar = () => (
    <div className="p-3">
        {/* Хайлтын Card */}
        <Card className="mb-3 shadow-sm">
            <Card.Body>
                <Card.Title as="h5" className="fw-bold mb-3">Хайлт</Card.Title>
                <InputGroup>
                    <InputGroup.Text>
                        <Search size={18} />
                    </InputGroup.Text>
                    <Form.Control
                        type="text"
                        placeholder="Хайх..."
                    />
                </InputGroup>
            </Card.Body>
        </Card>

        {/* Чиг хандлагын Card */}
        <Card className="shadow-sm">
            <Card.Body>
                <Card.Title as="h5" className="fw-bold mb-3">Чиг хандлага</Card.Title>
                <ListGroup variant="flush">
                    <ListGroup.Item action className="border-0 px-0 pt-0 pb-2">
                        <div className="fw-semibold text-primary">#КвадратТэгшитгэл</div>
                        <div className="text-muted small">1.2K постууд</div>
                    </ListGroup.Item>
                    <ListGroup.Item action className="border-0 px-0 py-2">
                        <div className="fw-semibold text-primary">#Интеграл</div>
                        <div className="text-muted small">980 постууд</div>
                    </ListGroup.Item>
                    <ListGroup.Item action className="border-0 px-0 pt-2 pb-0">
                        <div className="fw-semibold text-primary">#МагадлалынОнол</div>
                        <div className="text-muted small">750 постууд</div>
                    </ListGroup.Item>
                </ListGroup>
            </Card.Body>
        </Card>
    </div>
);

export default RightSidebar;