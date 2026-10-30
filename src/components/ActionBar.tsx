import type { ReactNode } from 'react';
import { Icon } from './Icon';

interface ActionBarProps {
  primaryLabel: string;
  onPrimary: () => void;
  primaryDisabled?: boolean;
  primaryIcon?: ReactNode;
  secondaryLabel?: string;
  onSecondary?: () => void;
  hint?: string;
}

export function ActionBar({
  primaryLabel,
  onPrimary,
  primaryDisabled = false,
  primaryIcon,
  secondaryLabel,
  onSecondary,
  hint,
}: ActionBarProps) {
  return (
    <div className="action-bar">
      <div className="action-inner">
        {hint ? <p className="action-hint">{hint}</p> : null}
        <div className="action-row">
          {secondaryLabel && onSecondary ? (
            <button
              type="button"
              className="btn btn-quiet action-secondary"
              onClick={onSecondary}
            >
              <Icon name="arrow-left" size={17} />
              {secondaryLabel}
            </button>
          ) : null}
          <button
            type="button"
            className="btn btn-primary action-primary"
            onClick={onPrimary}
            disabled={primaryDisabled}
          >
            {primaryLabel}
            {primaryIcon ?? <Icon name="arrow-right" size={18} />}
          </button>
        </div>
      </div>
    </div>
  );
}
