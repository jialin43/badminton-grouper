import type { Step } from '../types';
import { Icon } from './Icon';

const COPY: Record<
  Step,
  { step: string; title: string; accent: string; subtitle: string }
> = {
  1: {
    step: '导入名单',
    title: '接龙',
    accent: '分组',
    subtitle: '粘贴微信报名接龙，自动识别昵称和 🌹 女生。',
  },
  2: {
    step: '拖拽排组',
    title: '拖一拖',
    accent: '分好组',
    subtitle: '每场满 6 人，余下自动进后补；拖动即可调整。',
  },
  3: {
    step: '生成海报',
    title: '分组',
    accent: '海报',
    subtitle: '核对时间、场馆和名单，保存后直接发群。',
  },
};

const STEP_LABELS = ['导入', '分组', '海报'];

export function AppHeader({ step }: { step: Step }) {
  const copy = COPY[step];

  return (
    <header className="app-header">
      <div className="header-orb" aria-hidden="true" />
      <div className="header-lines" aria-hidden="true" />
      <div className="header-top">
        <div className="brand">
          <span className="brand-mark" aria-hidden="true">
            <Icon name="shuttle" size={26} strokeWidth={1.7} />
          </span>
          <span className="brand-copy">
            <strong>羽六</strong>
            <small>SHUTTLE SIX</small>
          </span>
        </div>
        <span className="step-count">STEP {String(step).padStart(2, '0')}</span>
      </div>

      <div className="header-copy">
        <div className="eyebrow">
          <span className="eyebrow-dot" aria-hidden="true" />
          {copy.step}
        </div>
        <h1>
          {copy.title}
          <span className="accent">{copy.accent}</span>
        </h1>
        <p>{copy.subtitle}</p>
      </div>

      <div className="stepper" aria-label={`当前第 ${step} 步，共 3 步`}>
        {STEP_LABELS.map((label, index) => {
          const number = index + 1;
          const state =
            number < step ? 'done' : number === step ? 'active' : 'idle';
          return (
            <div className={`stepper-item is-${state}`} key={label}>
              <span className="stepper-number">
                {state === 'done' ? (
                  <Icon name="check" size={13} strokeWidth={2.6} />
                ) : (
                  String(number).padStart(2, '0')
                )}
              </span>
              <span className="stepper-label">{label}</span>
              {index < STEP_LABELS.length - 1 ? (
                <span className="stepper-line" aria-hidden="true" />
              ) : null}
            </div>
          );
        })}
      </div>

      <div className="privacy-pill">
        <span className="privacy-dot" aria-hidden="true" />
        纯本地运行 · 名单不上传
      </div>
    </header>
  );
}
