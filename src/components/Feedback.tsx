import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useRef,
  useState,
} from 'react';
import type { ReactNode } from 'react';
import { createPortal } from 'react-dom';
import { Icon } from './Icon';

const ToastContext = createContext<(message: string) => void>(() => undefined);

export function useToast(): (message: string) => void {
  return useContext(ToastContext);
}

interface ToastState {
  id: number;
  message: string;
}

export function ToastProvider({ children }: { children: ReactNode }) {
  const [toast, setToast] = useState<ToastState | null>(null);
  const timerRef = useRef<number | null>(null);
  const idRef = useRef(0);

  const notify = useCallback((message: string) => {
    if (timerRef.current !== null) {
      window.clearTimeout(timerRef.current);
    }

    idRef.current += 1;
    setToast({ id: idRef.current, message });
    timerRef.current = window.setTimeout(() => {
      setToast(null);
      timerRef.current = null;
    }, 2600);
  }, []);

  useEffect(
    () => () => {
      if (timerRef.current !== null) {
        window.clearTimeout(timerRef.current);
      }
    },
    [],
  );

  return (
    <ToastContext.Provider value={notify}>
      {children}
      {toast
        ? createPortal(
            <div className="toast" role="status" aria-live="polite" key={toast.id}>
              <span className="toast-mark">
                <Icon name="check" size={15} strokeWidth={2.4} />
              </span>
              <span>{toast.message}</span>
            </div>,
            document.body,
          )
        : null}
    </ToastContext.Provider>
  );
}

export interface ConfirmOptions {
  title: string;
  message: string;
  confirmLabel?: string;
  cancelLabel?: string;
  danger?: boolean;
}

type ConfirmFn = (options: ConfirmOptions) => Promise<boolean>;

const ConfirmContext = createContext<ConfirmFn>(async () => false);

export function useConfirm(): ConfirmFn {
  return useContext(ConfirmContext);
}

export function ConfirmProvider({ children }: { children: ReactNode }) {
  const [options, setOptions] = useState<ConfirmOptions | null>(null);
  const resolverRef = useRef<((value: boolean) => void) | null>(null);
  const cancelRef = useRef<HTMLButtonElement | null>(null);

  const finish = useCallback((value: boolean) => {
    resolverRef.current?.(value);
    resolverRef.current = null;
    setOptions(null);
  }, []);

  const confirm = useCallback<ConfirmFn>((nextOptions) => {
    resolverRef.current?.(false);
    return new Promise<boolean>((resolve) => {
      resolverRef.current = resolve;
      setOptions(nextOptions);
    });
  }, []);

  useEffect(() => {
    if (!options) return;

    cancelRef.current?.focus();
    const onKeyDown = (event: KeyboardEvent) => {
      if (event.key === 'Escape') finish(false);
    };
    document.addEventListener('keydown', onKeyDown);
    return () => document.removeEventListener('keydown', onKeyDown);
  }, [options, finish]);

  return (
    <ConfirmContext.Provider value={confirm}>
      {children}
      {options
        ? createPortal(
            <div
              className="modal-backdrop"
              onMouseDown={(event) => {
                if (event.target === event.currentTarget) finish(false);
              }}
            >
              <div
                className="confirm-dialog"
                role="alertdialog"
                aria-modal="true"
                aria-labelledby="confirm-title"
                aria-describedby="confirm-message"
              >
                <div className={`confirm-icon${options.danger ? ' is-danger' : ''}`}>
                  <Icon name={options.danger ? 'trash' : 'alert'} size={22} />
                </div>
                <h2 id="confirm-title">{options.title}</h2>
                <p id="confirm-message">{options.message}</p>
                <div className="confirm-actions">
                  <button
                    ref={cancelRef}
                    type="button"
                    className="btn btn-quiet"
                    onClick={() => finish(false)}
                  >
                    {options.cancelLabel ?? '取消'}
                  </button>
                  <button
                    type="button"
                    className={`btn ${options.danger ? 'btn-danger' : 'btn-primary'}`}
                    onClick={() => finish(true)}
                  >
                    {options.confirmLabel ?? '确定'}
                  </button>
                </div>
              </div>
            </div>,
            document.body,
          )
        : null}
    </ConfirmContext.Provider>
  );
}
