// src/components/RichTextEditor.jsx
// Tiptap ашигласан Rich Text Editor with Image Upload

import React, { useState } from 'react';
import { useEditor, EditorContent } from '@tiptap/react';
import StarterKit from '@tiptap/starter-kit';
import { Image } from '@tiptap/extension-image';
import { Link } from '@tiptap/extension-link';
import { Table } from '@tiptap/extension-table';
import { TableRow } from '@tiptap/extension-table-row';
import { TableCell } from '@tiptap/extension-table-cell';
import { TableHeader } from '@tiptap/extension-table-header';
import { Underline } from '@tiptap/extension-underline';
import { Placeholder } from '@tiptap/extension-placeholder';
import Button from 'react-bootstrap/Button';
import ButtonGroup from 'react-bootstrap/ButtonGroup';
import Form from 'react-bootstrap/Form';
import Modal from 'react-bootstrap/Modal';
import {
  Bold,
  Italic,
  Underline as UnderlineIcon,
  List,
  ListOrdered,
  Heading1,
  Heading2,
  Heading3,
  Code,
  Quote,
  Image as ImageIcon,
  Link as LinkIcon,
  Table as TableIcon,
  Minus,
  Undo,
  Redo,
} from 'lucide-react';
import apiClient from '../api/axiosConfig';

