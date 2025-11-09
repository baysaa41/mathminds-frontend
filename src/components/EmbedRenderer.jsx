// frontend/src/components/EmbedRenderer.jsx
import React from 'react';
import { Alert } from 'react-bootstrap';

/**
 * Backend-с ирсэн embed_link-г хүлээн авч,
 * зөв видео тоглуулагч болгон хувиргадаг компонент.
 */
const EmbedRenderer = ({ url }) => {
    let embedUrl = null;
    let provider = null;

    if (!url) return null;

    try {
        // 1. YouTube
        // (youtu.be/ID эсвэл youtube.com/watch?v=ID)
        let ytMatch = url.match(/^.*(youtu.be\/|v\/|u\/\w\/|embed\/|watch\?v=|\&v=)([^#\&\?]*).*/);
        if (ytMatch && ytMatch[2].length === 11) {
            embedUrl = `https://www.youtube.com/embed/${ytMatch[2]}`;
            provider = 'youtube';
        }

        // 2. Vimeo
        if (!embedUrl) {
            // (vimeo.com/ID)
            let vimeoMatch = url.match(/vimeo\.com\/(?:video\/)?([0-9]+)/);
            if (vimeoMatch && vimeoMatch[1]) {
                embedUrl = `https://player.vimeo.com/video/${vimeoMatch[1]}`;
                provider = 'vimeo';
            }
        }

        // 3. Dailymotion
        if (!embedUrl) {
            // (dailymotion.com/video/ID эсвэл dai.ly/ID)
            let dmMatch = url.match(/dailymotion\.com\/(?:video\/|embed\/video\/|)(.+)/);
            if (dmMatch && dmMatch[1]) {
                const id = dmMatch[1].split('_')[0];
                embedUrl = `https://www.dailymotion.com/embed/video/${id}`;
                provider = 'dailymotion';
            } else {
                let daiLyMatch = url.match(/dai\.ly\/([a-zA-Z0-9]+)/);
                if (daiLyMatch && daiLyMatch[1]) {
                    embedUrl = `https://www.dailymotion.com/embed/video/${daiLyMatch[1]}`;
                    provider = 'dailymotion';
                }
            }
        }

        // Хэрэв танигдсан видео байвал iframe буцаана
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
                    ></iframe>
                </div>
            );
        }

        // Хэрэв Backend линкийг хадгалсан ч энд танигдахгүй бол (жишээ нь, шинэ provider)
        // зүгээр л линкийг нь харуулна.
        return (
            <div className="mt-2">
                <a href={url} target="_blank" rel="noopener noreferrer">{url}</a>
            </div>
        );

    } catch (error) {
        console.error("EmbedRenderer error:", error);
        return <Alert variant="warning" className="mt-2 small">Видеог харуулахад алдаа гарлаа.</Alert>;
    }
};

export default EmbedRenderer;