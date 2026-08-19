import { Label } from "@/components/ui/label"

type AccountInsightsPermissionFieldProps = Readonly<{
  checked: boolean
  disabled: boolean
  visible: boolean
  onChange: (checked: boolean) => void
}>

export function AccountInsightsPermissionField({
  checked,
  disabled,
  visible,
  onChange,
}: AccountInsightsPermissionFieldProps) {
  if (!visible) return null
  return (
    <div className="space-y-2 border-t border-border pt-4">
      <Label className="flex items-start gap-2.5" htmlFor="account-view-insights">
        <input
          checked={checked}
          className="mt-0.5 size-4"
          disabled={disabled}
          id="account-view-insights"
          onChange={(event) => onChange(event.currentTarget.checked)}
          type="checkbox"
        />
        <span>
          <span className="block text-sm font-medium">전체 현황·분석 열람</span>
          <span className="mt-0.5 block break-keep text-[13px] leading-5 font-normal text-muted-foreground">
            집계 점수·순위만 조회. 개별 평가 결과·가중치는 비공개
          </span>
        </span>
      </Label>
    </div>
  )
}
