export function DayListSkeleton() {
  return (
    <ul className="day-list" aria-hidden="true">
      {Array.from({ length: 6 }, (_, index) => (
        <li key={index} className="day-item day-item--skeleton">
          <span className="skeleton photo-stack" />
          <span className="day-item__text">
            <span className="skeleton skeleton--line" style={{ width: '55%' }} />
            <span className="skeleton skeleton--line skeleton--small" style={{ width: '85%' }} />
          </span>
        </li>
      ))}
    </ul>
  )
}

export function DayViewSkeleton() {
  return (
    <section className="day-view" aria-busy="true" aria-label="Loading moments">
      <div className="day-view__header">
        <div className="day-view__heading">
          <span className="skeleton skeleton--line skeleton--small" style={{ width: 170 }} />
          <span className="skeleton skeleton--title" />
        </div>
      </div>
      <div className="day-view__body">
        <div className="moment-grid">
          {Array.from({ length: 4 }, (_, index) => (
            <div key={index} className="moment-card">
              <div className="skeleton moment-card__media moment-card__media--skeleton" />
              <div className="moment-card__body">
                <span className="skeleton skeleton--line" style={{ width: '40%' }} />
                <span className="skeleton skeleton--line" style={{ width: '90%' }} />
              </div>
            </div>
          ))}
        </div>
      </div>
    </section>
  )
}
