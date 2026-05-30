import React, { useEffect } from 'react';
import ReactDOM from 'react-dom';

export default function Modal({ title, onClose, children, footer, size = '' }) {
  useEffect(() => {
    const handler = (e) => { if (e.key === 'Escape') onClose(); };
    window.addEventListener('keydown', handler);
    return () => window.removeEventListener('keydown', handler);
  }, [onClose]);

  const handleOverlay = (e) => { if (e.target === e.currentTarget) onClose(); };

  return ReactDOM.createPortal(
    <div className="modal-overlay" onClick={handleOverlay}>
      <div className={`modal${size ? ' modal-' + size : ''}`}>
        <div className="modal-header">
          <h2 className="modal-title">{title}</h2>
          <button className="modal-close" onClick={onClose}>×</button>
        </div>
        <div className="modal-body">{children}</div>
        {footer && <div className="modal-footer">{footer}</div>}
      </div>
    </div>,
    document.body
  );
}
