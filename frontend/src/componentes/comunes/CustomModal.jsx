// src/componentes/comunes/CustomModal.jsx
import { useCallback } from 'react';
import { createPortal } from 'react-dom';
import { RiCloseLine, RiAlertLine, RiCheckboxCircleLine, RiQuestionLine, RiInformationLine } from 'react-icons/ri';
import { useBodyScrollLock } from '../../hooks/useBodyScrollLock';
import { useEscapeKey } from '../../hooks/useEscapeKey';
import './CustomModal.css';

export const CustomModal = ({ 
  isOpen, 
  title, 
  message, 
  onConfirm, 
  onCancel, 
  type = 'confirm', // 'confirm' | 'alert'
  confirmText = 'Aceptar',
  cancelText = 'Cancelar',
  variant = 'warning' // 'warning' | 'danger' | 'success' | 'info'
}) => {
  // Bloqueo de scroll del fondo compatible con iOS (ver useBodyScrollLock).
  useBodyScrollLock(isOpen);

  // Cerrar con Escape: en un diálogo modal es obligatorio (WCAG 2.1.2).
  const dismiss = useCallback(() => {
    if (type === 'confirm' && onCancel) onCancel();
    else if (onConfirm) onConfirm();
  }, [type, onCancel, onConfirm]);

  useEscapeKey(isOpen, dismiss);

  if (!isOpen) return null;

  const getIcon = () => {
    switch (variant) {
      case 'danger':
        return <RiAlertLine className="custom-modal__icon custom-modal__icon--danger" />;
      case 'warning':
        return <RiAlertLine className="custom-modal__icon custom-modal__icon--warning" />;
      case 'success':
        return <RiCheckboxCircleLine className="custom-modal__icon custom-modal__icon--success" />;
      case 'info':
        return <RiInformationLine className="custom-modal__icon custom-modal__icon--info" />;
      default:
        return <RiQuestionLine className="custom-modal__icon" />;
    }
  };

  // Portal a document.body: evita que un ancestro con `transform`/`animation`
  // (p. ej. .page-transition) atrape el `position: fixed` y deje el header y el
  // footer fuera del fondo oscurecido.
  return createPortal(
    <div className="custom-modal-backdrop" onClick={dismiss}>
      <div
        className="custom-modal-container"
        onClick={(e) => e.stopPropagation()}
        role="dialog"
        aria-modal="true"
        aria-label={title}
      >
        <button 
          className="custom-modal-close" 
          onClick={type === 'confirm' ? onCancel : onConfirm} 
          aria-label="Cerrar modal"
        >
          <RiCloseLine />
        </button>
        
        <div className="custom-modal-content">
          <div className="custom-modal-header">
            {getIcon()}
            <h3>{title}</h3>
          </div>
          
          <div className="custom-modal-body">
            <p>{message}</p>
          </div>
          
          <div className="custom-modal-actions">
            {type === 'confirm' && (
              <button 
                type="button" 
                className="custom-modal-btn custom-modal-btn--cancel" 
                onClick={onCancel}
              >
                {cancelText}
              </button>
            )}
            <button 
              type="button" 
              className={`custom-modal-btn custom-modal-btn--confirm custom-modal-btn--${variant}`} 
              onClick={onConfirm}
            >
              {confirmText}
            </button>
          </div>
        </div>
      </div>
    </div>,
    document.body
  );
};
