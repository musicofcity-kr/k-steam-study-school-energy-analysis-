export type MissionStep = {
  id: string;
  title: string;
  status: string;
  done: boolean;
  locked?: boolean;
};

type MissionMapProps = {
  steps: MissionStep[];
  activeIndex: number;
  onSelect: (id: string) => void;
};

export function MissionMap({ steps, activeIndex, onSelect }: MissionMapProps) {
  return (
    <nav className="mission-map" aria-label="미션 진행도">
      <div className="mission-map-label">MISSION MAP · 우리 팀의 설계 진행도</div>
      <ol>
        {steps.map((step, index) => {
          const isActive = index === activeIndex;
          return (
            <li className={step.done ? 'done' : step.locked ? 'locked' : isActive ? 'active' : ''} key={step.id}>
              <button
                type="button"
                onClick={() => onSelect(step.id)}
                aria-current={isActive ? 'step' : undefined}
                disabled={step.locked}
              >
                <span className="mission-node">{step.done ? '✓' : index + 1}</span>
                <strong>{step.title}</strong>
                <small>{step.status}</small>
              </button>
            </li>
          );
        })}
      </ol>
    </nav>
  );
}
