import { useEffect, useRef, useState } from 'react';
import type { Player } from '../types';
import { showRoseBadge } from '../lib/player';
import { useToast } from './Feedback';
import { Icon } from './Icon';

interface RosterRowProps {
  player: Player;
  index: number;
  onRename: (id: string, name: string) => void;
  onToggleFemale: (id: string) => void;
  onRemove: (id: string) => void;
}

const TONES = 6;

function toneFor(name: string): number {
  let hash = 0;
  for (const char of name) {
    hash = (hash * 31 + (char.codePointAt(0) ?? 0)) % 997;
  }
  return hash % TONES;
}

function initialFor(name: string): string {
  return Array.from(name.trim())[0] ?? '?';
}

export function RosterRow({
  player,
  index,
  onRename,
  onToggleFemale,
  onRemove,
}: RosterRowProps) {
  const [draft, setDraft] = useState(player.name);
  const notify = useToast();
  const inputRef = useRef<HTMLInputElement | null>(null);

  useEffect(() => {
    setDraft(player.name);
  }, [player.name]);

  const commit = () => {
    const next = draft.trim().replace(/🌹/gu, '').trim();
    if (!next) {
      setDraft(player.name);
      notify('昵称不能为空');
      return;
    }
    if (next !== player.name) {
      onRename(player.id, next);
    }
  };

  return (
    <div className="roster-row">
      <span className={`roster-avatar tone-${toneFor(player.name)}`}>
        {initialFor(player.name)}
      </span>

      <div className="roster-main">
        <div className="roster-name-line">
          <input
            ref={inputRef}
            className="roster-name-input"
            value={draft}
            maxLength={30}
            aria-label={`第 ${index + 1} 位成员昵称`}
            onChange={(event) => setDraft(event.target.value)}
            onBlur={commit}
            onKeyDown={(event) => {
              if (event.key === 'Enter') {
                event.preventDefault();
                inputRef.current?.blur();
              }
              if (event.key === 'Escape') {
                setDraft(player.name);
                inputRef.current?.blur();
              }
            }}
          />
          {showRoseBadge(player.name, player.isFemale) ? (
            <span className="roster-rose" title="女生" aria-label="女生">
              🌹
            </span>
          ) : null}
        </div>
        <span className="roster-index">NO.{String(index + 1).padStart(2, '0')}</span>
      </div>

      <button
        type="button"
        className={`rose-toggle${player.isFemale ? ' is-on' : ''}`}
        onClick={() => onToggleFemale(player.id)}
        aria-pressed={player.isFemale}
        aria-label={`${player.name}：${player.isFemale ? '取消女生标记' : '标记为女生'}`}
        title="切换女生标记"
      >
        <span aria-hidden="true">女</span>
      </button>

      <button
        type="button"
        className="icon-button danger-ghost"
        onClick={() => onRemove(player.id)}
        aria-label={`删除 ${player.name}`}
        title="删除成员"
      >
        <Icon name="trash" size={18} />
      </button>
    </div>
  );
}
