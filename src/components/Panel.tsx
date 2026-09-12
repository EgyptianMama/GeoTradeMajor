import { useState, type ReactNode } from 'react';

interface Props {
  title: string;
  /** Methodology blurb shown by the "?" button, as in the reference. */
  info?: string;
  live?: boolean;
  pro?: boolean;
  /** Right-aligned action control in the header, e.g. "Watchlist". */
  action?: ReactNode;
  /** Extra grid-span classes. */
  className?: string;
  flush?: boolean;
  children: ReactNode;
}

export function Panel({
  title,
  info,
  live = false,
  pro = false,
  action,
  className = '',
  flush = false,
  children,
}: Props) {
  const [showInfo, setShowInfo] = useState(false);
  const [collapsed, setCollapsed] = useState(false);

  return (
    <div className={`panel ${collapsed ? 'is-collapsed' : ''} ${className}`.trim()}>
      <div
        className="panel-header"
        onDoubleClick={() => setCollapsed((c) => !c)}
        title="Double-click to collapse"
      >
        <div className="panel-header-left">
          <span className="panel-title" role="heading" aria-level={2}>
            {title}
          </span>
          {info && (
            <div className="panel-info-wrapper">
              <button
                type="button"
                className="panel-info-btn"
                aria-label="Show methodology info"
                onClick={(e) => {
                  e.stopPropagation();
                  setShowInfo((s) => !s);
                }}
                onMouseEnter={() => setShowInfo(true)}
                onMouseLeave={() => setShowInfo(false)}
              >
                ?
              </button>
              {showInfo && (
                <div className="panel-info-tooltip">
                  <strong>{title}</strong>
                  {info}
                </div>
              )}
            </div>
          )}
        </div>

        <div className="panel-header-right">
          {pro && <span className="panel-data-badge pro">PRO</span>}
          {live && <span className="panel-data-badge live">LIVE</span>}
          {action}
          <button
            type="button"
            className="panel-collapse-btn"
            aria-label={collapsed ? 'Expand panel' : 'Collapse panel'}
            onClick={(e) => {
              e.stopPropagation();
              setCollapsed((c) => !c);
            }}
          >
            {collapsed ? '▸' : '▾'}
          </button>
        </div>
      </div>

      {!collapsed && (
        <div className={`panel-content${flush ? ' flush' : ''}`}>{children}</div>
      )}
    </div>
  );
}

interface TabsProps<T extends string> {
  tabs: { id: T; label: string }[];
  active: T;
  onChange: (id: T) => void;
}

export function PanelTabs<T extends string>({ tabs, active, onChange }: TabsProps<T>) {
  return (
    <div className="panel-tabs" role="tablist">
      {tabs.map((t) => (
        <button
          key={t.id}
          type="button"
          role="tab"
          aria-selected={t.id === active}
          className={`panel-tab${t.id === active ? ' active' : ''}`}
          onClick={() => onChange(t.id)}
        >
          {t.label}
        </button>
      ))}
    </div>
  );
}
