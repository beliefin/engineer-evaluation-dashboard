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
            집계 점수와 순위만 조회합니다. 개별 평가 결과·가중치는 공개하지 않습니다.
          </span>
        </span>
      </Label>
    </div>
  )
}
