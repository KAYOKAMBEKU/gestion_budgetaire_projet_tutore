function parseDate(value: string | Date) {
  if (value instanceof Date) {
    return value;
  }

  const dateOnlyMatch = /^(\d{4})-(\d{2})-(\d{2})$/.exec(value);
  if (dateOnlyMatch) {
    const [, year, month, day] = dateOnlyMatch;
    return new Date(Number(year), Number(month) - 1, Number(day));
  }

  return new Date(value);
}

export function formatDate(value?: string | Date | null, fallback = "-") {
  if (!value) {
    return fallback;
  }

  const date = parseDate(value);
  if (Number.isNaN(date.getTime())) {
    return fallback;
  }

  return new Intl.DateTimeFormat("fr-FR", {
    day: "2-digit",
    month: "2-digit",
    year: "numeric",
  }).format(date);
}

export function formatDateRange(start?: string | Date | null, end?: string | Date | null, fallback = "-") {
  if (!start && !end) {
    return fallback;
  }

  return `${formatDate(start)} au ${formatDate(end)}`;
}
