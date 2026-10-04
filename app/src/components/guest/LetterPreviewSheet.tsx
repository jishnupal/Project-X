import { MobileSheet } from "../ui/MobileSheet";
import { InviteLetterPreview, type InviteLetterContent } from "./InviteLetterPreview";

type LetterPreviewSheetProps = {
  open: boolean;
  onClose: () => void;
  content: InviteLetterContent;
  title?: string;
};

export function LetterPreviewSheet({
  open,
  onClose,
  content,
  title = "Letter preview",
}: LetterPreviewSheetProps) {
  return (
    <MobileSheet
      open={open}
      onClose={onClose}
      title={title}
      height="tall"
      zIndexClass="z-[95]"
      headerAction="back"
      panelClassName="bg-[#fff8f5]"
    >
      <div className="space-y-3 px-4 pb-10">
        <p className="text-[13px] font-medium leading-snug text-[#584141]">
          Quick check for this guest. For the full scroll-through experience, use Preview letter
          on Invitations.
        </p>
        <InviteLetterPreview content={content} size="sheet" />
        <p className="text-[12px] font-medium text-[#9a8b82]">
          Template: Classic · More designs coming with Pro
        </p>
      </div>
    </MobileSheet>
  );
}
