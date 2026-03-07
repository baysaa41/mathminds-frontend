// EmojiPickerButton — textarea-д cursor байрлалд эможи оруулах товч
import { useState, useRef, useEffect } from 'react';
import EmojiPicker from 'emoji-picker-react';
import Button from 'react-bootstrap/Button';

const EmojiPickerButton = ({ textareaRef, onInsert, disabled = false }) => {
  const [show, setShow] = useState(false);
  const wrapperRef = useRef(null);

  useEffect(() => {
    const handleClickOutside = (e) => {
      if (wrapperRef.current && !wrapperRef.current.contains(e.target)) {
        setShow(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const handleEmojiClick = (emojiData) => {
    const emoji = emojiData.emoji;
    const textarea = textareaRef?.current;

    if (textarea) {
      const start = textarea.selectionStart ?? textarea.value.length;
      const end = textarea.selectionEnd ?? textarea.value.length;
      const newValue = textarea.value.slice(0, start) + emoji + textarea.value.slice(end);
      onInsert(newValue, start + emoji.length);
    } else {
      onInsert((prev) => prev + emoji);
    }
    setShow(false);
    textarea?.focus();
  };

  return (
    <div className="position-relative d-inline-block" ref={wrapperRef}>
      <Button
        type="button"
        variant="link"
        size="sm"
        className="p-0 text-secondary text-decoration-none"
        onClick={() => setShow((s) => !s)}
        disabled={disabled}
        title="Эможи"
      >
        <i className="bi bi-emoji-smile"></i>
      </Button>
      {show && (
        <div
          className="position-absolute"
          style={{ zIndex: 1050, bottom: '130%', left: 0 }}
        >
          <EmojiPicker
            onEmojiClick={handleEmojiClick}
            height={350}
            width={300}
            previewConfig={{ showPreview: false }}
            skinTonesDisabled
          />
        </div>
      )}
    </div>
  );
};

export default EmojiPickerButton;
