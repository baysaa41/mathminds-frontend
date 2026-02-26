import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import Card from 'react-bootstrap/Card';
import ListGroup from 'react-bootstrap/ListGroup';
import {
  History,
  FileText,
  Brain,
  FlaskConical,
  ClipboardList,
  Users,
  User,
  Bookmark,
  Bell,
  Mail,
  Link as LinkIcon,
  Bot,
  ShoppingBag,
} from 'lucide-react';

const STORAGE_KEY = 'mm_recent_links';
const MAX_LINKS = 10;

// Бүртгэхгүй path-ууд
const SKIP_PATHS = new Set(['/', '/login', '/register', '/callback', '/latex-examples']);

// Path → гарчиг хөрвүүлэх
function getBasicTitle(path) {
  if (SKIP_PATHS.has(path)) return null;
  if (/^\/problems\/[^/]+\/edit/.test(path)) return 'Бодлого засах';
  if (/^\/problems\/[^/]+/.test(path))       return 'Бодлого';
  if (path.startsWith('/problems'))           return 'Бодлогууд';
  if (/^\/articles\/[^/]+\/edit/.test(path)) return 'Өгүүлэл засах';
  if (/^\/articles\/[^/]+/.test(path))       return 'Өгүүлэл';
  if (path.startsWith('/articles'))           return 'Өгүүллүүд';
  if (/^\/formulas\/[^/]+\/edit/.test(path)) return 'Томьёо засах';
  if (/^\/formulas\/[^/]+/.test(path))       return 'Томьёо';
  if (path.startsWith('/formulas'))           return 'Томьёо';
  if (path.includes('/take'))                 return 'Тест бөглөх';
  if (path.includes('/result'))               return 'Тестийн үр дүн';
  if (/^\/quizzes\/[^/]+\/edit/.test(path))  return 'Тест засах';
  if (/^\/quizzes\/[^/]+/.test(path))        return 'Тест';
  if (path.startsWith('/quizzes'))            return 'Тестүүд';
  if (/^\/clubs\/\d+\/discussions/.test(path)) return 'Клуб / Хэлэлцүүлэг';
  if (/^\/clubs\/\d+\/curriculum/.test(path))  return 'Клуб / Хөтөлбөр';
  if (/^\/clubs\/\d+\/videos/.test(path))      return 'Клуб / Видео';
  if (/^\/clubs\/\d+\/media/.test(path))       return 'Клуб / Медиа';
  if (/^\/clubs\/\d+\/exercises/.test(path))   return 'Клуб / Дасгалууд';
  if (/^\/clubs\/\d+\/assignments/.test(path)) return 'Клуб / Даалгавар';
  if (/^\/clubs\/\d+\/quizzes/.test(path))     return 'Клуб / Тестүүд';
  if (/^\/clubs\/\d+\/exams/.test(path))       return 'Клуб / Шалгалт';
  if (/^\/clubs\/\d+\/members/.test(path))     return 'Клуб / Гишүүд';
  if (/^\/clubs\/\d+/.test(path))              return 'Клуб';
  if (path.startsWith('/clubs/create'))        return 'Клуб үүсгэх';
  if (path.startsWith('/clubs'))               return 'Клубууд';
  if (/^\/profile\/[^/]+/.test(path))        return 'Профайл';
  if (path.startsWith('/bookmarks'))          return 'Хадгалсан';
  if (path.startsWith('/notifications'))      return 'Мэдэгдэл';
  if (path.startsWith('/private-messages'))   return 'Захиа';
  if (path.startsWith('/messages'))           return 'Захиа';
  if (path.startsWith('/ai-chat'))            return 'AI чат';
  if (path.startsWith('/shop'))               return 'Дэлгүүр';
  if (path.startsWith('/post/'))              return 'Нийтлэл';
  return null;
}

