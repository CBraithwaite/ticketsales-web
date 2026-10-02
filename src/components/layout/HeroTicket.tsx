/**
 * The homepage hero's ticket stub: a gold "Admit one" ticket with a perforated
 * tear line and a QR code, with a paper ticket fanned out behind it. Purely
 * decorative (aria-hidden) — the brand name made literal.
 *
 * Drawn at its display size (no CSS scaling) so the type stays crisp; the
 * smallest text is 11px.
 */

const W = 228;
const H = 106;
const TEAR_X = 158; // x of the perforation between ticket body and stub
const NOTCH_R = 8;
const RADIUS = 12;

/** Ticket outline: rounded rectangle with semicircle notches at the tear line. */
function TicketShape({ id, fill }: { id: string; fill: string }) {
  return (
    <svg viewBox={`0 0 ${W} ${H}`} className="absolute inset-0 h-full w-full" aria-hidden>
      <defs>
        <mask id={id}>
          <rect width={W} height={H} rx={RADIUS} fill="white" />
          <circle cx={TEAR_X} cy="0" r={NOTCH_R} fill="black" />
          <circle cx={TEAR_X} cy={H} r={NOTCH_R} fill="black" />
        </mask>
      </defs>
      <rect width={W} height={H} rx={RADIUS} fill={fill} mask={`url(#${id})`} />
    </svg>
  );
}

/** A fixed, QR-looking pattern: three finder squares plus a deterministic scatter of modules. */
function QrMark() {
  const n = 21;
  const finder = (x: number, y: number) => (
    <g key={`f${x}-${y}`}>
      <rect x={x} y={y} width="7" height="7" fill="currentColor" />
      <rect x={x + 1} y={y + 1} width="5" height="5" fill="var(--ticket-paper)" />
      <rect x={x + 2} y={y + 2} width="3" height="3" fill="currentColor" />
    </g>
  );
  const inFinder = (x: number, y: number) =>
    (x < 8 && y < 8) || (x > n - 9 && y < 8) || (x < 8 && y > n - 9);

  const modules = [];
  let seed = 7;
  for (let y = 0; y < n; y++) {
    for (let x = 0; x < n; x++) {
      seed = (seed * 1103515245 + 12345) & 0x7fffffff;
      if (!inFinder(x, y) && seed % 100 < 46) {
        modules.push(<rect key={`${x}-${y}`} x={x} y={y} width="1" height="1" fill="currentColor" />);
      }
    }
  }

  return (
    <svg viewBox={`-1 -1 ${n + 2} ${n + 2}`} className="h-[50px] w-[50px] rounded-[4px]" shapeRendering="crispEdges" aria-hidden>
      <rect x="-1" y="-1" width={n + 2} height={n + 2} fill="var(--ticket-paper)" />
      {modules}
      {finder(0, 0)}
      {finder(n - 7, 0)}
      {finder(0, n - 7)}
    </svg>
  );
}

export default function HeroTicket() {
  return (
    <div
      aria-hidden
      className="relative hidden h-[128px] w-[252px] shrink-0 xl:block"
      style={{ ['--ticket-paper' as string]: '#FFF7E2', ['--ticket-ink' as string]: '#0B3B22' }}
    >
      {/* Paper ticket fanned out behind */}
      <div
        className="absolute right-1 top-0.5"
        style={{ width: W, height: H, transform: 'rotate(4deg)' }}
      >
        <TicketShape id="hero-ticket-back" fill="rgb(255 247 226 / 0.16)" />
      </div>

      {/* Gold ticket in front */}
      <div
        className="hero-ticket absolute bottom-1 left-0 drop-shadow-[0_10px_18px_rgba(0,0,0,0.35)]"
        style={{ width: W, height: H, transform: 'rotate(-3deg)' }}
      >
        <TicketShape id="hero-ticket-front" fill="hsl(44 96% 56%)" />

        {/* Perforation */}
        <div
          className="absolute border-l-[1.5px] border-dashed"
          style={{ left: TEAR_X - 1, top: NOTCH_R + 5, bottom: NOTCH_R + 5, borderColor: 'rgb(11 59 34 / 0.4)' }}
        />

        {/* Ticket body */}
        <div
          className="absolute inset-y-0 left-0 flex flex-col justify-between px-3.5 py-3"
          style={{ width: TEAR_X, color: 'var(--ticket-ink)' }}
        >
          <div>
            <p className="text-[11px] font-semibold leading-none opacity-80">Admit one</p>
            <p className="mt-1.5 font-display text-[18px] font-extrabold leading-[1.05] tracking-tight">
              Your next
              <br />
              event
            </p>
          </div>
          <p className="text-[11px] font-semibold leading-none opacity-80">Choice Stubs</p>
        </div>

        {/* Stub with QR */}
        <div
          className="absolute inset-y-0 right-0 flex items-center justify-center"
          style={{ width: W - TEAR_X, color: 'var(--ticket-ink)' }}
        >
          <QrMark />
        </div>
      </div>
    </div>
  );
}
