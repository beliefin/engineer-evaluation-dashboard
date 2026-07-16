import { PencilIcon, Trash2Icon } from "lucide-react"

import { Button } from "@/components/ui/button"

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
    <div className="mt-2 flex items-center justify-end gap-1 md:mt-0">
      {linkedAccount ? (
        <span
          className="mr-1 text-xs whitespace-nowrap text-muted-foreground"
          id={linkedDescriptionId}
        >
          계정 연결됨
        </span>
      ) : null}
      <Button
        aria-label={`${item.displayName} 수정`}
        disabled={disabled}
        onClick={() => onEdit(item)}
        size="icon-sm"
        type="button"
        variant="ghost"
      >
        <PencilIcon aria-hidden="true" />
      </Button>
      <Button
        aria-describedby={linkedAccount ? linkedDescriptionId : undefined}
        aria-label={`${item.displayName} 삭제`}
        disabled={disabled || linkedAccount}
        onClick={() => onDelete(item)}
        size="icon-sm"
        title={linkedAccount ? "연결된 로그인 계정을 먼저 변경하거나 삭제해 주세요." : undefined}
        type="button"
        variant="destructive"
      >
        <Trash2Icon aria-hidden="true" />
      </Button>
    </div>
  )
}
