// Богино текст (гарчиг, сэдвийн нэр, AI тайлбар) дотор LaTeX ($...$, \(...\) г.м.)
// байвал MathJax-аар, үгүй бол энгийн текстээр харуулна — LaTeX-гүй мөр бүрт
// MathJax typeset хийж хуудас удаашруулахгүйн тулд.
import { MathJax } from 'better-react-mathjax';

const HAS_MATH_RE = /\$|\\\(|\\\[/;

const MathText = ({ children, as: Tag = 'span', className, style }) => {
  const text = children ?? '';
  if (typeof text !== 'string' || !HAS_MATH_RE.test(text)) {
    return <Tag className={className} style={style}>{text}</Tag>;
  }
  return (
    <Tag className={className} style={style}>
      <MathJax dynamic inline>{text}</MathJax>
    </Tag>
  );
};

export default MathText;
