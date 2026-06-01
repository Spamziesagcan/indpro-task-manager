export function toTaskBackendId(id: string) {
  const numeric = Number(id);
  return Number.isNaN(numeric) ? id : numeric;
}
