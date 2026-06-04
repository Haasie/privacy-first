import { useState } from "react";
import { Container, Text } from "@mantine/core";
import SetupWizard from "./components/SetupWizard";

export default function App() {
  const [modelReady, setModelReady] = useState(false);

  if (!modelReady) {
    return <SetupWizard onReady={() => setModelReady(true)} />;
  }

  return (
    <Container>
      <Text>Main window (Task 9)</Text>
    </Container>
  );
}
