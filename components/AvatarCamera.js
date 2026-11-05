'use client';
import { useEffect, useRef, useState } from 'react';

// Small square output keeps the photo tiny enough to travel with every game view.
const SIZE = 128;
const QUALITY = 0.72;

export default function AvatarCamera({ onCapture, onClose }) {
  const videoRef = useRef(null);
  const streamRef = useRef(null);
  const [error, setError] = useState('');
  const [ready, setReady] = useState(false);
  const [shot, setShot] = useState(null);

  useEffect(() => {
    let cancelled = false;
    async function start() {
      if (!navigator.mediaDevices?.getUserMedia) {
        setError('This browser cannot use the camera here. Try a modern browser over HTTPS, or pick an emoji instead.');
        return;
      }
      try {
        const stream = await navigator.mediaDevices.getUserMedia({
          video: { facingMode: 'user', width: { ideal: 640 }, height: { ideal: 640 } },
          audio: false,
        });
        if (cancelled) { stream.getTracks().forEach(t => t.stop()); return; }
        streamRef.current = stream;
        if (videoRef.current) {
          videoRef.current.srcObject = stream;
          await videoRef.current.play().catch(() => {});
        }
      } catch (e) {
        if (cancelled) return;
        const name = e?.name;
        setError(
          name === 'NotAllowedError' || name === 'SecurityError'
            ? 'Camera access was blocked. Allow it in your browser settings and try again.'
            : name === 'NotFoundError' || name === 'OverconstrainedError'
              ? 'No camera was found on this device.'
              : name === 'NotReadableError'
                ? 'The camera is being used by another app. Close it and try again.'
                : 'Could not start the camera. Try again or pick an emoji.'
        );
      }
    }
    start();
    return () => {
      cancelled = true;
      streamRef.current?.getTracks().forEach(t => t.stop());
    };
  }, []);

  useEffect(() => {
    const close = e => { if (e.key === 'Escape') onClose(); };
    window.addEventListener('keydown', close);
    return () => window.removeEventListener('keydown', close);
  }, [onClose]);

  function capture() {
    const video = videoRef.current;
    if (!video || !video.videoWidth) return;
    const canvas = document.createElement('canvas');
    canvas.width = canvas.height = SIZE;
    const ctx = canvas.getContext('2d');
    const side = Math.min(video.videoWidth, video.videoHeight);
    const sx = (video.videoWidth - side) / 2;
    const sy = (video.videoHeight - side) / 2;
    ctx.save();
    ctx.translate(SIZE, 0);
    ctx.scale(-1, 1); // match the mirrored selfie preview
    ctx.drawImage(video, sx, sy, side, side, 0, 0, SIZE, SIZE);
    ctx.restore();
    setShot(canvas.toDataURL('image/jpeg', QUALITY));
  }

  function usePhoto() {
    if (shot) onCapture(shot);
    onClose();
  }

  return (
    <div className="modal-backdrop" onClick={onClose}>
      <div className="modal camera-modal" role="dialog" aria-modal="true" aria-labelledby="camera-title" onClick={e => e.stopPropagation()}>
        <h2 id="camera-title">Take a photo</h2>
        {error ? (
          <p className="camera-note" role="alert">{error}</p>
        ) : (
          <>
            <div className="camera-stage">
              <video ref={videoRef} autoPlay playsInline muted aria-label="Camera preview"
                onCanPlay={() => setReady(true)} />
              {shot && <img src={shot} alt="Your photo preview" />}
            </div>
            <p className="camera-note">{shot ? 'Happy with it?' : 'Centre your face in the frame.'}</p>
          </>
        )}
        <div className="camera-actions">
          {!error && (shot
            ? <>
                <button type="button" className="go" onClick={usePhoto}>Use this photo</button>
                <button type="button" className="camera-secondary" onClick={() => setShot(null)}>Retake</button>
              </>
            : <button type="button" className="go" onClick={capture} disabled={!ready}>Take photo</button>)}
          <button type="button" className="camera-secondary" onClick={onClose}>{error ? 'Close' : 'Cancel'}</button>
        </div>
      </div>
    </div>
  );
}
