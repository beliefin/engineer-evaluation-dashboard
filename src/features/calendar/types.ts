export type CalendarEngineer = Readonly<{
  id: string
  displayName: string
  team: string
  taskIds: readonly string[]
}>

export type CalendarTask = Readonly<{
  id: string
  name: string
}>

export type CalendarEventView = Readonly<{
  id: string
  engineerId: string
  engineerName: string
  taskId: string | null
  taskName: string | null
  assignmentId: string | null
  title: string
  date: string
  startTime: string | null
  note: string | null
}>

export type EvaluationCalendarInput = Readonly<{
  engineerId: string
  taskId: string
  title: string
  date: string
  startTime: string | null
  note: string | null
}>

export type EvaluationCalendarCreateInput = Omit<EvaluationCalendarInput, "engineerId"> & Readonly<{
  engineerIds: readonly string[]
}>

export type CalendarInteractionMode = "manage" | "evaluate" | "read"

export type EvaluationCalendarProps = Readonly<{
  month: string
  events: readonly CalendarEventView[]
  engineers: readonly CalendarEngineer[]
  tasks: readonly CalendarTask[]
  mode: CalendarInteractionMode
  onMonthChange: (month: string) => void
  onCreate: (input: EvaluationCalendarCreateInput) => boolean
  onUpdate: (eventId: string, input: EvaluationCalendarInput) => boolean
  onDelete: (eventId: string) => boolean
  onOpenEvaluation: (assignmentId: string) => void
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
