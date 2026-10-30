import { useRef, useState } from 'react';
import { useDroppable } from '@dnd-kit/core';
import {
  SortableContext,
  rectSortingStrategy,
} from '@dnd-kit/sortable';
import type { Group, Player } from '../types';
import { PlayerCard } from './PlayerCard';
import { Icon } from './Icon';
import { useToast } from './Feedback';

interface GroupCardProps {
  group: Group;
  players: Player[];
  capacity: number;
  otherLabels: string[];
  onOpenMove: (playerId: string) => void;
  swapTargetId?: string | null;
  onRename: (id: string, label: string) => void;
  onRemove: (id: string) => void;
}

function GroupLabel({
  group,
  otherLabels,
  onRename,
}: {
  group: Group;
  otherLabels: string[];
  onRename: (id: string, label: string) => void;
}) {
  const [editing, setEditing] = useState(false);
  const [draft, setDraft] = useState(group.label);
  const inputRef = useRef<HTMLInputElement | null>(null);
  const notify = useToast();

  const startEditing = () => {
    setDraft(group.label);
    setEditing(true);
  };

  const commit = () => {
    const next = draft.trim().slice(0, 12);
    if (!next) {
      setEditing(false);
      setDraft(group.label);
      return;
    }
    if (next !== group.label && otherLabels.includes(next)) {
      notify('已有同名小组，换一个名字吧');
      setEditing(false);
      setDraft(group.label);
      return;
    }
    onRename(group.id, next);
    setEditing(false);
  };

  if (editing) {
    return (
      <input
        ref={inputRef}
        className="group-label-input"
        value={draft}
        maxLength={12}
        autoFocus
        aria-label="小组名称"
        onChange={(event) => setDraft(event.target.value)}
        onBlur={commit}
        onKeyDown={(event) => {
          if (event.key === 'Enter') {
            event.preventDefault();
            inputRef.current?.blur();
          }
          if (event.key === 'Escape') {
            setDraft(group.label);
            setEditing(false);
          }
        }}
      />
    );
  }

  return (
    <button
      type="button"
      className="group-title"
      onClick={startEditing}
      title="点击修改小组名称"
    >
      {group.label}
      <Icon name="edit" size={13} />
    </button>
  );
}

export function GroupCard({
  group,
  players,
  capacity,
  otherLabels,
  onOpenMove,
  swapTargetId = null,
  onRename,
  onRemove,
}: GroupCardProps) {
  const { setNodeRef, isOver } = useDroppable({
    id: `group:${group.id}`,
    data: { type: 'group', groupId: group.id },
  });

  const isFull = players.length >= capacity;
  const isIncomplete = players.length > 0 && players.length < capacity;

  return (
    <section
      ref={setNodeRef}
      className={`group-card${isOver ? ' is-over' : ''}${
        isFull ? ' is-full' : ''
      }${isIncomplete ? ' is-incomplete' : ''}`}
      aria-label={`${group.label}，${players.length} 人，${
        isIncomplete
          ? `未满 ${capacity} 人`
          : players.length >= capacity
            ? `已满 ${capacity} 人`
            : '空场次'
      }`}
    >
      <header className="group-head">
        <div className="group-title-wrap">
          <span className="group-index-mark" aria-hidden="true" />
          <GroupLabel
            group={group}
            otherLabels={otherLabels}
            onRename={onRename}
          />
        </div>
        <div className="group-head-right">
          {isIncomplete ? (
            <span className="incomplete-badge">未满</span>
          ) : null}
          <span className={`count-pill${isFull ? ' is-full' : ''}`}>
            {players.length}/{capacity}
          </span>
          {players.length === 0 ? (
            <button
              type="button"
              className="icon-button danger-ghost"
              onClick={() => onRemove(group.id)}
              aria-label={`删除空小组 ${group.label}`}
              title="删除空小组"
            >
              <Icon name="trash" size={16} />
            </button>
          ) : null}
        </div>
      </header>

      <SortableContext items={group.playerIds} strategy={rectSortingStrategy}>
        <div className="player-grid">
          {Array.from({ length: capacity }).map((_, index) => {
            const player = players[index];
            return player ? (
              <PlayerCard
                key={player.id}
                player={player}
                index={index}
                onOpenMove={onOpenMove}
                isSwapTarget={swapTargetId === player.id}
              />
            ) : (
              <div className="empty-slot" key={`empty-${index}`}>
                <span>空位</span>
              </div>
            );
          })}
        </div>
      </SortableContext>

      {isOver ? <span className="drop-hint">松开加入</span> : null}
    </section>
  );
}
