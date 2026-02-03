import "./OperationStepper.css";

interface Operation {
  code: string;
  desc: string;
  status: string;
}

export function OperationStepper({ operations }: { operations: Operation[] }) {
  
  const sortedOperations = [...operations].sort((a, b) => {
    if (a.status === "INTERROMPIDA" && b.status !== "INTERROMPIDA") return -1;
    if (a.status !== "INTERROMPIDA" && b.status === "INTERROMPIDA") return 1;
    return 0;
  });

  return (
    <div className="op-stepper">
      {sortedOperations.map((op, index) => (
        <div key={`${op.code}-${index}`} className="op-stepper-item">
          <div
            className={`op-card ${
              op.status === "EM_ANDAMENTO"
                ? "op-card--active"
                : op.status === "CONCLUIDA"
                ? "op-card--done"
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
