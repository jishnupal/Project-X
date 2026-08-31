import { MenuBoard } from "../components/menu/MenuBoard";

export function MenuPage() {
  return (
    <div className="flex flex-col flex-1 min-h-0 h-full max-lg:overflow-y-auto">
      <MenuBoard />
    </div>
  );
}
