// frontend/src/pages/ConversationViewPage.jsx
// /messages/conversation/:conversationUuid хаягаар орсон үед
// MessagesPage-д тухайн харилцааг сонгосон байдлаар шилжүүлнэ

import { useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';

const ConversationViewPage = () => {
  const { conversationUuid } = useParams();
  const navigate = useNavigate();

  useEffect(() => {
    navigate('/messages', { replace: true, state: { conversationUuid } });
  }, [conversationUuid, navigate]);

  return null;
};

export default ConversationViewPage;
