import {
  IconUser, IconMail, IconPhone, IconHome, IconId,
  IconLink, IconCalendar, IconBuilding, IconCreditCard,
} from "@tabler/icons-react";

const ICONS: Record<string, React.ReactElement> = {
  private_person:       <IconUser size={12} />,
  private_email:        <IconMail size={12} />,
  private_phone:        <IconPhone size={12} />,
  private_address:      <IconHome size={12} />,
  private_id:           <IconId size={12} />,
  private_url:          <IconLink size={12} />,
  private_date:         <IconCalendar size={12} />,
  private_organization: <IconBuilding size={12} />,
  account_number:       <IconCreditCard size={12} />,
};

export function iconForLabel(label: string): React.ReactElement | null {
  return ICONS[label] ?? null;
}
