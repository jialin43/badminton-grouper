import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import type { Dispatch } from 'react';
import {
  DndContext,
  DragOverlay,
  KeyboardSensor,
  MouseSensor,
  TouchSensor,
  closestCorners,
  pointerWithin,
  useSensor,
  useSensors,
} from '@dnd-kit/core';
import type { CollisionDetection } from '@dnd-kit/core';
import type {
  DragEndEvent,
  DragMoveEvent,
  DragStartEvent,
} from '@dnd-kit/core';
import { sortableKeyboardCoordinates } from '@dnd-kit/sortable';
import type { AppState, Player } from '../types';
import type { AppAction } from '../state/reducer';
import { formatFullCN, formatTimeRange } from '../lib/date';
import { groupCountFor, locatePlayer } from '../lib/grouping';
import { showRoseBadge } from '../lib/player';
import { ActionBar } from './ActionBar';
import { useConfirm, useToast } from './Feedback';
import { GroupCard } from './GroupCard';
import { Icon } from './Icon';
import { MoveSheet } from './MoveSheet';
import { NoticeCard } from './NoticeCard';
import { UnassignedPool } from './UnassignedPool';

/** 容器（场次卡 / 后补区）不是可互换目标。 */
function isContainerId(id: string): boolean {
  return id === 'pool' || id.startsWith('group:');
}

interface GroupStepProps {
  state: AppState;
  dispatch: Dispatch<AppAction>;
  onBack: () => void;
  onNext: () => void;
  onOpenSettings: () => void;
}

