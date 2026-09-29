// src/components/olympiad/PublicMaterialsCard.jsx
// Олимпиадын хуудсанд нийтэд нээлттэй материал (бодлого, бодолт…) — байхгүй бол юу ч харуулахгүй

import React, { useEffect, useState } from 'react';
import { Badge, Card, ListGroup } from 'react-bootstrap';
import { getPublicMaterials } from '../../services/olympiadService';

function PublicMaterialsCard({ slug }) {
  const [items, setItems] = useState([]);
  useEffect(() => { getPublicMaterials(slug).then(setItems).catch(() => setItems([])); }, [slug]);
  if (items.length === 0) return null;
  return (
    <Card className="mb-3">
      <Card.Header>Материал</Card.Header>
      <ListGroup variant="flush">
        {items.map((m) => (
          <ListGroup.Item key={m.id} action href={m.file_url || m.url} target="_blank" rel="noreferrer">
            <Badge bg="secondary" className="me-2">{m.kind_label}</Badge>{m.title}
          </ListGroup.Item>
        ))}
      </ListGroup>
    </Card>
  );
}

export default PublicMaterialsCard;
