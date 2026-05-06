const BORDER_CLASS: Record<string, string> = {
  primary: 'border-primary',
  accent:  'border-accent',
  gold:    'border-gold',
  verde:   'border-green-500',
}

interface KPICardProps {
  numero: string | number
  label: string
  cor?: keyof typeof BORDER_CLASS
}

export function KPICard({ numero, label, cor = 'primary' }: KPICardProps) {
  return (
    <div className={`bg-white rounded-lg shadow-sm p-4 flex flex-col justify-center border-l-4 ${BORDER_CLASS[cor]}`}>
      <p className="text-3xl font-bold text-primary leading-none">{numero}</p>
      <p className="text-xs uppercase tracking-wide text-gray-500 mt-2 leading-none">{label}</p>
    </div>
  )
}