export function GroupStep({
  state,
  dispatch,
  onBack,
  onNext,
  onOpenSettings,
}: GroupStepProps) {
  const notify = useToast();
  const confirm = useConfirm();
  const [activeId, setActiveId] = useState<string | null>(null);
  const pointerRef = useRef<{ x: number; y: number } | null>(null);
  const [swapTargetId, setSwapTargetId] = useState<string | null>(null);
  const [movePlayerId, setMovePlayerId] = useState<string | null>(null);

  const sensors = useSensors(
    useSensor(MouseSensor, { activationConstraint: { distance: 6 } }),
    useSensor(TouchSensor, {
      activationConstraint: { delay: 100, tolerance: 8 },
    }),
    useSensor(KeyboardSensor, {
      coordinateGetter: sortableKeyboardCoordinates,
    }),
  );

  const playerMap = useMemo(
    () => new Map(state.players.map((player) => [player.id, player])),
    [state.players],
  );

  const activePlayer = activeId ? playerMap.get(activeId) : null;

  useEffect(() => {
    if (!activeId) return;

    document.body.classList.add('is-dragging-player');
    return () => document.body.classList.remove('is-dragging-player');
  }, [activeId]);

  /** 拖拽期间跟踪真实指针坐标（dnd-kit 的 pointerCoordinates 不会跟随页面滚动更新）。 */
  useEffect(() => {
    if (!activeId) return;

    const track = (event: PointerEvent | MouseEvent) => {
      pointerRef.current = { x: event.clientX, y: event.clientY };
    };
    window.addEventListener('pointermove', track, true);
    window.addEventListener('mousemove', track, true);

    return () => {
      window.removeEventListener('pointermove', track, true);
      window.removeEventListener('mousemove', track, true);
    };
  }, [activeId]);

  const handleDragStart = (event: DragStartEvent) => {
    setActiveId(String(event.active.id));
    setSwapTargetId(null);
    if (typeof navigator.vibrate === 'function') {
      navigator.vibrate(8);
    }
  };

  /**
   * 自定义碰撞策略，让“落到哪张卡上”更符合直觉：
   * 1) 指针落在某张成员卡上 → 就是它（跨组即互换）；
   * 2) 否则退回 closestCorners。
   * 默认策略会越过成员卡命中外层容器，导致拖到 A 却互换 B。
   */
  const collisionDetection: CollisionDetection = useCallback((args) => {
    const hits = pointerWithin(args).filter(
      (hit) => !isContainerId(String(hit.id)),
    );
    if (hits.length > 0) return hits.slice(0, 1);

    return closestCorners(args);
  }, []);

  /**
   * 用自己的 DOM 矩形判定“手指压在哪张成员卡上”。
   * dnd-kit 在多容器排序时会把 over.id 二次裁决成别的卡片，
   * 而 pointerCoordinates 是滚动前的旧值，都不能直接用来判断互换目标。
   */
  const resolveHoverCardId = (): string | null => {
    const pointer = pointerRef.current;
    if (!pointer) return null;

    const cards = document.querySelectorAll<HTMLElement>('[data-player-card]');
    let best: { id: string; area: number } | null = null;

    for (const card of cards) {
      const rect = card.getBoundingClientRect();
      const inside =
        pointer.x >= rect.left &&
        pointer.x <= rect.right &&
        pointer.y >= rect.top &&
        pointer.y <= rect.bottom;
      if (!inside) continue;

      const id = card.dataset.playerCard ?? '';
      if (!id) continue;
      const area = rect.width * rect.height;
      if (!best || area < best.area) best = { id, area };
    }

    return best?.id ?? null;
  };

  const handleDragMove = (event: DragMoveEvent) => {
    const activePlayerId = String(event.active.id);
    const hoverId = resolveHoverCardId();
    if (!hoverId || hoverId === activePlayerId) {
      setSwapTargetId(null);
      return;
    }

    const source = locatePlayer(state.groups, state.unassignedIds, activePlayerId);
    const target = locatePlayer(state.groups, state.unassignedIds, hoverId);
    const isCrossGroup =
      Boolean(source) && Boolean(target) && source!.groupId !== target!.groupId;

    setSwapTargetId(isCrossGroup ? hoverId : null);
  };

  const handleDragEnd = (event: DragEndEvent) => {
    setActiveId(null);
    setSwapTargetId(null);
    const { active, over } = event;
    if (!over || over.id === active.id) return;

    const playerId = String(active.id);
    const overId = String(over.id);

    const source = locatePlayer(state.groups, state.unassignedIds, playerId);
    if (!source) return;

    let targetGroupId: string | null;
    let index: number | undefined;
    // 落到“某位成员身上”时，走互换而不是插入
    let targetPlayerId: string | undefined;

    if (overId === 'pool') {
      targetGroupId = null;
    } else if (overId.startsWith('group:')) {
      targetGroupId = overId.slice('group:'.length);
    } else {
      const location = locatePlayer(
        state.groups,
        state.unassignedIds,
        overId,
      );
      if (!location) return;
      targetGroupId = location.groupId;
      index = location.index;
      targetPlayerId = overId;
    }

    // ---- 跨场次互换：拖到别的组的人身上 ----
    const isCrossGroup =
      targetPlayerId !== undefined &&
      targetGroupId !== source.groupId;

    if (isCrossGroup && targetPlayerId) {
      const swapTargetId = targetPlayerId;
      dispatch({
        type: 'SWAP_PLAYER',
        sourceId: playerId,
        targetId: swapTargetId,
      });

      const sourceLabel = source.groupId
        ? (state.groups.find((group) => group.id === source.groupId)?.label ??
          '后补名单')
        : '后补名单';
      const targetLabel = targetGroupId
        ? (state.groups.find((group) => group.id === targetGroupId)?.label ??
          '后补名单')
        : '后补名单';
      const sourceName = playerMap.get(playerId)?.name ?? '';
      const targetName = playerMap.get(swapTargetId)?.name ?? '';
      notify(`${sourceName} 与 ${targetName} 已互换（${sourceLabel} ↔ ${targetLabel}）`);
      return;
    }

    // ---- 拖到空的场次区域：普通移动 ----
    if (targetGroupId) {
      const target = state.groups.find(
        (group) => group.id === targetGroupId,
      );
      if (!target) return;
      const alreadyThere = target.playerIds.includes(playerId);
      if (!alreadyThere && target.playerIds.length >= state.capacity) {
        notify(
          `这个场次已经满 ${state.capacity} 人，拖到组内成员身上可以直接互换`,
        );
        return;
      }
    }

    // 从满员场次拖去后补，提醒会缺人。
    if (source.groupId && !targetGroupId) {
      const sourceGroup = state.groups.find(
        (group) => group.id === source.groupId,
      );
      if (sourceGroup && sourceGroup.playerIds.length === state.capacity) {
        notify(
          `移出后 ${sourceGroup.label} 只剩 ${state.capacity - 1} 人，记得再补一位`,
        );
      }
    }

    dispatch({
      type: 'MOVE_PLAYER',
      playerId,
      targetGroupId,
      index,
    });
  };

  /**
   * 默认按钮：只对后补区做补齐。
   * 已经满足 6 人的场次（尤其是手动拖好的）不会被改动。
   */
  const handleFillGroups = () => {
    if (state.players.length === 0) return;

    const targetGroups = groupCountFor(state.players.length, state.capacity);
    if (targetGroups === 0) {
      notify(`不足 ${state.capacity} 人，暂时凑不成一场，先留在后补名单`);
      return;
    }

    const occupied = state.groups.reduce(
      (total, group) => total + group.playerIds.length,
      0,
    );
    const freeSlots = Math.max(
      0,
      targetGroups * state.capacity - occupied,
    );

    if (freeSlots === 0 && state.groups.length > 0) {
      notify('所有场次都已满员，后补的朋友需要等有人退出');
      return;
    }
    if (state.unassignedIds.length === 0) {
      notify('后补名单是空的，没有可以补进来的人');
      return;
    }

    dispatch({ type: 'FILL_GROUPS' });

    const filled = Math.min(freeSlots, state.unassignedIds.length);
    const rest = state.unassignedIds.length - filled;
    notify(
      rest > 0
        ? `已补入 ${filled} 人，还有 ${rest} 人留在后补`
        : `已补入 ${filled} 人`,
    );
  };

  /** 全重排：清空现有场次重新随机，需要二次确认。 */
  const handleReshuffleAll = async () => {
    if (state.players.length === 0) return;

    const targetGroups = groupCountFor(state.players.length, state.capacity);
    if (targetGroups === 0) {
      notify(`不足 ${state.capacity} 人，暂时凑不成一场`);
      return;
    }

    const ok = await confirm({
      title: '全部重新随机？',
      message: `会清空当前所有场次，把 ${state.players.length} 人重新打乱分成 ${targetGroups} 个满员场次，多出的 ${
        state.players.length - targetGroups * state.capacity
      } 人留在后补。手动拖好的分组会丢失（可撤销）。`,
      confirmLabel: '全部重排',
      danger: true,
    });
    if (!ok) return;

    dispatch({ type: 'AUTO_GROUP', shuffle: true });
    notify(`已重新随机分成 ${targetGroups} 个满员场次`);
  };

  const handleUndo = () => {
    if (state.past.length === 0) {
      notify('还没有可以撤销的操作');
      return;
    }
    dispatch({ type: 'UNDO' });
    notify('已撤销上一步分组操作');
  };

  const handleClear = async () => {
    const ok = await confirm({
      title: '清空所有场次？',
      message: '所有成员会回到后补名单，名单和活动信息会保留。此操作可撤销。',
      confirmLabel: '清空场次',
      danger: true,
    });
    if (!ok) return;

    dispatch({ type: 'CLEAR_GROUPS' });
    notify('已清空场次，成员回到后补名单');
  };

  const handleAddGroup = () => {
    if (state.groups.length >= 24) {
      notify('最多支持 24 个场次');
      return;
    }
    dispatch({ type: 'ADD_GROUP' });
    notify('已添加一个空场次');
  };

  const handleRemoveGroup = (id: string) => {
    const group = state.groups.find((entry) => entry.id === id);
    if (!group || group.playerIds.length > 0) return;
    dispatch({ type: 'REMOVE_GROUP', id });
    notify(`已删除 ${group.label}`);
  };

  const handleMove = (playerId: string, targetGroupId: string | null) => {
    const target = targetGroupId
      ? state.groups.find((group) => group.id === targetGroupId)
      : null;
    dispatch({
      type: 'MOVE_PLAYER',
      playerId,
      targetGroupId,
    });
    notify(target ? `已移动到 ${target.label}` : '已移入后补名单');
  };

  const fullGroups = state.groups.filter(
    (group) => group.playerIds.length === state.capacity,
  );
  const incompleteGroups = state.groups.filter(
    (group) =>
      group.playerIds.length > 0 &&
      group.playerIds.length < state.capacity,
  );
  const emptyGroups = state.groups.filter(
    (group) => group.playerIds.length === 0,
  );

  const handleNext = async () => {
    if (fullGroups.length === 0) {
      notify(`还没有满 ${state.capacity} 人的场次，先凑满一场再生成`);
      return;
    }

    if (incompleteGroups.length > 0) {
      const moved = incompleteGroups.reduce(
        (total, group) => total + group.playerIds.length,
        0,
      );
      const ok = await confirm({
        title: '有场次未满 6 人',
        message: `${incompleteGroups.length} 个场次未满 ${state.capacity} 人。生成海报前会把其中 ${moved} 人移入后补名单。`,
        confirmLabel: '移入后补并生成',
      });
      if (!ok) return;
    }

    if (incompleteGroups.length > 0 || emptyGroups.length > 0) {
      dispatch({ type: 'NORMALIZE_GROUPS' });
    }

    dispatch({ type: 'SET_STEP', step: 3 });
    onNext();
  };

  const waitlistPlayers = state.unassignedIds
    .map((id) => playerMap.get(id))
    .filter((player): player is Player => Boolean(player));

  const hasWaitlist = waitlistPlayers.length > 0;

  return (
    <>
      <DndContext
        sensors={sensors}
        collisionDetection={collisionDetection}
        onDragStart={handleDragStart}
        onDragMove={handleDragMove}
        onDragEnd={handleDragEnd}
        onDragCancel={() => {
          setActiveId(null);
          setSwapTargetId(null);
        }}
      >
        <main className="page-content group-page">
          <section className="event-strip">
            <div className="event-main">
              <span className="section-kicker">MATCH INFO</span>
              <div className="event-date">
                <Icon name="calendar" size={17} />
                {formatFullCN(state.event.date)}
                <span className="event-sep">·</span>
                {formatTimeRange(state.event.startTime, state.event.endTime)}
              </div>
              <div className="event-venue">
                <Icon name="pin" size={16} />
                {state.event.venue || '场地待定'}
              </div>
            </div>
            <button
              type="button"
              className="edit-event"
              onClick={onOpenSettings}
            >
              <Icon name="edit" size={15} />
              编辑
            </button>
          </section>

          <section className="mini-stats" aria-label="分组统计">
            <div>
              <strong>{state.players.length}</strong>
              <span>总人数</span>
            </div>
            <div>
              <strong>{fullGroups.length}</strong>
              <span>满员场次</span>
            </div>
            <div>
              <strong>{waitlistPlayers.length}</strong>
              <span>后补</span>
            </div>
          </section>

          <div className="group-toolbar" role="group" aria-label="分组操作">
            <button
              type="button"
              className="tool-button is-primary"
              onClick={handleFillGroups}
              disabled={state.unassignedIds.length === 0}
            >
              <Icon name="shuffle" size={16} />
              随机分组
            </button>
            <button
              type="button"
              className="tool-button"
              onClick={() => void handleReshuffleAll()}
            >
              <Icon name="refresh" size={16} />
              全部重排
            </button>
            <button
              type="button"
              className="tool-button"
              onClick={handleUndo}
              disabled={state.past.length === 0}
            >
              <Icon name="undo" size={16} />
              撤销
            </button>
            <button
              type="button"
              className="tool-button is-quiet-danger"
              onClick={() => void handleClear()}
            >
              <Icon name="trash" size={16} />
              清空
            </button>
          </div>

          <UnassignedPool
            players={waitlistPlayers}
            onOpenMove={setMovePlayerId}
            swapTargetId={swapTargetId}
          />

          <div className="groups-list">
            {state.groups.map((group) => {
              const players = group.playerIds
                .map((id) => playerMap.get(id))
                .filter((player): player is Player => Boolean(player));
              const otherLabels = state.groups
                .filter((entry) => entry.id !== group.id)
                .map((entry) => entry.label);

              return (
                <GroupCard
                  key={group.id}
                  group={group}
                  players={players}
                  capacity={state.capacity}
                  otherLabels={otherLabels}
                  onOpenMove={setMovePlayerId}
                  swapTargetId={swapTargetId}
                  onRename={(id, label) =>
                    dispatch({ type: 'RENAME_GROUP', id, label })
                  }
                  onRemove={handleRemoveGroup}
                />
              );
            })}
          </div>

          {state.groups.length === 0 ? (
            <section className="empty-card group-empty">
              <span className="empty-icon">
                <Icon name="users" size={26} />
              </span>
              <h3>还没有场次</h3>
              <p>
                已按接龙顺序分好组。需要调整就拖动成员把手：拖到别的组的人身上会
                <strong>互换</strong>，拖到空场次区域会<strong>移入</strong>。也可以点“添加场次”手动
                拖满 6 人；没凑满 6 人的会留在后补名单。
              </p>
            </section>
          ) : null}

          <button
            type="button"
            className="add-group-button"
            onClick={handleAddGroup}
            disabled={state.groups.length >= 24}
          >
            <Icon name="plus" size={18} />
            添加场次
          </button>

          <div className="drag-tip">
            <Icon name="grip" size={15} />
            拖动卡片左边的把手：拖到别的组的人身上是<b>互换</b>，拖到空位是<b>移入</b>；点卡片也能快速移动
          </div>

          <NoticeCard notice={state.event.notice} onEdit={onOpenSettings} />
        </main>

        <DragOverlay dropAnimation={null}>
          {activePlayer ? (
            <div className="drag-overlay">
              <span className="player-order">··</span>
              <span className="player-name">
                {activePlayer.name}
                {showRoseBadge(activePlayer.name, activePlayer.isFemale) ? (
                  <span className="player-rose">🌹</span>
                ) : null}
              </span>
              <Icon name="grip" size={17} />
            </div>
          ) : null}
        </DragOverlay>
      </DndContext>

      <MoveSheet
        open={movePlayerId !== null}
        playerId={movePlayerId}
        state={state}
        onClose={() => setMovePlayerId(null)}
        onMove={handleMove}
      />

      <ActionBar
        primaryLabel="生成海报"
        onPrimary={() => void handleNext()}
        primaryDisabled={fullGroups.length === 0}
        secondaryLabel="返回名单"
        onSecondary={onBack}
        hint={
          fullGroups.length === 0
            ? state.groups.length === 0
              ? '拖动成员把手分组，或点“随机分组”自动补齐'
              : `还没有满 ${state.capacity} 人的场次，先补满或移入后补`
            : incompleteGroups.length > 0
              ? `${incompleteGroups.length} 个场次未满 ${state.capacity} 人，生成前会移入后补`
              : hasWaitlist
                ? `${waitlistPlayers.length} 人进入后补名单，可继续生成`
                : `${state.players.length} 人 · ${fullGroups.length} 场 · 每场 ${state.capacity} 人`
        }
      />
    </>
  );
}
