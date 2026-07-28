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

  // `className` (жишээ нь "d-block") нь эндхийн гадна span-д хэрэглэгдэнэ — OverlayTrigger-ийн
  // шууд хүүхэд элемент block өргөнөөр сунадаггүй, зөвхөн харагдах текстийн хэмжээтэй тул
  // Popper tooltip-ийг үзэгдэж буй текстийн дээр биш, бүтэн блокийн голд тавихаас сэргийлнэ.
  return (
    <span className={className}>
      <OverlayTrigger
        placement="top"
        overlay={<Tooltip>{fullDateTime}</Tooltip>}
      >
        <span style={{ cursor: 'help' }}>{displayText}</span>
      </OverlayTrigger>
    </span>
  );
}

export default PostTimestamp;
