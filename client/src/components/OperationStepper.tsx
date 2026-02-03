import "./OperationStepper.css";

interface Operation {
  code: string;
  desc: string;
  status: string;
}

export function OperationStepper({ operations }: { operations: Operation[] }) {
  const statusPriority: Record<string, number> = {
    CONCLUIDA: 0,
    EM_ANDAMENTO: 1,
    NAO_INICIADA: 2,
    CANCELADA: 3,
  };

  const sortedOperations = [...operations].sort(
    (a, b) =>
      (statusPriority[a.status] ?? 99) - (statusPriority[b.status] ?? 99)
  );

  console.log(
    "STATUSES:",
    operations.map(o => o.status)
  );

  return (
    <div className="op-stepper">
      {sortedOperations.map((op, index) => (
        <div key={`${op.code}-${index}`} className="op-stepper-item">
          <div
            className={`op-card ${
              op.status === "CONCLUIDA"
                ? "op-card--done"
                : op.status === "EM_ANDAMENTO"
                  ? "op-card--active"
                  : "op-card--inactive"
            }`}
          >
            <span className="op-code">{op.code}</span>
            <span className="op-desc">{op.desc}</span>
          </div>

          {index < sortedOperations.length - 1 && (
            <div className="op-connector" />
          )}
        </div>
      ))}
    </div>
  );
}
