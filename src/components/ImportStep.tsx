import { useRef, useState } from 'react';
import type { Dispatch } from 'react';
import type { AppState } from '../types';
import type { AppAction } from '../state/reducer';
import { extractHints, nameKey, parseSignup } from '../lib/parser';
import { groupCountFor } from '../lib/grouping';
import { SAMPLE_TEXT } from '../lib/sample';
import { ActionBar } from './ActionBar';
import { useConfirm, useToast } from './Feedback';
import { Icon } from './Icon';
import { RosterRow } from './RosterRow';

interface ImportStepProps {
  state: AppState;
  dispatch: Dispatch<AppAction>;
  onClearDraft: () => void;
}

export function ImportStep({ state, dispatch, onClearDraft }: ImportStepProps) {
  const notify = useToast();
  const confirm = useConfirm();
  const fileRef = useRef<HTMLInputElement | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [newName, setNewName] = useState('');

  const femaleCount = state.players.filter((player) => player.isFemale).length;
  const groupsNeeded = groupCountFor(state.players.length, state.capacity);
  const report = state.report;

  const parseText = async (text: string) => {
    const trimmed = text.trim();
    if (!trimmed) {
      setError('请先粘贴微信接龙内容，或点击“示例”体验。');
      return;
    }

    const result = parseSignup(trimmed);
    if (result.players.length === 0) {
      setError('没有识别到昵称。请检查是否包含编号或有效名单，也可以手动添加。');
      return;
    }

    if (state.players.length > 0) {
      const ok = await confirm({
        title: '重新识别名单？',
        message: '这会用新识别结果覆盖当前名单和已有分组。',
        confirmLabel: '重新识别',
      });
      if (!ok) return;
    }

    const hints = extractHints(trimmed);
    dispatch({
      type: 'SET_ROSTER',
      drafts: result.players,
      report: {
        mode: result.mode,
        duplicates: result.duplicates,
        ignored: result.ignored,
        parsedAt: Date.now(),
      },
      hints,
    });

    setError(null);
    setNewName('');

    const female = result.players.filter((player) => player.isFemale).length;
    const hintText =
      hints.date || hints.startTime || hints.venue ? '，已带出时间场地' : '';
    notify(`识别到 ${result.players.length} 人 · ${female} 位女生${hintText}`);
  };

  const handleSample = async () => {
    dispatch({ type: 'SET_RAW_TEXT', text: SAMPLE_TEXT });
    await parseText(SAMPLE_TEXT);
  };

  const handleFile = (file: File | undefined) => {
    if (!file) return;

    if (file.size > 1024 * 1024) {
      setError('文件太大了，请选择 1MB 以内的文本文件。');
      return;
    }

    const reader = new FileReader();
    reader.onload = () => {
      const text = typeof reader.result === 'string' ? reader.result : '';
      dispatch({ type: 'SET_RAW_TEXT', text });
      void parseText(text);
    };
    reader.onerror = () => setError('读取文件失败，请重试或直接粘贴文本。');
    reader.readAsText(file, 'utf-8');
  };

  const handleClipboard = async () => {
    if (!navigator.clipboard?.readText) {
      notify('当前浏览器不支持读取剪贴板，请长按输入框粘贴');
      return;
    }

    try {
      const text = await navigator.clipboard.readText();
      if (!text.trim()) {
        notify('剪贴板里没有文本');
        return;
      }
      dispatch({ type: 'SET_RAW_TEXT', text });
      setError(null);
      notify('已从剪贴板填入，点击“识别名单”即可');
    } catch {
      notify('无法读取剪贴板，请手动粘贴');
    }
  };

  const handleAdd = () => {
    const raw = newName.trim();
    const isFemale = raw.includes('🌹');
    const name = raw.replace(/🌹/gu, '').trim();
    if (!name) {
      notify('请输入成员昵称');
      return;
    }
    if (
      state.players.some(
        (player) =>
          nameKey(player.name) === nameKey(name) &&
          player.isFemale === isFemale,
      )
    ) {
      notify('同名且性别标记相同的成员已经在名单里了');
      return;
    }
    if (state.players.length >= 100) {
      notify('单次最多 100 人');
      return;
    }

    dispatch({ type: 'ADD_PLAYER', name, isFemale });
    setNewName('');
    notify(`已添加 ${name}${isFemale ? ' 🌹' : ''}`);
  };

  const handleNext = () => {
    if (state.players.length === 0) {
      notify('先识别或添加至少 1 位成员');
      return;
    }
    dispatch({ type: 'SET_STEP', step: 2 });
  };

  return (
    <>
      <main className="page-content">
        <section className="panel input-panel">
          <div className="panel-head">
            <div>
              <span className="section-kicker">PASTE THE CHAIN</span>
              <h2>微信接龙原文</h2>
            </div>
            <button
              type="button"
              className="text-action"
              onClick={handleClipboard}
            >
              <Icon name="copy" size={15} />
              粘贴
            </button>
          </div>

          <textarea
            className={`chain-input${error ? ' has-error' : ''}`}
            value={state.rawText}
            maxLength={20_000}
            spellCheck={false}
            placeholder={`#接龙
10月29日 周四 19:00-21:00 羽毛球
地点：星光羽毛球馆
1. 阿哲
2. 小满🌹
3、Momo
……`}
            aria-label="微信接龙原文"
            onChange={(event) => {
              dispatch({ type: 'SET_RAW_TEXT', text: event.target.value });
              if (error) setError(null);
            }}
          />

          <div className="input-meta">
            <span>{state.rawText.length.toLocaleString()} / 20,000</span>
            <span>🌹 自动标记女生</span>
          </div>

          {error ? (
            <div className="inline-alert" role="alert">
              <Icon name="alert" size={18} />
              <span>{error}</span>
            </div>
          ) : null}

          <div className="input-actions">
            <button
              type="button"
              className="btn btn-dark"
              onClick={() => void parseText(state.rawText)}
            >
              <Icon name="sparkle" size={18} />
              识别名单
            </button>
            <button
              type="button"
              className="btn btn-soft"
              onClick={() => fileRef.current?.click()}
            >
              <Icon name="upload" size={17} />
              上传 txt
            </button>
            <button
              type="button"
              className="btn btn-soft"
              onClick={() => void handleSample()}
            >
              示例
            </button>
            <input
              ref={fileRef}
              type="file"
              accept=".txt,.md,text/plain"
              className="visually-hidden"
              onChange={(event) => {
                handleFile(event.target.files?.[0]);
                event.target.value = '';
              }}
            />
          </div>
        </section>

        {state.players.length > 0 ? (
          <>
            <section className="stat-strip" aria-label="识别统计">
              <div>
                <strong>{state.players.length}</strong>
                <span>已识别</span>
              </div>
              <div>
                <strong>{femaleCount}</strong>
                <span>女生</span>
              </div>
              <div>
                <strong>{groupsNeeded}</strong>
                <span>预计场次</span>
              </div>
            </section>

            <section className="panel roster-panel">
              <div className="panel-head">
                <div>
                  <span className="section-kicker">CHECK THE ROSTER</span>
                  <h2>名单校对</h2>
                </div>
                <span className="small-badge">
                  {report?.mode === 'plain' ? '普通名单' : '按编号识别'}
                </span>
              </div>

              <p className="panel-note">
                点昵称可直接修改，点“女”切换 🌹 标记。同名但 🌹 不同的，会按两位报名者保留。
              </p>

              <div className="roster-list">
                {state.players.map((player, index) => (
                  <RosterRow
                    key={player.id}
                    player={player}
                    index={index}
                    onRename={(id, name) =>
                      dispatch({ type: 'UPDATE_PLAYER', id, name })
                    }
                    onToggleFemale={(id) =>
                      dispatch({ type: 'TOGGLE_FEMALE', id })
                    }
                    onRemove={(id) =>
                      dispatch({ type: 'REMOVE_PLAYER', id })
                    }
                  />
                ))}
              </div>

              <div className="add-row">
                <input
                  className="add-input"
                  value={newName}
                  maxLength={30}
                  placeholder="手动添加成员昵称"
                  aria-label="手动添加成员昵称"
                  onChange={(event) => setNewName(event.target.value)}
                  onKeyDown={(event) => {
                    if (event.key === 'Enter') {
                      event.preventDefault();
                      handleAdd();
                    }
                  }}
                />
                <button
                  type="button"
                  className="btn btn-square"
                  onClick={handleAdd}
                  aria-label="添加成员"
                >
                  <Icon name="plus" size={19} />
                </button>
              </div>

              {report?.duplicates.length ? (
                <div className="report-box is-warn">
                  <div className="report-title">
                    <Icon name="alert" size={18} />
                    <strong>已跳过 {report.duplicates.length} 个重复昵称</strong>
                  </div>
                  <div className="report-chips">
                    {report.duplicates.map((entry) => (
                      <span key={`${entry.name}-${entry.lines.join('-')}`}>
                        {entry.name}
                        <em>第 {entry.lines.join('、')} 行</em>
                      </span>
                    ))}
                  </div>
                </div>
              ) : null}

              {report?.ignored.length ? (
                <details className="report-box is-muted">
                  <summary>
                    <span>
                      <Icon name="alert" size={17} />
                      有 {report.ignored.length} 行未识别
                    </span>
                    <span className="summary-hint">展开</span>
                  </summary>
                  <ul className="ignored-list">
                    {report.ignored.slice(0, 12).map((entry) => (
                      <li key={`${entry.line}-${entry.text}`}>
                        <span className="line-no">L{entry.line}</span>
                        <span className="line-text">{entry.text}</span>
                        <span className="line-reason">{entry.reason}</span>
                      </li>
                    ))}
                  </ul>
                  {report.ignored.length > 12 ? (
                    <p className="report-more">
                      还有 {report.ignored.length - 12} 行未展示
                    </p>
                  ) : null}
                </details>
              ) : null}
            </section>
          </>
        ) : (
          <section className="empty-card">
            <span className="empty-icon">
              <Icon name="file" size={26} />
            </span>
            <h3>三步搞定一张分组海报</h3>
            <p>粘贴接龙 → 自动分好组 → 拖拽互换微调 → 保存海报。所有数据只留在你的浏览器里。</p>
            <button
              type="button"
              className="text-action"
              onClick={() => void handleSample()}
            >
              先用示例看看
              <Icon name="arrow-right" size={15} />
            </button>
          </section>
        )}

        {state.players.length > 0 || state.rawText.trim() ? (
          <div className="danger-zone">
            <button
              type="button"
              className="text-action is-danger"
              onClick={onClearDraft}
            >
              <Icon name="trash" size={14} />
              清空全部数据
            </button>
          </div>
        ) : null}
      </main>

      <ActionBar
        primaryLabel="下一步：分组"
        onPrimary={handleNext}
        primaryDisabled={state.players.length === 0}
        hint={
          state.players.length > 0
            ? `${state.players.length} 人 · 已按顺序分好组，可拖拽互换`
            : '识别名单后即可开始分组'
        }
      />
    </>
  );
}
