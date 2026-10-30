import { locatePlayer } from '../lib/grouping';
import { showRoseBadge } from '../lib/player';
import type { AppState } from '../types';
import { Icon } from './Icon';
import { Sheet } from './Sheet';

interface MoveSheetProps {
  open: boolean;
  playerId: string | null;
  state: AppState;
  onClose: () => void;
  onMove: (playerId: string, targetGroupId: string | null) => void;
}

export function MoveSheet({
  open,
  playerId,
  state,
  onClose,
  onMove,
}: MoveSheetProps) {
  const player = state.players.find((entry) => entry.id === playerId) ?? null;
  const location =
    player && playerId
      ? locatePlayer(state.groups, state.unassignedIds, playerId)
      : null;
  const currentGroup = location?.groupId
    ? state.groups.find((group) => group.id === location.groupId)
    : null;
  const currentPosition = location
    ? location.groupId
      ? `第 ${location.index + 1} 位`
      : '后补名单'
    : '';

  return (
    <Sheet
      open={open && Boolean(player)}
      onClose={onClose}
      title="移动成员"
      subtitle={
        player
          ? `${player.name}${
              showRoseBadge(player.name, player.isFemale) ? ' 🌹' : ''
            } · ${
              currentGroup?.label ?? '后补名单'
            } ${currentPosition}`
          : undefined
      }
    >
      {player ? (
        <div className="move-sheet">
          <p className="move-tip">选择目标场次，成员会追加到该场次末尾。</p>

          <div className="move-list">
            {state.groups.map((group) => {
              const isCurrent = group.id === location?.groupId;
              const isFull = group.playerIds.length >= state.capacity;
              const disabled = isCurrent || isFull;

              return (
                <button
                  type="button"
                  key={group.id}
                  className={`move-option${isCurrent ? ' is-current' : ''}`}
                  disabled={disabled}
                  onClick={() => {
                    onMove(player.id, group.id);
                    onClose();
                  }}
                >
                  <span className="move-option-mark" aria-hidden="true">
                    {group.label.slice(0, 1)}
                  </span>
                  <span className="move-option-main">
                    <strong>{group.label}</strong>
                    <small>
                      {isCurrent ? '当前所在场次' : isFull ? '已满员' : '可加入'}
                    </small>
                  </span>
                  <span className="move-option-count">
                    {group.playerIds.length}/{state.capacity}
                  </span>
                  <span className="move-option-action">
                    {isCurrent ? (
                      <Icon name="check" size={17} />
                    ) : (
                      <Icon name="arrow-right" size={17} />
                    )}
                  </span>
                </button>
              );
            })}
          </div>

          {state.groups.length === 0 ? (
            <div className="move-empty">
              <Icon name="users" size={22} />
              还没有场次，先添加一个场次吧。
            </div>
          ) : null}

          {location?.groupId ? (
            <button
              type="button"
              className="move-pool-button"
              onClick={() => {
                onMove(player.id, null);
                onClose();
              }}
            >
              <Icon name="move" size={17} />
              移出小组，放到后补名单
            </button>
          ) : null}
        </div>
      ) : null}
    </Sheet>
  );
}
