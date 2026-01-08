'use client'

interface StaticInfo {
  label: string
  value: string
}

interface TerminalLogProps {
  title: string
  headerColor?: string
  headerTitle?: string
  staticInfo?: StaticInfo[]
  logs: string[]
  statusText?: string
  statusColor?: 'green' | 'yellow' | 'red' | 'gray'
}

export function TerminalLog({
  title,
  headerColor = 'text-white',
  headerTitle,
  staticInfo = [],
  logs,
  statusText,
  statusColor = 'green',
}: TerminalLogProps) {
  const statusColors = {
    green: 'text-green-500',
    yellow: 'text-yellow-500',
    red: 'text-red-500',
    gray: 'text-gray-500',
  }

  return (
    <div className="border border-gray-800 bg-black/50">
      {/* Header */}
      <div className={`px-2 py-1 border-b border-gray-800 ${headerColor} text-xs`}>
        {headerTitle || title}
      </div>

      {/* Static Info */}
      {staticInfo.length > 0 && (
        <div className="px-2 py-1 border-b border-gray-800 text-xs">
          {staticInfo.map((info, i) => (
            <div key={i} className="flex justify-between text-gray-500">
              <span>{info.label}:</span>
              <span className="text-gray-400">{info.value}</span>
            </div>
          ))}
        </div>
      )}

      {/* Logs */}
      <div className="px-2 py-1 text-xs max-h-32 overflow-y-auto">
        {logs.map((log, i) => (
          <div key={i} className="text-gray-600">
            <span className="text-gray-700">[{String(i).padStart(2, '0')}]</span> {log}
          </div>
        ))}
      </div>

      {/* Status */}
      {statusText && (
        <div className={`px-2 py-1 border-t border-gray-800 text-xs ${statusColors[statusColor]}`}>
          {statusText}
        </div>
      )}
    </div>
  )
}
