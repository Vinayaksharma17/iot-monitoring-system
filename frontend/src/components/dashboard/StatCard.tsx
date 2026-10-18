import { memo } from 'react'
import { Link } from 'react-router-dom'
import type { LucideIcon } from 'lucide-react'

type StatCardColor = 'blue' | 'green' | 'purple' | 'orange'

interface StatCardProps {
  title: string
  value: number | string
  icon: LucideIcon
  color: StatCardColor
  link?: string
}

const colorStyles: Record<StatCardColor, string> = {
  blue: 'bg-blue-100 text-blue-600',
  green: 'bg-green-100 text-green-600',
  purple: 'bg-purple-100 text-purple-600',
  orange: 'bg-orange-100 text-orange-600',
}

export const StatCard = memo(function StatCard({
  title,
  value,
  icon: Icon,
  color,
  link,
}: StatCardProps) {
  const content = (
    <>
      <div className={`p-3 rounded-lg ${colorStyles[color]}`}>
        <Icon className="h-6 w-6" />
      </div>
      <div className="ml-4">
        <p className="text-sm font-medium text-gray-600">{title}</p>
        <p className="text-2xl font-bold text-gray-900">{value}</p>
      </div>
    </>
  )

  if (link) {
    return (
      <Link
        to={link}
        className="flex items-center bg-white p-6 rounded-lg shadow hover:shadow-md transition-shadow"
      >
        {content}
      </Link>
    )
  }

  return (
    <div className="flex items-center bg-white p-6 rounded-lg shadow">
      {content}
    </div>
  )
})
