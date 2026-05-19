// frontend/src/components/EmbedRenderer.jsx
import React, { useEffect, useRef } from 'react';
import { Alert } from 'react-bootstrap';
import YouTubePlayer from './YouTubePlayer';
import VimeoPlayer from './VimeoPlayer';

// Facebook post/video embed component
const FacebookEmbed = ({ url }) => {
  const isVideo = /facebook\.com\/(?:[^/]+\/videos\/|watch)|fb\.watch\//.test(url);
  const plugin = isVideo ? 'video' : 'post';
  const src = `https://www.facebook.com/plugins/${plugin}.php?href=${encodeURIComponent(url)}&show_text=true&width=500`;

  return (
    <div className="mt-2" style={{ maxWidth: 500 }}>
      <iframe
        src={src}
        width="500"
        height={isVideo ? 280 : 200}
        style={{ border: 'none', overflow: 'hidden', width: '100%' }}
        scrolling="no"
        frameBorder="0"
        allow="autoplay; clipboard-write; encrypted-media; picture-in-picture; web-share"
        allowFullScreen
      />
    </div>
  );
};

// X (Twitter) tweet embed component
const TwitterEmbed = ({ url }) => {
  const ref = useRef(null);

  useEffect(() => {
    if (!ref.current) return;
    if (window.twttr?.widgets) {
      window.twttr.widgets.load(ref.current);
    } else {
      const script = document.createElement('script');
      script.src = 'https://platform.twitter.com/widgets.js';
      script.async = true;
      script.onload = () => window.twttr?.widgets?.load(ref.current);
      document.body.appendChild(script);
    }
  }, [url]);

  // x.com → twitter.com (Twitter embed widget зөвхөн twitter.com URL дэмждэг)
  const embedUrl = url.replace('x.com', 'twitter.com');

  return (
    <div ref={ref} className="mt-2" style={{ maxWidth: 550 }}>
      <blockquote className="twitter-tweet" data-dnt="true">
        <a href={embedUrl}>{embedUrl}</a>
      </blockquote>
    </div>
  );
};

/**
 * Backend-с ирсэн embed_link-г хүлээн авч,
 * зөв тоглуулагч болгон хувиргадаг компонент.
 */
const EmbedRenderer = ({ url, postId }) => {
  let embedUrl = null;
  let provider = null;

  if (!url) return null;

  try {
    // 1. YouTube - YouTubePlayer компонент ашиглах (progress tracking-тэй)
    let ytMatch = url.match(/^.*(youtu.be\/|v\/|u\/\w\/|embed\/|watch[?]v=|[&]v=)([^#&?]*).*/);
    if (ytMatch && ytMatch[2].length === 11) {
      return <YouTubePlayer videoId={ytMatch[2]} postId={postId} />;
    }

    // 2. Vimeo - VimeoPlayer компонент ашиглах (progress tracking-тэй)
    let vimeoMatch = url.match(/vimeo\.com\/(?:video\/)?([0-9]+)/);
    if (vimeoMatch?.[1]) {
      return <VimeoPlayer videoId={vimeoMatch[1]} postId={postId} />;
    }

    // 3. X (Twitter)
    if (/(?:x\.com|twitter\.com)\/[^/]+\/status\/[0-9]+/.test(url)) {
      return <TwitterEmbed url={url} />;
    }

    // 4. Facebook
    if (/(?:facebook\.com\/(?:[^/\s]+\/(?:posts|videos)\/|permalink\.php|photo(?:\.php)?\?|watch)|fb\.watch\/)/.test(url)) {
      return <FacebookEmbed url={url} />;
    }

    // 5. Dailymotion
    let dmMatch = url.match(/dailymotion\.com\/(?:video\/|embed\/video\/|)(.+)/);
    if (dmMatch?.[1]) {
      embedUrl = `https://www.dailymotion.com/embed/video/${dmMatch[1].split('_')[0]}`;
      provider = 'dailymotion';
    } else {
      let daiLyMatch = url.match(/dai\.ly\/([a-zA-Z0-9]+)/);
      if (daiLyMatch?.[1]) {
        embedUrl = `https://www.dailymotion.com/embed/video/${daiLyMatch[1]}`;
        provider = 'dailymotion';
      }
    }

    if (embedUrl) {
      return (
        <div
          className="ratio ratio-16x9 mt-2 rounded"
          style={{ maxWidth: '560px', overflow: 'hidden', border: '1px solid #dee2e6' }}
        >
          <iframe
            src={embedUrl}
            title={`Embedded video from ${provider}`}
            frameBorder="0"
            allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share"
            allowFullScreen
          />
        </div>
      );
    }

    // Танигдаагүй линк — дангаар харуулна
    return (
      <div className="mt-2">
        <a href={url} target="_blank" rel="noopener noreferrer">{url}</a>
      </div>
    );
  } catch (error) {
    console.error('EmbedRenderer error:', error);
    return (
      <Alert variant="warning" className="mt-2 small">
        Контентыг харуулахад алдаа гарлаа.
      </Alert>
    );
  }
};

export default EmbedRenderer;
