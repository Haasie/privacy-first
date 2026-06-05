import { useEffect, useState } from "react";
import { open } from "@tauri-apps/plugin-dialog";
import { getCurrentWebviewWindow } from "@tauri-apps/api/webviewWindow";

const FILE_FILTERS = [{ name: "Documents", extensions: ["txt", "pdf", "docx"] }];

export function useFileInput(onFilePicked: (path: string) => void) {
  const [isDragging, setIsDragging] = useState(false);

  useEffect(() => {
    let unlisten: (() => void) | undefined;
    getCurrentWebviewWindow()
      .onDragDropEvent((event) => {
        if (event.payload.type === "over") {
          setIsDragging(true);
        } else if (event.payload.type === "leave" || event.payload.type === "cancelled") {
          setIsDragging(false);
        } else if (event.payload.type === "drop") {
          setIsDragging(false);
          if (event.payload.paths.length > 0) {
            onFilePicked(event.payload.paths[0]);
          }
        }
      })
      .then((fn) => { unlisten = fn; });
    return () => { unlisten?.(); };
  }, [onFilePicked]);

  async function selectFile() {
    const result = await open({ multiple: false, filters: FILE_FILTERS });
    if (result) onFilePicked(result as string);
  }

  async function selectOutputDir(): Promise<string | null> {
    const result = await open({ directory: true });
    return result ? (result as string) : null;
  }

  return { selectFile, selectOutputDir, isDragging };
}
