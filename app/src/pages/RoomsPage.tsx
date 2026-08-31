import { Link } from "react-router-dom";
import { Icon } from "../components/ui/Icon";
import { ViewerBanner } from "../components/access/ViewerBanner";

export function RoomsPage() {
  return (
    <div className="flex flex-col gap-2 min-h-0 flex-1">
      <ViewerBanner module="rooms" />
      <div className="bento-card mobile-card rounded-2xl p-6 max-lg:p-5 md:p-12 text-center max-w-lg mx-auto mt-3 lg:mt-10 border border-[rgba(128,0,32,0.1)]">
        <Icon name="hotel" className="text-primary text-[32px] lg:text-4xl mb-3 lg:mb-4" />
        <h2 className="font-headline-md text-primary text-[20px] lg:text-[24px] mb-1.5 lg:mb-2">
          Room mapping
        </h2>
        <p className="text-[13px] text-on-surface-variant mb-5 lg:mb-6 max-w-sm mx-auto leading-relaxed">
          Assign families to rooms and track stay logistics. This module is coming in a future release.
        </p>
        <Link
          to="/people/guests"
          className="inline-flex items-center gap-2 h-11 px-5 bg-primary text-on-primary rounded-full font-button text-[13px] hover:opacity-90"
        >
          <Icon name="groups" className="text-[18px]" />
          Back to Guests
        </Link>
      </div>
    </div>
  );
}
