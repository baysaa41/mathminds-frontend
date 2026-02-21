// components/PostTimestamp.jsx
// Постын он сарыг харуулах компонент - "10 минутын өмнө" эсвэл он сар

import React from 'react';
import { OverlayTrigger, Tooltip } from 'react-bootstrap';
import { formatDateTime, formatRelativeDate } from '../utils/dateFormatter';

/**
 * PostTimestamp компонент
 * @param {Object} props
 * @param {string} props.date - Он сар (ISO string)
 * @param {string} props.className - Нэмэлт CSS класс
 * @param {boolean} props.showTooltip - Tooltip харуулах эсэх (default: true)
 */
function PostTimestamp({ date, className = '', showTooltip = true }) {
  if (!date) return null;

  const displayText = formatRelativeDate(date);
  const fullDateTime = formatDateTime(date);

  if (!showTooltip) {
    return <span className={className}>{displayText}</span>;
  }

  return (
    <OverlayTrigger
      placement="top"
      overlay={<Tooltip>{fullDateTime}</Tooltip>}
    >
      <span className={className} style={{ cursor: 'help' }}>
        {displayText}
      </span>
    </OverlayTrigger>
  );
}

export default PostTimestamp;
