import { Alert } from "@mantine/core";

interface Props {
  error: string;
  onDismiss: () => void;
}

export default function ErrorBanner({ error, onDismiss }: Props) {
  return (
    <Alert color="red" title="Error" withCloseButton onClose={onDismiss}>
      {error}
    </Alert>
  );
}
