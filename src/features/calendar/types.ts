export type CalendarEngineer = Readonly<{
  id: string
  displayName: string
  team: string
}>

export type CalendarEventView = Readonly<{
  id: string
  engineerId: string
  engineerName: string
  title: string
  date: string
  startTime: string | null
  note: string | null
}>

export type EvaluationCalendarInput = Readonly<{
  engineerId: string
  title: string
  date: string
  startTime: string | null
  note: string | null
}>

export type EvaluationCalendarProps = Readonly<{
  month: string
  events: readonly CalendarEventView[]
  engineers: readonly CalendarEngineer[]
  readOnly: boolean
  onMonthChange: (month: string) => void
  onCreate: (input: EvaluationCalendarInput) => boolean
  onUpdate: (eventId: string, input: EvaluationCalendarInput) => boolean
  onDelete: (eventId: string) => boolean
}>

export type CalendarDay = Readonly<{
  date: string
  day: number
  isCurrentMonth: boolean
}>

export type CalendarEventGroup = Readonly<{
  date: string
  events: readonly CalendarEventView[]
}>
