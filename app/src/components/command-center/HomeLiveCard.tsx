import { useNavigateInsideEvent } from "../../navigation/eventHistory";

type HomeModuleCardProps = {
  title: string;
  line: string;
  image: string;
  pending?: number;
  to?: string;
  onOpen?: () => void;
  liftArt?: boolean;
};

function pendingLabel(count: number): string {
  if (count > 99) return "99+";
  return String(count);
}

export function HomeLiveCard({ title, line, image, pending = 0, to, onOpen, liftArt = false }: HomeModuleCardProps) {
  const go = useNavigateInsideEvent();
  const waiting = pending > 0;
  const label = waiting ? `${title}, ${pending} pending` : title;
  const face = (
    <>
      <span className="block">
        <span className="block text-[18px] font-bold tracking-[-0.03em] text-black">{title}</span>
        <span className="home-module__line">{line}</span>
      </span>
      <img src={image} alt="" className={liftArt ? "home-module__art home-module__art--lift" : "home-module__art"} />
    </>
  );
  const badge = waiting ? (
    <span className="home-module__badge" aria-hidden>
      {pendingLabel(pending)}
    </span>
  ) : null;

  return (
    <span className="home-module-slot">
      <button
        type="button"
        aria-label={label}
        className="home-module"
        onClick={() => {
          if (to) go(to);
          else onOpen?.();
        }}
      >
        {face}
      </button>
      {badge}
    </span>
  );
}
