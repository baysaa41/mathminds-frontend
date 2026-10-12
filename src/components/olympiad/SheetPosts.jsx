// src/components/olympiad/SheetPosts.jsx
// Скан хийсэн бодолтын хуудсуудыг бодлого бүрээр багцалж пост хэлбэрээр харуулна:
// толгой (оролцогч, бодлого, хуудасны тоо) + хуудсууд дарааллаараа бүтэн өргөнөөр.

import React, { useEffect, useMemo, useRef, useState } from 'react';
import { Alert, Badge, Button, Card } from 'react-bootstrap';
import Viewer from 'viewerjs';
import 'viewerjs/dist/viewer.css';

const isPdf = (url) => /\.pdf(\?|$)/i.test(url || '');

// Доторх бүх зургийг нэг viewer-ээр (томруулах, эргүүлэх, өмнөх/дараах) — жишээ нь нэг бодлогын бүх оролцогчийн
// хуудсыг дараалан үзнэ. Гарчиг нь зургийн alt (оролцогч · бодлого · хуудас). depsKey өөрчлөгдөхөд дахин үүсгэнэ.
export function SheetViewer({ depsKey, children }) {
  const ref = useRef(null);
  useEffect(() => {
    if (!ref.current || !ref.current.querySelector('img')) return undefined;
    const viewer = new Viewer(ref.current, {
      toolbar: {
        zoomIn: 1, zoomOut: 1, oneToOne: 1, reset: 1, prev: 1, play: 0, next: 1,
        rotateLeft: 1, rotateRight: 1, flipHorizontal: 0, flipVertical: 0,
      },
      navbar: true,
      title: [1, (image) => image.alt],
    });
    return () => viewer.destroy();
  }, [depsKey]);
  return <div ref={ref}>{children}</div>;
}

// pages: зураг бүрийн OMR-ээр уншсан хуудасны дугаар (үгүй бол дарааллын дугаар)
export function SheetPost({ title, subtitle, images, pages, variant }) {
  const pageNo = (i) => pages?.[i] ?? i + 1;
  const caption = [title, subtitle].filter(Boolean).join(' · ');
  return (
    <Card className={`mb-3 ${variant === 'warning' ? 'border-warning' : ''}`}>
      <Card.Header className="d-flex justify-content-between align-items-center flex-wrap gap-1 bg-white">
        <div>
          <div className="fw-semibold">{title}</div>
          {subtitle && <div className="small text-muted">{subtitle}</div>}
        </div>
        <Badge bg="light" text="dark" className="border">{images.length} хуудас</Badge>
      </Card.Header>
      <Card.Body className="p-2 p-md-3">
        {images.map((url, i) => (
          <figure key={url} className="mb-3">
            <div className="small text-muted mb-1">Хуудас {pageNo(i)}</div>
            {isPdf(url) ? (
              <a href={url} target="_blank" rel="noreferrer">PDF нээх</a>
            ) : (
              // Дарахад viewer нээгдэнэ (SheetViewer-т ороосон үед)
              <img src={url} alt={`${caption} · Хуудас ${pageNo(i)}`} loading="lazy"
                   className="img-fluid border rounded w-100"
                   style={{ maxWidth: 820, display: 'block', margin: '0 auto', cursor: 'zoom-in' }} />
            )}
          </figure>
        ))}
      </Card.Body>
    </Card>
  );
}

// Админ: бодлого сонгоод тухайн бодлогын бүх оролцогчийн бодолтыг пост болгон (засагч нэг бодлогоор дамжин үзнэ)
export function AdminSheetGallery({ images }) {
  const { problems, byProblem, unmatched } = useMemo(() => {
    const map = new Map();  // problem_no → Map(registration_id → {title, images})
    const loose = [];
    images.forEach((im) => {
      if (im.problem_no == null) { loose.push(im.url); return; }
      if (!map.has(im.problem_no)) map.set(im.problem_no, new Map());
      const regs = map.get(im.problem_no);
      if (!regs.has(im.registration_id)) {
        regs.set(im.registration_id, { no: im.participant_no, name: im.full_name, items: [] });
      }
      regs.get(im.registration_id).items.push({ url: im.url, page: im.page_no });
    });
    const sortedProblems = [...map.keys()].sort((a, b) => a - b);
    const grouped = Object.fromEntries(sortedProblems.map((p) => [p,
      [...map.get(p).values()].sort((a, b) => (a.no ?? 1e9) - (b.no ?? 1e9)).map((g) => {
        // хуудсыг уншсан дугаараар нь багаас их рүү (дугаар нь уншигдаагүй нь төгсгөлд)
        const items = [...g.items].sort((x, y) => (x.page ?? 1e9) - (y.page ?? 1e9));
        return { ...g, images: items.map((it) => it.url), pages: items.map((it) => it.page) };
      })]));
    return { problems: sortedProblems, byProblem: grouped, unmatched: loose };
  }, [images]);
  const [picked, setPicked] = useState(null);
  const problem = picked ?? problems[0];

  if (!images.length) return <div className="text-muted small">Upload хийсэн хуудас алга.</div>;
  return (
    <>
      {unmatched.length > 0 && (
        <SheetViewer depsKey={unmatched.join('|')}>
          <SheetPost variant="warning" title="⚠️ Холбогдоогүй хуудас"
                     subtitle="QR танигдаагүй эсвэл эхний QR-ээс өмнөх хуудсууд" images={unmatched} />
        </SheetViewer>
      )}
      {problems.length > 0 && (
        <>
          <div className="d-flex gap-2 flex-wrap mb-3">
            {problems.map((p) => (
              <Button key={p} size="sm" variant={p === problem ? 'primary' : 'outline-primary'} onClick={() => setPicked(p)}>
                Бодлого {p} <Badge bg="light" text="dark" className="ms-1">{byProblem[p].length}</Badge>
              </Button>
            ))}
          </div>
          {/* Сонгосон бодлогын бүх оролцогчийн хуудас нэг viewer-т — дараагийн оролцогч руу шууд шилжинэ */}
          <SheetViewer depsKey={`${problem}:${(byProblem[problem] || []).flatMap((g) => g.images).join('|')}`}>
            {byProblem[problem]?.map((g) => (
              <SheetPost key={`${problem}-${g.no}-${g.name}`} title={`№${g.no ?? '-'} ${g.name}`}
                         subtitle={`Бодлого ${problem}`} images={g.images} pages={g.pages} />
            ))}
          </SheetViewer>
        </>
      )}
      {!problems.length && !unmatched.length && <Alert variant="light">Хуудас алга.</Alert>}
    </>
  );
}
