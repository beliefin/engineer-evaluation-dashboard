import { PencilIcon, Trash2Icon } from "lucide-react"

import { Button } from "@/components/ui/button"
import { cn } from "@/lib/utils"
import styles from "./roster-signal.module.css"

type RosterActionItem = Readonly<{
  id: string
  displayName: string
}>

export function RosterItemActions<Item extends RosterActionItem>({
  item,
  disabled,
  linkedAccount,
  onEdit,
  onDelete,
  surface,
}: Readonly<{
  item: Item
  disabled: boolean
  linkedAccount: boolean
  onEdit: (item: Item) => void
  onDelete: (item: Item) => void
  surface: "mobile" | "desktop"
}>) {
  const linkedDescriptionId = `${item.id}-${surface}-linked-account-description`
  return (
    <div className={cn(styles.itemActions, surface === "mobile" ? styles.mobileActions : styles.desktopActions)}>
      {linkedAccount ? (
        <span
          className={styles.linked}
          id={linkedDescriptionId}
        >
          계정 연결됨
        </span>
      ) : null}
      <Button
        aria-label={`${item.displayName} 수정`}
        disabled={disabled}
        onClick={() => onEdit(item)}
        className={surface === "mobile" ? "size-11" : undefined}
        size={surface === "mobile" ? "icon-lg" : "icon-sm"}
        type="button"
        variant="outline"
      >
        <PencilIcon aria-hidden="true" />
      </Button>
      <Button
        aria-describedby={linkedAccount ? linkedDescriptionId : undefined}
        aria-label={`${item.displayName} 삭제`}
        disabled={disabled || linkedAccount}
        onClick={() => onDelete(item)}
        className={surface === "mobile" ? "size-11" : undefined}
        size={surface === "mobile" ? "icon-lg" : "icon-sm"}
        title={linkedAccount ? "연결된 로그인 계정을 먼저 변경하거나 삭제해 주세요." : undefined}
        type="button"
        variant="outline"
      >
        <Trash2Icon aria-hidden="true" />
      </Button>
    </div>
  )
}
