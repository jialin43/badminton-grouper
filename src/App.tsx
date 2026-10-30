import { useEffect, useState } from 'react';
import { AppHeader } from './components/AppHeader';
import { EventSettingsSheet } from './components/EventSettingsSheet';
import { GroupStep } from './components/GroupStep';
import { ImportStep } from './components/ImportStep';
import { PosterStep } from './components/PosterStep';
import { useConfirm, useToast } from './components/Feedback';
import { Icon } from './components/Icon';
import { useAppState } from './state/useAppState';

function formatRestoreTime(timestamp: number): string {
  const date = new Date(timestamp);
  if (Number.isNaN(date.getTime())) return '上次';

  const month = date.getMonth() + 1;
  const day = date.getDate();
  const hours = String(date.getHours()).padStart(2, '0');
  const minutes = String(date.getMinutes()).padStart(2, '0');
  return `${month}月${day}日 ${hours}:${minutes}`;
}

export function App() {
  const { state, dispatch, restoredAt, dismissRestore, reset } = useAppState();
  const [settingsOpen, setSettingsOpen] = useState(false);
  const notify = useToast();
  const confirm = useConfirm();

  useEffect(() => {
    window.scrollTo(0, 0);
  }, [state.step]);

  const handleClearDraft = async () => {
    const ok = await confirm({
      title: '清空本机草稿？',
      message: '名单、分组、活动信息都会删除，且无法恢复。',
      confirmLabel: '清空草稿',
      danger: true,
    });
    if (!ok) return;

    reset();
    notify('已清空本机草稿');
  };

  return (
    <div className="app-shell">
      <div className="app-frame">
        <AppHeader step={state.step} />

        {restoredAt !== null ? (
          <div className="restore-banner" role="status">
            <span className="restore-icon" aria-hidden="true">
              <Icon name="refresh" size={16} />
            </span>
            <div className="restore-copy">
              <strong>已恢复上次编辑</strong>
              <span>{formatRestoreTime(restoredAt)}</span>
            </div>
            <button
              type="button"
              className="restore-action"
              onClick={dismissRestore}
            >
              继续
            </button>
            <button
              type="button"
              className="restore-action is-danger"
              onClick={() => void handleClearDraft()}
            >
              清空
            </button>
          </div>
        ) : null}

        {state.step === 1 ? (
          <ImportStep
            state={state}
            dispatch={dispatch}
            onClearDraft={() => void handleClearDraft()}
          />
        ) : null}

        {state.step === 2 ? (
          <GroupStep
            state={state}
            dispatch={dispatch}
            onBack={() => dispatch({ type: 'SET_STEP', step: 1 })}
            onNext={() => window.scrollTo(0, 0)}
            onOpenSettings={() => setSettingsOpen(true)}
          />
        ) : null}

        {state.step === 3 ? (
          <PosterStep
            state={state}
            onBack={() => dispatch({ type: 'SET_STEP', step: 2 })}
            onOpenSettings={() => setSettingsOpen(true)}
          />
        ) : null}

        <EventSettingsSheet
          open={settingsOpen}
          event={state.event}
          groupCount={state.groups.length}
          onClose={() => setSettingsOpen(false)}
          onSave={(event) => {
            dispatch({ type: 'SET_EVENT', event });
            notify('活动信息已更新');
          }}
        />
      </div>
    </div>
  );
}
