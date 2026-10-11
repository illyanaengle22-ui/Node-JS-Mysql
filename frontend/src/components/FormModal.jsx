import { useEffect, useRef, useCallback } from 'react';

export default function FormModal({
  title,
  open,
  onClose,
  children,
  onSubmit,
  submitLabel = 'Guardar',
  footer,
  size = 'md',
  variant = 'default',
  closeOnOverlay = true,
  closeOnEsc = true,
}) {
  const overlayRef = useRef(null);
  const modalRef = useRef(null);
  const previousActiveElement = useRef(null);

  const handleKeyDown = useCallback(
    (e) => {
      if (e.key === 'Escape' && closeOnEsc) {
        e.stopPropagation();
        onClose?.();
        return;
      }

      // Focus trap
      if (e.key === 'Tab' && modalRef.current) {
        const focusableElements = modalRef.current.querySelectorAll(
          'button, [href], input, select, textarea, [tabindex]:not([tabindex="-1"])'
        );
        const firstElement = focusableElements[0];
        const lastElement = focusableElements[focusableElements.length - 1];

        if (e.shiftKey) {
          if (document.activeElement === firstElement) {
            e.preventDefault();
            lastElement?.focus();
          }
        } else {
          if (document.activeElement === lastElement) {
            e.preventDefault();
            firstElement?.focus();
          }
        }
      }
    },
    [closeOnEsc, onClose]
  );

  useEffect(() => {
    if (open) {
      previousActiveElement.current = document.activeElement;
      document.body.style.overflow = 'hidden';
      document.addEventListener('keydown', handleKeyDown);

      setTimeout(() => {
        const focusable = modalRef.current?.querySelector(
          'button, [href], input, select, textarea, [tabindex]:not([tabindex="-1"])'
        );
        focusable?.focus();
      }, 50);
    } else {
      document.body.style.overflow = '';
      document.removeEventListener('keydown', handleKeyDown);
      previousActiveElement.current?.focus();
    }

    return () => {
      document.body.style.overflow = '';
      document.removeEventListener('keydown', handleKeyDown);
    };
  }, [open, handleKeyDown]);

  if (!open) return null;

  const handleOverlayClick = (e) => {
    if (closeOnOverlay && e.target === overlayRef.current) {
      onClose?.();
    }
  };

  // Default footer if onSubmit is provided and no custom footer
  const defaultFooter = onSubmit ? (
    <button type="button" className="btn-ghost" onClick={onClose}>Cancelar</button>
  ) : null;

  return (
    <div
      className="modal-overlay"
      ref={overlayRef}
      onClick={handleOverlayClick}
      role="dialog"
      aria-modal="true"
      aria-label={title}
    >
      <div
        className={`modal-box modal-box--${size} modal-box--${variant}`}
        ref={modalRef}
        onClick={(e) => e.stopPropagation()}
      >
        <div className="modal-header">
          <h2>{title}</h2>
          <button type="button" className="modal-close" onClick={onClose} aria-label="Cerrar">
            <i className="fa-solid fa-xmark"></i>
          </button>
        </div>

        <div className="modal-body">
          {children}
          {(onSubmit || footer) && (
            <div className="modal-footer">
              {footer ? (
                footer
              ) : (
                <>
                  {defaultFooter}
                  <button
                    type="button"
                    onClick={() => {
                      const form = modalRef.current?.querySelector('form');
                      if (form) {
                        form.dispatchEvent(new Event('submit', { cancelable: true }));
                      } else {
                        onSubmit?.();
                      }
                    }}
                  >
                    {submitLabel}
                  </button>
                </>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
