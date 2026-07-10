import { useEffect, useRef, useState } from 'react';
import type { DataProvenance } from '../types';

type HeaderProps = {
  rowCount: number;
  localSupplyRate: number;
  dataSource: string;
  dataProvenance: DataProvenance;
  isTeacherMode: boolean;
  storageStatus?: string;
  onResetDesign: () => void;
  onResetClass: () => void;
};

const provenanceLabels: Record<DataProvenance, string> = {
  'practice-assumption': '수업용 가정 데이터',
  'teacher-prepared-public-data': '교사가 준비한 공공데이터',
  'unknown-upload': '출처 확인 필요'
};

export function Header({
  rowCount,
  localSupplyRate,
  dataSource,
  dataProvenance,
  isTeacherMode,
  storageStatus = '',
  onResetDesign,
  onResetClass
}: HeaderProps) {
  const [resetTarget, setResetTarget] = useState<'design' | 'class' | null>(null);
  const headerRef = useRef<HTMLElement>(null);
  const dialogRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!resetTarget) return;
    const previousFocus = document.activeElement instanceof HTMLElement ? document.activeElement : null;
    const main = document.querySelector('main');
    headerRef.current?.setAttribute('inert', '');
    main?.setAttribute('inert', '');

    const getFocusableButtons = () => Array.from(dialogRef.current?.querySelectorAll<HTMLButtonElement>('button:not(:disabled)') ?? []);
    const handleDialogKeys = (event: KeyboardEvent) => {
      if (event.key === 'Escape') {
        setResetTarget(null);
        return;
      }
      if (event.key !== 'Tab') return;
      const buttons = getFocusableButtons();
      if (buttons.length === 0) return;
      const first = buttons[0];
      const last = buttons[buttons.length - 1];
      if (event.shiftKey && document.activeElement === first) {
        event.preventDefault();
        last.focus();
      } else if (!event.shiftKey && document.activeElement === last) {
        event.preventDefault();
        first.focus();
      }
    };
    const focusTimer = window.setTimeout(() => getFocusableButtons()[0]?.focus(), 0);
    window.addEventListener('keydown', handleDialogKeys);
    return () => {
      window.clearTimeout(focusTimer);
      window.removeEventListener('keydown', handleDialogKeys);
      headerRef.current?.removeAttribute('inert');
      main?.removeAttribute('inert');
      previousFocus?.focus();
    };
  }, [resetTarget]);

  const confirmReset = () => {
    if (resetTarget === 'design') onResetDesign();
    if (resetTarget === 'class') onResetClass();
    setResetTarget(null);
  };

  return (
    <>
      <header className="topbar" ref={headerRef}>
      <a className="brand" href="#start">
        <span className="brand-mark" aria-hidden="true">
          EC
        </span>
        <span>
          <strong>E-CITY 2050</strong>
          <small>에너지 자립 미래도시 설계실</small>
        </span>
      </a>
      <div className="header-tools">
        <div className="status-pills" aria-label="현재 활동 상태">
          <span>{rowCount > 0 ? `데이터 ${rowCount}행` : '데이터 대기'}</span>
          <span>지역 충당률 {localSupplyRate}%</span>
          <span className={`provenance-badge provenance-${dataProvenance}`}>{provenanceLabels[dataProvenance]}</span>
          <span className="source-file-pill" title={dataSource}>{dataSource}</span>
          {storageStatus && <span className="storage-status" role="status" aria-live="polite">{storageStatus}</span>}
          {isTeacherMode && <span className="teacher-mode-badge">교사용 모드</span>}
        </div>
        <div className="header-actions" aria-label="수업 초기화 도구">
          <button type="button" onClick={() => setResetTarget('design')}>설계만 초기화</button>
          <button type="button" onClick={() => setResetTarget('class')}>처음부터</button>
        </div>
      </div>
      </header>
      {resetTarget && (
        <div className="reset-dialog-backdrop" role="presentation" onMouseDown={() => setResetTarget(null)}>
          <div
            className="reset-dialog"
            ref={dialogRef}
            role="alertdialog"
            aria-modal="true"
            aria-labelledby="reset-dialog-title"
            aria-describedby="reset-dialog-description"
            onMouseDown={(event) => event.stopPropagation()}
          >
            <h2 id="reset-dialog-title">{resetTarget === 'design' ? '설계안만 초기화할까요?' : '수업을 처음부터 시작할까요?'}</h2>
            <p id="reset-dialog-description">
              {resetTarget === 'design'
                ? '저장한 설계안 A와 B가 지워집니다. 앞에서 완료한 개념 활동과 데이터는 남습니다.'
                : '이 기기에 저장된 미션 답, 데이터, 설계안과 보고서가 모두 지워집니다.'}
            </p>
            <div className="reset-dialog-actions">
              <button type="button" onClick={() => setResetTarget(null)}>취소</button>
              <button className="danger-button" type="button" onClick={confirmReset}>
                {resetTarget === 'design' ? '설계안 초기화' : '모두 지우고 시작'}
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
