export function StatusDot({
  status = 'pending',
  size = 6,
}: {
  status?: 'pending' | 'approved' | 'sent' | 'archived';
  size?: number;
}) {
  const colors: Record<string, string> = {
    pending: '#a8945a',
    approved: 'var(--iris-green)',
    sent: 'var(--iris-green)',
    archived: '#B5B0A8',
  };
  return (
    <span
      style={{
        display: 'inline-block',
        width: size,
        height: size,
        borderRadius: '50%',
        background: colors[status] ?? colors.pending,
        flexShrink: 0,
      }}
    />
  );
}
