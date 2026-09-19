import { Link } from "react-router-dom";
import { guestMetrics } from "../../domain/guest";
import type { GuestRow } from "../../domain/types";
import { Icon } from "../ui/Icon";
import { InviteFluidBar } from "../ui/InviteFluidBar";

interface HomeInviteProgressCardProps {
  guests: GuestRow[];
}

export function HomeInviteProgressCard({ guests }: HomeInviteProgressCardProps) {
  const { inviteSentTotal, familyCount } = guestMetrics(guests);

  return (
    <Link
      to="/people/guests?invites=1"
      aria-label={`${inviteSentTotal} of ${familyCount} invitations sent`}
      className="home-invite-card"
    >
      <Icon name="forward_to_inbox" className="home-invite-card__icon" />
      <span className="home-invite-card__body">
        <span className="home-invite-card__lab">Invitations</span>
        <span className="home-invite-card__stat">
          {inviteSentTotal}/{familyCount} sent
        </span>
        <InviteFluidBar value={inviteSentTotal} max={familyCount} />
      </span>
      <Icon name="chevron_right" className="home-invite-card__go" />
    </Link>
  );
}
