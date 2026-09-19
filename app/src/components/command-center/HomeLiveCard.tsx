import { Link } from "react-router-dom";
import { Icon } from "../ui/Icon";
import { cn } from "../../design-system/cn";
import type { HomeLiveCardData } from "../../domain/commandCenterSummary";

export function HomeLiveCard({ card }: { card: HomeLiveCardData }) {
  return (
    <Link
      to={card.to}
      aria-label={card.title}
      className={cn(
        "home-live-card",
        `c-${card.id}`,
        card.needsAction && "needs-action",
        card.isOk && "is-ok",
      )}
    >
      <span className="home-live-card__bg" aria-hidden />
      <span className="home-live-card__veil" aria-hidden />
      {card.parkChrome ? null : (
        <>
          <span className="home-live-card__pill">
            <span className="home-live-card__av">
              <Icon name={card.icon} className="text-[14px]" />
            </span>
            <b>{card.title}</b>
            <span className={cn("home-live-card__tag", card.tagTone)}>{card.tag}</span>
          </span>
          <span className="home-live-card__body">
            <p className="home-live-card__action">
              <span className="home-live-card__pulse" aria-hidden />
              {card.actionLine}
            </p>
            <h3>{card.headline}</h3>
            {card.meta.length > 0 ? (
              <span className="home-live-card__meta">
                {card.meta.map((item) => (
                  <span key={item}>{item}</span>
                ))}
              </span>
            ) : null}
            <span className="home-live-card__cta">
              <Icon name="arrow_forward" className="text-[16px] text-white" />
              {card.cta}
            </span>
          </span>
        </>
      )}
    </Link>
  );
}
