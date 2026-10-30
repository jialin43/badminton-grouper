import { useDroppable } from '@dnd-kit/core';
import {
  SortableContext,
  rectSortingStrategy,
} from '@dnd-kit/sortable';
import type { Player } from '../types';
import { Icon } from './Icon';
import { PlayerCard } from './PlayerCard';

interface UnassignedPoolProps {
  players: Player[];
  onOpenMove: (playerId: string) => void;
  swapTargetId?: string | null;
}

export function UnassignedPool({
  players,
  onOpenMove,
  swapTargetId = null,
}: UnassignedPoolProps) {
  const { setNodeRef, isOver } = useDroppable({
    id: 'pool',
    data: { type: 'pool' },
  });

  return (
    <section
      ref={setNodeRef}
      className={`pool${isOver ? ' is-over' : ''}${
        players.length === 0 ? ' is-empty' : ''
      }`}
      aria-label={`后补名单，${players.length} 人`}
    >
      <header className="pool-head">
        <div className="pool-title">
          <Icon name="users" size={16} />
          <strong>后补名单</strong>
          <span>{players.length}</span>
        </div>
        <span className="pool-hint">
          {isOver ? '松开进入后补' : '拖到这里进入后补'}
        </span>
      </header>

      {players.length > 0 ? (
        <SortableContext
          items={players.map((player) => player.id)}
          strategy={rectSortingStrategy}
        >
          <div className="pool-grid">
            {players.map((player, index) => (
              <PlayerCard
                key={player.id}
                player={player}
                index={index}
                onOpenMove={onOpenMove}
                isSwapTarget={swapTargetId === player.id}
              />
            ))}
          </div>
        </SortableContext>
      ) : (
        <div className="pool-empty-line">
          <span className="pool-empty-dot" aria-hidden="true" />
          暂无后补 · 每个场次满 6 人
        </div>
      )}
    </section>
  );
}
