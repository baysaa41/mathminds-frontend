import React, { useRef, useEffect } from 'react';

// CSS-г импортлохын оронд загварыг JavaScript object хэлбэрээр тодорхойлов.
const styles = {
    editorWrapper: {
        border: '1px solid #dee2e6',
        borderRadius: '0.375rem',
        backgroundColor: 'white',
        transition: 'border-color .15s ease-in-out, box-shadow .15s ease-in-out',
    },
    editorWrapperDisabled: {
        backgroundColor: '#e9ecef',
        opacity: 1,
    },
    menu: {
        backgroundColor: '#f8f9fa',
        padding: '0.5rem',
        borderBottom: '1px solid #dee2e6',
        borderTopLeftRadius: '0.375rem',
        borderTopRightRadius: '0.375rem',
    },
    button: {
        background: 'none',
        border: '1px solid transparent',
        borderRadius: '0.25rem',
        padding: '0.25rem 0.5rem',
        marginRight: '0.25rem',
        cursor: 'pointer',
        fontSize: '0.875rem',
        fontWeight: 'bold',
    },
    editableArea: {
        padding: '0.5rem 0.75rem',
        minHeight: '250px',
        outline: 'none',
    },
};


// Editor-ийн удирдлагын товчлуурууд (Toolbar)
// Энэ нь гадны сан ашиглахгүйгээр ажиллах энгийн хувилбар юм.
const MenuBar = ({ onCommand }) => {
    return (
        <div style={styles.menu}>
            <button
                type="button"
                onClick={() => onCommand('bold')}
                title="Bold"
                style={styles.button}
            >
                B
            </button>
            <button
                type="button"
                onClick={() => onCommand('italic')}
                title="Italic"
                style={styles.button}
            >
                I
            </button>
            <button
                type="button"
                onClick={() => onCommand('insertUnorderedList')}
                title="Bullet List"
                style={styles.button}
            >
                ●
            </button>
            <button
                type="button"
                onClick={() => onCommand('insertOrderedList')}
                title="Ordered List"
                style={styles.button}
            >
                1.
            </button>
        </div>
    );
};

// Үндсэн Editor Компонент (Tiptap-ийн оронд contentEditable ашиглав)
const MyEditor = ({ initialContent = '', onContentChange, disabled = false }) => {
    const editorRef = useRef(null);

    // Анхны утгыг editor-д ачаалах зорилготой effect.
    // Энэ нь зөвхөн initialContent өөрчлөгдөхөд нэг удаа ажиллана.
    useEffect(() => {
        if (editorRef.current && initialContent !== editorRef.current.innerHTML) {
            editorRef.current.innerHTML = initialContent;
        }
    }, [initialContent]);

    // Хэрэглэгч бичих үед агуулгыг эх компонент руу илгээнэ.
    const handleInput = () => {
        if (onContentChange && editorRef.current) {
            onContentChange(editorRef.current.innerHTML);
        }
    };

    // Toolbar дээрх товчлуурын үйлдлийг гүйцэтгэнэ.
    const handleCommand = (command) => {
        // document.execCommand нь хуучирсан ч, гадны сан суулгахгүйгээр ажиллах
        // хамгийн энгийн арга юм.
        document.execCommand(command, false, null);
        editorRef.current.focus(); // Үйлдлийн дараа editor-г фокустай болгоно.
    };

    // Идэвхгүй үед ашиглах нэмэлт загвар
    const wrapperStyle = {
        ...styles.editorWrapper,
        ...(disabled ? styles.editorWrapperDisabled : {})
    };

    return (
        <div style={wrapperStyle}>
            {!disabled && <MenuBar onCommand={handleCommand} />}
            <div
                ref={editorRef}
                contentEditable={!disabled}
                onInput={handleInput}
                style={styles.editableArea}
                // contentEditable нь аюулгүй байдлын үүднээс анхааралтай ашиглах ёстой.
            />
        </div>
    );
};

export default MyEditor;