const RichTextEditor = ({ content = '', onChange, placeholder = 'Агуулга бичих...' }) => {
  const [showImageModal, setShowImageModal] = useState(false);
  const [showLinkModal, setShowLinkModal] = useState(false);
  const [imageFile, setImageFile] = useState(null);
  const [imagePreview, setImagePreview] = useState('');
  const [linkUrl, setLinkUrl] = useState('');
  const [linkText, setLinkText] = useState('');
  const [uploading, setUploading] = useState(false);

  const editor = useEditor({
    extensions: [
      StarterKit.configure({
        heading: {
          levels: [1, 2, 3],
        },
      }),
      Underline,
      Image.configure({
        inline: true,
        allowBase64: true,
      }),
      Link.configure({
        openOnClick: false,
        HTMLAttributes: {
          target: '_blank',
          rel: 'noopener noreferrer',
        },
      }),
      Table.configure({
        resizable: true,
      }),
      TableRow,
      TableHeader,
      TableCell,
      Placeholder.configure({
        placeholder,
      }),
    ],
    content,
    onUpdate: ({ editor }) => {
      onChange(editor.getHTML());
    },
  });

  if (!editor) {
    return null;
  }

  // Image upload handler
  const handleImageUpload = async () => {
    if (!imageFile) return;

    setUploading(true);
    const formData = new FormData();
    formData.append('image', imageFile);

    try {
      const response = await apiClient.post('/api/upload-image/', formData, {
        headers: { 'Content-Type': 'multipart/form-data' },
      });

      const imageUrl = response.data.url;
      editor.chain().focus().setImage({ src: imageUrl }).run();

      setShowImageModal(false);
      setImageFile(null);
      setImagePreview('');
    } catch (error) {
      console.error('Image upload failed:', error);
      alert('Зураг upload хийхэд алдаа гарлаа');
    } finally {
      setUploading(false);
    }
  };

  // Link handler
  const handleSetLink = () => {
    if (!linkUrl) return;

    if (linkText) {
      editor
        .chain()
        .focus()
        .insertContent(`<a href="${linkUrl}" target="_blank">${linkText}</a>`)
        .run();
    } else {
      editor.chain().focus().setLink({ href: linkUrl }).run();
    }

    setShowLinkModal(false);
    setLinkUrl('');
    setLinkText('');
  };

  const MenuBar = () => (
    <div
      className="border-bottom p-2 bg-light d-flex flex-wrap gap-1"
      style={{ position: 'sticky', top: 0, zIndex: 10 }}
    >
      {/* Text formatting */}
      <ButtonGroup size="sm">
        <Button
          variant={editor.isActive('bold') ? 'primary' : 'light'}
          onClick={() => editor.chain().focus().toggleBold().run()}
          title="Bold (Ctrl+B)"
        >
          <Bold size={16} />
        </Button>
        <Button
          variant={editor.isActive('italic') ? 'primary' : 'light'}
          onClick={() => editor.chain().focus().toggleItalic().run()}
          title="Italic (Ctrl+I)"
        >
          <Italic size={16} />
        </Button>
        <Button
          variant={editor.isActive('underline') ? 'primary' : 'light'}
          onClick={() => editor.chain().focus().toggleUnderline().run()}
          title="Underline (Ctrl+U)"
        >
          <UnderlineIcon size={16} />
        </Button>
      </ButtonGroup>

      {/* Headings */}
      <ButtonGroup size="sm">
        <Button
          variant={editor.isActive('heading', { level: 1 }) ? 'primary' : 'light'}
          onClick={() => editor.chain().focus().toggleHeading({ level: 1 }).run()}
          title="Heading 1"
        >
          <Heading1 size={16} />
        </Button>
        <Button
          variant={editor.isActive('heading', { level: 2 }) ? 'primary' : 'light'}
          onClick={() => editor.chain().focus().toggleHeading({ level: 2 }).run()}
          title="Heading 2"
        >
          <Heading2 size={16} />
        </Button>
        <Button
          variant={editor.isActive('heading', { level: 3 }) ? 'primary' : 'light'}
          onClick={() => editor.chain().focus().toggleHeading({ level: 3 }).run()}
          title="Heading 3"
        >
          <Heading3 size={16} />
        </Button>
      </ButtonGroup>

      {/* Lists */}
      <ButtonGroup size="sm">
        <Button
          variant={editor.isActive('bulletList') ? 'primary' : 'light'}
          onClick={() => editor.chain().focus().toggleBulletList().run()}
          title="Bullet List"
        >
          <List size={16} />
        </Button>
        <Button
          variant={editor.isActive('orderedList') ? 'primary' : 'light'}
          onClick={() => editor.chain().focus().toggleOrderedList().run()}
          title="Numbered List"
        >
          <ListOrdered size={16} />
        </Button>
      </ButtonGroup>

      {/* Code & Quote */}
      <ButtonGroup size="sm">
        <Button
          variant={editor.isActive('codeBlock') ? 'primary' : 'light'}
          onClick={() => editor.chain().focus().toggleCodeBlock().run()}
          title="Code Block"
        >
          <Code size={16} />
        </Button>
        <Button
          variant={editor.isActive('blockquote') ? 'primary' : 'light'}
          onClick={() => editor.chain().focus().toggleBlockquote().run()}
          title="Blockquote"
        >
          <Quote size={16} />
        </Button>
      </ButtonGroup>

      {/* Image & Link */}
      <ButtonGroup size="sm">
        <Button variant="light" onClick={() => setShowImageModal(true)} title="Insert Image">
          <ImageIcon size={16} />
        </Button>
        <Button variant="light" onClick={() => setShowLinkModal(true)} title="Insert Link">
          <LinkIcon size={16} />
        </Button>
      </ButtonGroup>

      {/* Table */}
      <ButtonGroup size="sm">
        <Button
          variant="light"
          onClick={() =>
            editor.chain().focus().insertTable({ rows: 3, cols: 3, withHeaderRow: true }).run()
          }
          title="Insert Table"
        >
          <TableIcon size={16} />
        </Button>
      </ButtonGroup>

      {/* Horizontal Rule */}
      <Button
        variant="light"
        size="sm"
        onClick={() => editor.chain().focus().setHorizontalRule().run()}
        title="Horizontal Line"
      >
        <Minus size={16} />
      </Button>

      {/* Undo/Redo */}
      <ButtonGroup size="sm" className="ms-auto">
        <Button
          variant="light"
          onClick={() => editor.chain().focus().undo().run()}
          disabled={!editor.can().undo()}
          title="Undo (Ctrl+Z)"
        >
          <Undo size={16} />
        </Button>
        <Button
          variant="light"
          onClick={() => editor.chain().focus().redo().run()}
          disabled={!editor.can().redo()}
          title="Redo (Ctrl+Y)"
        >
          <Redo size={16} />
        </Button>
      </ButtonGroup>
    </div>
  );

  return (
    <>
      <div className="border rounded" style={{ minHeight: '400px' }}>
        <MenuBar />
        <EditorContent editor={editor} className="p-3" style={{ minHeight: '350px' }} />
      </div>

      {/* Image Upload Modal */}
      <Modal show={showImageModal} onHide={() => setShowImageModal(false)} centered>
        <Modal.Header closeButton>
          <Modal.Title>Зураг оруулах</Modal.Title>
        </Modal.Header>
        <Modal.Body>
          <Form.Group className="mb-3">
            <Form.Label>Зураг сонгох</Form.Label>
            <Form.Control
              type="file"
              accept="image/*"
              onChange={(e) => {
                const file = e.target.files[0];
                if (file) {
                  setImageFile(file);
                  setImagePreview(URL.createObjectURL(file));
                }
              }}
            />
          </Form.Group>
          {imagePreview && (
            <div className="text-center">
              <img
                src={imagePreview}
                alt="Preview"
                style={{ maxWidth: '100%', maxHeight: '300px' }}
              />
            </div>
          )}
        </Modal.Body>
        <Modal.Footer>
          <Button variant="secondary" onClick={() => setShowImageModal(false)}>
            Болих
          </Button>
          <Button variant="primary" onClick={handleImageUpload} disabled={!imageFile || uploading}>
            {uploading ? 'Upload хийж байна...' : 'Оруулах'}
          </Button>
        </Modal.Footer>
      </Modal>

      {/* Link Modal */}
      <Modal show={showLinkModal} onHide={() => setShowLinkModal(false)} centered>
        <Modal.Header closeButton>
          <Modal.Title>Холбоос оруулах</Modal.Title>
        </Modal.Header>
        <Modal.Body>
          <Form.Group className="mb-3">
            <Form.Label>URL</Form.Label>
            <Form.Control
              type="url"
              placeholder="https://example.com"
              value={linkUrl}
              onChange={(e) => setLinkUrl(e.target.value)}
            />
          </Form.Group>
          <Form.Group className="mb-3">
            <Form.Label>Текст (сонгомол)</Form.Label>
            <Form.Control
              type="text"
              placeholder="Холбоосны текст"
              value={linkText}
              onChange={(e) => setLinkText(e.target.value)}
            />
            <Form.Text className="text-muted">
              Хоосон үлдээвэл сонгосон текстэд холбоос нэмнэ
            </Form.Text>
          </Form.Group>
        </Modal.Body>
        <Modal.Footer>
          <Button variant="secondary" onClick={() => setShowLinkModal(false)}>
            Болих
          </Button>
          <Button variant="primary" onClick={handleSetLink} disabled={!linkUrl}>
            Оруулах
          </Button>
        </Modal.Footer>
      </Modal>
    </>
  );
};

export default RichTextEditor;
