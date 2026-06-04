import { useEffect } from "react";
import { open } from "@tauri-apps/plugin-dialog";
import { getCurrentWebviewWindow } from "@tauri-apps/api/webviewWindow";

const FILE_FILTERS = [{ name: "Documents", extensions: ["txt", "pdf", "docx"] }];

/**
 * Registers a window-level drag-drop listener and exposes a file-picker dialog.
 * The Tauri drop event fires anywhere on the window, not at a specific element.
 */
export function useFileInput(onFilePicked: (path: string) => void) {
  useEffect(() => {
    let unlisten: (() => void) | undefined;
    getCurrentWebviewWindow()
      .onDragDropEvent((event) => {
        if (event.payload.type === "drop" && event.payload.paths.length > 0) {
          onFilePicked(event.payload.paths[0]);
        }
      })
      .then((fn) => {
        unlisten = fn;
      });
    return () => {
      unlisten?.();
    };
  }, [onFilePicked]);

  async function selectFile() {
    const result = await open({ multiple: false, filters: FILE_FILTERS });
    if (result) onFilePicked(result as string);
  }

  async function selectOutputDir(): Promise<string | null> {
    const result = await open({ directory: true });
    return result ? (result as string) : null;
  }

  return { selectFile, selectOutputDir };
}
