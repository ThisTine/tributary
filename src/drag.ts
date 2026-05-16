import { getCurrentWindow } from "@tauri-apps/api/window";

const INTERACTIVE = "button,input,a,select,textarea,[data-no-drag]";

export function startDrag(e: React.MouseEvent) {
  if (e.button !== 0) return;
  if ((e.target as HTMLElement).closest(INTERACTIVE)) return;
  void getCurrentWindow().startDragging();
}
