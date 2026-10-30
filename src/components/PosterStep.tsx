import { useEffect, useMemo, useRef, useState } from 'react';
import type { AppState, Player } from '../types';
import { formatFullCN, formatTimeRange } from '../lib/date';
import {
  buildPosterLayout,
} from '../lib/poster-layout';
import {
  type PosterData,
  renderPoster,
} from '../lib/poster-render';
import {
  canSharePoster,
  canvasToBlob,
  downloadBlob,
  isIOS,
  isWeChatBrowser,
  posterFileName,
  sharePoster,
} from '../lib/export';
import { ActionBar } from './ActionBar';
import { useToast } from './Feedback';
import { Icon } from './Icon';
import { NoticeCard } from './NoticeCard';
import { Sheet } from './Sheet';

interface PosterStepProps {
  state: AppState;
  onBack: () => void;
  onOpenSettings: () => void;
}

export function PosterStep({
  state,
  onBack,
  onOpenSettings,
}: PosterStepProps) {
  const notify = useToast();
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const [busy, setBusy] = useState(false);
  const [ready, setReady] = useState(false);
  const [saveUrl, setSaveUrl] = useState<string | null>(null);

  const playerMap = useMemo(
    () => new Map(state.players.map((player) => [player.id, player])),
    [state.players],
  );

  const data = useMemo<PosterData>(() => {
    const groups = state.groups
      .map((group) => ({
        label: group.label,
        players: group.playerIds
          .map((id) => playerMap.get(id))
          .filter((player): player is Player => Boolean(player))
          .map((player) => ({ name: player.name, isFemale: player.isFemale })),
      }))
      .filter((group) => group.players.length > 0);

    const waitlist = state.unassignedIds
      .map((id) => playerMap.get(id))
      .filter((player): player is Player => Boolean(player))
      .map((player) => ({ name: player.name, isFemale: player.isFemale }));

    const totalPlayers =
      groups.reduce((total, group) => total + group.players.length, 0) +
      waitlist.length;
    const femaleCount =
      groups.reduce(
        (total, group) =>
          total + group.players.filter((player) => player.isFemale).length,
        0,
      ) + waitlist.filter((player) => player.isFemale).length;

    return {
      title: state.event.title,
      date: state.event.date,
      startTime: state.event.startTime,
      endTime: state.event.endTime,
      venue: state.event.venue,
      capacity: state.capacity,
      notice: state.event.notice,
      groups,
      waitlist,
      totalPlayers,
      femaleCount,
    };
  }, [
    playerMap,
    state.capacity,
    state.event,
    state.groups,
    state.unassignedIds,
  ]);

  const layout = useMemo(
    () => buildPosterLayout(data.groups.length, data.waitlist.length),
    [data.groups.length, data.waitlist.length],
  );

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    let active = true;
    setReady(false);
    const draw = () => {
      if (!active) return;
      renderPoster(canvas, data, layout);
      setReady(true);
    };

    if (document.fonts?.ready) {
      document.fonts.ready.then(draw).catch(draw);
    } else {
      draw();
    }

    return () => {
      active = false;
    };
  }, [data, layout]);

  useEffect(
    () => () => {
      if (saveUrl) URL.revokeObjectURL(saveUrl);
    },
    [saveUrl],
  );

  const closeSave = () => {
    setSaveUrl(null);
  };

  const makeBlob = async (): Promise<Blob | null> => {
    const canvas = canvasRef.current;
    if (!canvas) {
      notify('海报还没准备好，请稍后再试');
      return null;
    }
    try {
      return await canvasToBlob(canvas);
    } catch {
      notify('海报生成失败，请重试');
      return null;
    }
  };

  const handleSave = async () => {
    if (busy) return;
    if (!ready) {
      notify('海报正在生成，请稍等一下');
      return;
    }
    setBusy(true);
    const blob = await makeBlob();
    setBusy(false);
    if (!blob) return;

    if (isWeChatBrowser() || isIOS()) {
      if (saveUrl) URL.revokeObjectURL(saveUrl);
      setSaveUrl(URL.createObjectURL(blob));
      return;
    }

    downloadBlob(blob, posterFileName(state.event.date));
    notify('海报已生成，正在下载');
  };

  const handleShare = async () => {
    if (busy) return;
    if (!ready) {
      notify('海报正在生成，请稍等一下');
      return;
    }
    setBusy(true);
    const blob = await makeBlob();
    setBusy(false);
    if (!blob) return;

    if (!canSharePoster(blob, state.event.date)) {
      notify('当前浏览器不支持直接分享，请用“保存图片”');
      return;
    }

    const shared = await sharePoster(blob, state.event.date);
    if (!shared) notify('已取消分享，或当前环境不支持');
  };

  const hasWaitlist = data.waitlist.length > 0;

  return (
    <>
      <main className="page-content poster-page">
        {hasWaitlist ? (
          <div className="wechat-tip is-neutral" role="status">
            <Icon name="users" size={18} />
            <div>
              <strong>{data.waitlist.length} 人进入后补名单</strong>
              <p>后补成员会展示在海报底部的后补名单区域。</p>
            </div>
          </div>
        ) : null}

        <section className="poster-preview-card">
          <div className="poster-preview-head">
            <div>
              <span className="section-kicker">LIVE PREVIEW</span>
              <h2>海报预览</h2>
            </div>
            <span className="size-chip">
              1080 × {layout.height}
            </span>
          </div>

          <div className="poster-frame">
            <canvas
              ref={canvasRef}
              className="poster-canvas"
              role="img"
              aria-label="羽毛球分组海报预览"
            />
          </div>

          <div className="poster-caption">
            <span>
              <Icon name="image" size={15} />
              PNG · 宽 1080px
            </span>
            <span>
              <Icon name="users" size={15} />
              {data.totalPlayers} 人 · {data.groups.length} 场
              {hasWaitlist ? ` · 后补 ${data.waitlist.length}` : ''}
            </span>
            <button type="button" className="text-action" onClick={onOpenSettings}>
              <Icon name="edit" size={14} />
              改信息
            </button>
          </div>
        </section>

        <section className="poster-info-card">
          <div className="poster-info-row">
            <span>活动</span>
            <strong>{state.event.title || '羽毛球分组'}</strong>
          </div>
          <div className="poster-info-row">
            <span>时间</span>
            <strong>
              {formatFullCN(state.event.date)} ·{' '}
              {formatTimeRange(state.event.startTime, state.event.endTime)}
            </strong>
          </div>
          <div className="poster-info-row">
            <span>场馆</span>
            <strong>{state.event.venue || '场地待定'}</strong>
          </div>
          <div className="poster-info-row">
            <span>女生</span>
            <strong>{data.femaleCount} 人 🌹</strong>
          </div>
          <div className="poster-info-row">
            <span>后补</span>
            <strong>{data.waitlist.length} 人</strong>
          </div>
        </section>

        <NoticeCard notice={state.event.notice} onEdit={onOpenSettings} />

        {isWeChatBrowser() ? (
          <div className="wechat-tip">
            <Icon name="download" size={18} />
            <div>
              <strong>微信内保存方式</strong>
              <p>点“保存图片”后会显示大图，长按图片选择“保存到相册”即可。</p>
            </div>
          </div>
        ) : (
          <div className="wechat-tip is-neutral">
            <Icon name="share" size={18} />
            <div>
              <strong>发群前的小建议</strong>
              <p>保存 PNG 后发送到微信群，图片会保持 1080px 的清晰度。</p>
            </div>
          </div>
        )}

        <div className="share-row">
          <button
            type="button"
            className="btn btn-soft"
            onClick={() => void handleShare()}
            disabled={busy}
          >
            <Icon name="share" size={17} />
            分享
          </button>
          <button
            type="button"
            className="btn btn-soft"
            onClick={onBack}
          >
            <Icon name="undo" size={17} />
            继续调整
          </button>
        </div>
      </main>

      <ActionBar
        primaryLabel={busy ? '生成中…' : '保存图片'}
        onPrimary={() => void handleSave()}
        primaryDisabled={busy || !ready || data.groups.length === 0}
        primaryIcon={<Icon name="download" size={18} />}
        secondaryLabel="返回调整"
        onSecondary={onBack}
        hint="保存后可发到微信群；微信内支持长按保存"
      />

      <Sheet
        open={saveUrl !== null}
        onClose={closeSave}
        title="保存海报"
        subtitle="长按图片，选择“保存到相册”或“发送给朋友”"
        footer={
          <button type="button" className="btn btn-primary btn-block" onClick={closeSave}>
            完成
          </button>
        }
      >
        {saveUrl ? (
          <img
            className="save-poster-image"
            src={saveUrl}
            alt="羽毛球分组海报"
            draggable={false}
          />
        ) : null}
      </Sheet>
    </>
  );
}
