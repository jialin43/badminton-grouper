import { useEffect, useState } from 'react';
import { DEFAULT_NOTICE } from '../types';
import type { EventInfo } from '../types';
import { formatFullCN, isValidTimeRange, parseDateParts } from '../lib/date';
import { loadRecentVenues, rememberVenue } from '../lib/storage';
import { Icon } from './Icon';
import { Sheet } from './Sheet';

interface EventSettingsSheetProps {
  open: boolean;
  event: EventInfo;
  groupCount: number;
  onClose: () => void;
  onSave: (event: EventInfo) => void;
}

export function EventSettingsSheet({
  open,
  event,
  groupCount,
  onClose,
  onSave,
}: EventSettingsSheetProps) {
  const [draft, setDraft] = useState<EventInfo>(event);
  const [recentVenues, setRecentVenues] = useState<string[]>([]);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!open) return;
    setDraft(event);
    setRecentVenues(loadRecentVenues());
    setError(null);
  }, [open, event]);

  const update = <Key extends keyof EventInfo>(
    key: Key,
    value: EventInfo[Key],
  ) => {
    setDraft((current) => ({ ...current, [key]: value }));
    if (error) setError(null);
  };

  const handleSave = () => {
    if (!parseDateParts(draft.date)) {
      setError('请选择有效的日期');
      return;
    }
    if (!isValidTimeRange(draft.startTime, draft.endTime)) {
      setError('结束时间需要晚于开始时间');
      return;
    }

    const next: EventInfo = {
      ...draft,
      title: draft.title.trim() || '本周羽毛球分组',
      venue: draft.venue.trim(),
      notice: draft.notice.trim().replace(/\s+/g, ' ') || DEFAULT_NOTICE,
    };

    if (next.venue) rememberVenue(next.venue);
    onSave(next);
    onClose();
  };

  return (
    <Sheet
      open={open}
      onClose={onClose}
      title="活动信息"
      subtitle="这些信息会出现在分组海报上"
      footer={
        <button type="button" className="btn btn-primary btn-block" onClick={handleSave}>
          <Icon name="check" size={18} />
          保存信息
        </button>
      }
    >
      <div className="form-stack">
        <label className="field">
          <span className="field-label">海报标题</span>
          <input
            className="field-input"
            value={draft.title}
            maxLength={32}
            placeholder="本周羽毛球分组"
            onChange={(event) => update('title', event.target.value)}
          />
        </label>

        <div className="field-row">
          <label className="field">
            <span className="field-label">
              <Icon name="calendar" size={14} />
              日期
            </span>
            <input
              className="field-input"
              type="date"
              value={draft.date}
              onChange={(event) => update('date', event.target.value)}
            />
          </label>

          <div className="field">
            <span className="field-label">
              <Icon name="shuttle" size={14} />
              时间
            </span>
            <div className="time-row">
              <input
                className="field-input"
                type="time"
                value={draft.startTime}
                aria-label="开始时间"
                onChange={(event) => update('startTime', event.target.value)}
              />
              <span className="time-dash">–</span>
              <input
                className="field-input"
                type="time"
                value={draft.endTime}
                aria-label="结束时间"
                onChange={(event) => update('endTime', event.target.value)}
              />
            </div>
          </div>
        </div>

        <p className="date-preview">
          {formatFullCN(draft.date) || '待选择日期'} · {draft.startTime}–
          {draft.endTime}
        </p>

        <label className="field">
          <span className="field-label">
            <Icon name="pin" size={14} />
            场馆 / 场地
          </span>
          <input
            className="field-input"
            value={draft.venue}
            maxLength={40}
            placeholder="例如：星光羽毛球馆"
            onChange={(event) => update('venue', event.target.value)}
          />
        </label>

        {recentVenues.length > 0 ? (
          <div className="venue-chips">
            <span>最近使用</span>
            {recentVenues.map((venue) => (
              <button
                type="button"
                key={venue}
                className={`venue-chip${draft.venue === venue ? ' is-active' : ''}`}
                onClick={() => update('venue', venue)}
              >
                {venue}
              </button>
            ))}
          </div>
        ) : null}

        <label className="field">
          <span className="field-label">
            <Icon name="alert" size={14} />
            球局提示
          </span>
          <textarea
            className="field-textarea"
            value={draft.notice}
            maxLength={120}
            rows={2}
            placeholder={DEFAULT_NOTICE}
            onChange={(event) => update('notice', event.target.value)}
          />
          <span className="field-help">显示在分组页底部和海报底部，可写场地规则或注意事项。</span>
        </label>

        <div className="settings-meta">
          <span>
            <Icon name="users" size={15} />
            {groupCount} 个场次
          </span>
          <span>
            <Icon name="shuttle" size={15} />
            每场 6 人 · 余下进后补
          </span>
        </div>

        {error ? (
          <div className="inline-alert" role="alert">
            <Icon name="alert" size={18} />
            <span>{error}</span>
          </div>
        ) : null}
      </div>
    </Sheet>
  );
}
