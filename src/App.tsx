import { useState } from "react";
import SetupWizard from "./components/SetupWizard";
import MainWindow from "./components/MainWindow";

export default function App() {
  const [modelReady, setModelReady] = useState(false);

  if (!modelReady) {
    return <SetupWizard onReady={() => setModelReady(true)} />;
  }

  return <MainWindow />;
}
