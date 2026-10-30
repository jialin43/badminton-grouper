import { useSortable } from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';
import type { Player } from '../types';
import { showRoseBadge } from '../lib/player';
import { Icon } from './Icon';

interface PlayerCardProps {
  player: Player;
  index: number;
  onOpenMove: (playerId: string) => void;
  /** 跨组拖动时悬停在此卡片上，提示松手即互换。 */
  isSwapTarget?: boolean;
}

export function PlayerCard({
  player,
  index,
  onOpenMove,
  isSwapTarget = false,
}: PlayerCardProps) {
  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    transition,
    isDragging,
  } = useSortable({
    id: player.id,
    data: { type: 'player', playerId: player.id },
  });

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
  };

  return (
    <div
      ref={setNodeRef}
      style={style}
      data-player-card={player.id}
      className={`player-card${isDragging ? ' is-dragging' : ''}${
        player.isFemale ? ' is-female' : ''
      }${isSwapTarget ? ' is-swap-target' : ''}`}
      role="button"
      tabIndex={0}
      aria-label={`${player.name}${player.isFemale ? '，女生' : ''}，点按移动分组`}
      onClick={() => onOpenMove(player.id)}
      onKeyDown={(event) => {
        if (event.target !== event.currentTarget) return;
        if (event.key === 'Enter' || event.key === ' ') {
          event.preventDefault();
          onOpenMove(player.id);
        }
      }}
    >
      <span className="player-order">{String(index + 1).padStart(2, '0')}</span>
      <span className="player-name">
        {player.name}
        {showRoseBadge(player.name, player.isFemale) ? (
          <span className="player-rose" aria-label="女生">
            🌹
          </span>
        ) : null}
      </span>
      <button
        type="button"
        className="drag-handle"
        {...attributes}
        {...listeners}
        onClick={(event) => event.stopPropagation()}
        aria-label={`拖动 ${player.name}`}
        title="拖动调整"
      >
        <Icon name="grip" size={17} />
      </button>
    </div>
  );
}
