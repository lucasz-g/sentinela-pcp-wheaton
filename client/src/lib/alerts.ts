export type AlertLevel = "critical" | "warning" | "info";

export interface Alert {
  id: string;
  opId: string;
  level: AlertLevel;
  title: string;
  message: string;
  daysUntilDeadline: number;
  progress: number;
}

/**
 * Calcula o nível de alerta baseado no prazo e progresso da OP
 */
export function calculateAlertLevel(
  daysUntilDeadline: number,
  progress: number
): AlertLevel | null {
  // OP já atrasada
  if (daysUntilDeadline < 0) {
    return "critical";
  }

  // OP próxima do prazo (7 dias ou menos) e com progresso baixo
  if (daysUntilDeadline <= 7) {
    if (progress < 80) {
      return "critical";
    } else if (progress < 100) {
      return "warning";
    }
  }

  // OP próxima do prazo (15 dias ou menos) e com progresso muito baixo
  if (daysUntilDeadline <= 15 && progress < 50) {
    return "warning";
  }

  // OP próxima do prazo (30 dias ou menos) e sem progresso
  if (daysUntilDeadline <= 30 && progress < 20) {
    return "info";
  }

  return null;
}

/**
 * Gera mensagem de alerta baseada no nível e situação
 */
export function generateAlertMessage(
  opId: string,
  level: AlertLevel,
  daysUntilDeadline: number,
  progress: number
): { title: string; message: string } {
  if (daysUntilDeadline < 0) {
    const daysLate = Math.abs(daysUntilDeadline);
    return {
      title: `OP ${opId} - Atrasada`,
      message: `Esta ordem está ${daysLate} dia${daysLate > 1 ? "s" : ""} atrasada com apenas ${progress}% de progresso.`,
    };
  }

  if (level === "critical") {
    return {
      title: `OP ${opId} - Urgente`,
      message: `Prazo em ${daysUntilDeadline} dia${daysUntilDeadline > 1 ? "s" : ""} com ${progress}% de progresso. Ação imediata necessária!`,
    };
  }

  if (level === "warning") {
    return {
      title: `OP ${opId} - Atenção`,
      message: `Prazo em ${daysUntilDeadline} dias com ${progress}% de progresso. Requer acompanhamento.`,
    };
  }

  return {
    title: `OP ${opId} - Monitorar`,
    message: `Prazo em ${daysUntilDeadline} dias com ${progress}% de progresso.`,
  };
}

/**
 * Calcula dias até o prazo
 */
export function calculateDaysUntilDeadline(deadline: string): number {
  const deadlineDate = new Date(deadline);
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  deadlineDate.setHours(0, 0, 0, 0);
  
  const diffTime = deadlineDate.getTime() - today.getTime();
  const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
  
  return diffDays;
}

/**
 * Gera alertas para uma lista de OPs
 */
export function generateAlerts(orders: any[]): Alert[] {
  const alerts: Alert[] = [];

  orders.forEach((order) => {
    const daysUntilDeadline = calculateDaysUntilDeadline(order.deadline);
    const level = calculateAlertLevel(daysUntilDeadline, order.progress);

    if (level) {
      const { title, message } = generateAlertMessage(
        order.op_id,
        level,
        daysUntilDeadline,
        order.progress
      );

      alerts.push({
        id: `alert-${order.op_id}`,
        opId: order.op_id,
        level,
        title,
        message,
        daysUntilDeadline,
        progress: order.progress,
      });
    }
  });

  // Ordenar por prioridade: critical > warning > info
  // Dentro de cada nível, ordenar por dias até prazo (mais urgente primeiro)
  alerts.sort((a, b) => {
    const levelPriority = { critical: 1, warning: 2, info: 3 };
    const levelDiff = levelPriority[a.level] - levelPriority[b.level];
    
    if (levelDiff !== 0) {
      return levelDiff;
    }
    
    return a.daysUntilDeadline - b.daysUntilDeadline;
  });

  return alerts;
}