function getPathIcon(path) {
  if (path.startsWith('/articles'))      return <FileText size={13} className="text-info flex-shrink-0" />;
  if (path.startsWith('/problems'))      return <Brain size={13} className="text-warning flex-shrink-0" />;
  if (path.startsWith('/formulas'))      return <FlaskConical size={13} className="text-success flex-shrink-0" />;
  if (path.startsWith('/quizzes'))       return <ClipboardList size={13} className="text-danger flex-shrink-0" />;
  if (path.startsWith('/clubs'))         return <Users size={13} className="text-primary flex-shrink-0" />;
  if (path.startsWith('/profile'))       return <User size={13} className="text-secondary flex-shrink-0" />;
  if (path.startsWith('/bookmarks'))     return <Bookmark size={13} className="text-warning flex-shrink-0" />;
  if (path.startsWith('/notifications')) return <Bell size={13} className="text-danger flex-shrink-0" />;
  if (path.startsWith('/messages') || path.startsWith('/private-messages'))
                                         return <Mail size={13} className="text-primary flex-shrink-0" />;
  if (path.startsWith('/ai-chat'))       return <Bot size={13} className="text-success flex-shrink-0" />;
  if (path.startsWith('/shop'))          return <ShoppingBag size={13} className="text-warning flex-shrink-0" />;
  return <LinkIcon size={13} className="text-secondary flex-shrink-0" />;
}

function getStoredLinks() {
  try {
    return JSON.parse(localStorage.getItem(STORAGE_KEY)) || [];
  } catch {
    return [];
  }
}

function saveAndNotify(links) {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(links));
}

const RecentlyVisitedWidget = () => {
  const [links, setLinks] = useState(getStoredLinks);

  // Layout.jsx-с патнаймчейнж event авах (клубын хуудас орно)
  useEffect(() => {
    const handlePathChange = ({ detail: { path } }) => {
      const title = getBasicTitle(path);
      if (!title) return;

      setLinks((prev) => {
        if (prev[0]?.path === path) return prev;
        const filtered = prev.filter((l) => l.path !== path);
        const updated = [{ path, title }, ...filtered].slice(0, MAX_LINKS);
        saveAndNotify(updated);
        return updated;
      });
    };

    window.addEventListener('pathnamechange', handlePathChange);
    return () => window.removeEventListener('pathnamechange', handlePathChange);
  }, []);

  // setPageTitle дуудагдвал тэр гарчгаар шинэчлэх (илүү нарийн нэр)
  useEffect(() => {
    const handleTitleUpdate = ({ detail: { path, title } }) => {
      // Клубын дэд хуудсанд (жишээ: /clubs/5/discussions) нэр + дэд зам нэгтгэх
      let finalTitle = title;
      const basicTitle = getBasicTitle(path);
      if (basicTitle && basicTitle.includes(' / ')) {
        const subLabel = basicTitle.split(' / ')[1];
        finalTitle = `${title} / ${subLabel}`;
      }

      setLinks((prev) => {
        const idx = prev.findIndex((l) => l.path === path);
        let updated;
        if (idx >= 0) {
          updated = prev.map((l) => (l.path === path ? { ...l, title: finalTitle } : l));
        } else {
          const filtered = prev.filter((l) => l.path !== path);
          updated = [{ path, title: finalTitle }, ...filtered].slice(0, MAX_LINKS);
        }
        saveAndNotify(updated);
        return updated;
      });
    };

    window.addEventListener('pagetitleupdate', handleTitleUpdate);
    return () => window.removeEventListener('pagetitleupdate', handleTitleUpdate);
  }, []);

  if (links.length === 0) return null;

  return (
    <Card className="border-0 shadow-sm">
      <Card.Header className="bg-white border-bottom d-flex align-items-center gap-2 py-2">
        <History size={15} className="text-primary" />
        <strong className="text-primary" style={{ fontSize: '0.875rem' }}>
          Сүүлд үзсэн
        </strong>
      </Card.Header>
      <ListGroup variant="flush">
        {links.map((link, i) => (
          <ListGroup.Item
            key={i}
            as={Link}
            to={link.path}
            action
            className="d-flex align-items-center gap-2 py-2 px-3 text-decoration-none"
            style={{ fontSize: '0.8rem' }}
          >
            {getPathIcon(link.path)}
            <span className="text-truncate">{link.title}</span>
          </ListGroup.Item>
        ))}
      </ListGroup>
    </Card>
  );
};

export default RecentlyVisitedWidget;
