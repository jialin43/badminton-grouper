import { DEFAULT_NOTICE } from '../types';
import { Icon } from './Icon';

interface NoticeCardProps {
  notice: string;
  onEdit: () => void;
}

export function NoticeCard({ notice, onEdit }: NoticeCardProps) {
  return (
    <section className="notice-card" aria-label="球局提示">
      <span className="notice-icon" aria-hidden="true">
        <Icon name="alert" size={18} />
      </span>
      <div className="notice-body">
        <span className="notice-label">球局提示</span>
        <p>{notice.trim() || DEFAULT_NOTICE}</p>
      </div>
      <button
        type="button"
        className="notice-edit"
        onClick={onEdit}
        aria-label="编辑球局提示"
      >
        <Icon name="edit" size={14} />
        编辑
      </button>
    </section>
  );
}
