import { Brief } from './Brief';

export type BriefForDisplay = {
  id: string;
  content: string;
  sensitivity: string;
  recipient: { slug: string; name: string; role: string; title?: string | null };
};

export function BriefTrio({
  briefs,
  freshIds,
}: {
  briefs: BriefForDisplay[];
  freshIds?: Set<string>;
}) {
  if (!briefs.length) {
    return (
      <div className="card p-10 text-center text-stone text-[14px] italic font-serif">
        No briefs yet — capture an observation to see the discretion engine fan out.
      </div>
    );
  }
  return (
    <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
      {briefs.map((b) => (
        <Brief
          key={b.id}
          id={b.id}
          recipient={b.recipient}
          content={b.content}
          sensitivity={b.sensitivity}
          fresh={freshIds?.has(b.id)}
        />
      ))}
    </div>
  );
}
