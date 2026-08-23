import { Link } from "react-router-dom";
import { Icon } from "../components/ui/Icon";

export function ComingSoonPage() {
  return (
    <div className="bento-card rounded-xl p-8 md:p-12 text-center max-w-lg mx-auto mt-12">
      <Icon name="construction" className="text-primary text-4xl mb-4" />
      <h2 className="font-headline-lg text-headline-lg text-primary mb-2">Coming Soon</h2>
      <p className="font-body-md text-on-surface-variant mb-6">
        This module is part of Phase 2. The Menu Board is live now.
      </p>
      <Link
        to="/menu"
        className="inline-flex items-center gap-2 px-6 py-3 bg-primary text-on-primary rounded-full font-button text-button hover:opacity-90"
      >
        <Icon name="restaurant" />
        Open Menu Board
      </Link>
    </div>
  );
}
