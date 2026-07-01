interface Props {
  selected: string
  onChange: (key: string) => void
}

const categories = [
  { key: 'all', label: 'Tout', icon: '🔥' },
  { key: 'cultural', label: 'Concerts', icon: '🎵' },
  { key: 'sports', label: 'Sport', icon: '⚽' },
  { key: 'professional', label: 'Conférences', icon: '💼' },
  { key: 'other', label: 'Autres', icon: '📌' },
]

export default function CategoryFilter({ selected, onChange }: Props) {
  return (
    <div className="w-full overflow-x-auto smooth-scroll pb-2">
      <div className="flex gap-5 px-4 min-w-max">
        {categories.map((cat) => {
          const isActive = selected === cat.key
          return (
            <button key={cat.key} onClick={() => onChange(cat.key)}
              className="flex flex-col items-center gap-1.5 transition-all duration-200 group">
              <div className={`w-14 h-14 rounded-2xl flex items-center justify-center text-2xl transition-all duration-200 ${
                isActive
                  ? 'bg-violet-600 text-white shadow-lg shadow-violet-600/30 scale-110'
                  : 'bg-white text-gray-500 shadow-sm group-hover:shadow-md group-hover:-translate-y-0.5'
              }`}>
                {cat.icon}
              </div>
              <span className={`text-xs font-medium whitespace-nowrap transition-colors ${
                isActive ? 'text-violet-700 font-semibold' : 'text-gray-500'
              }`}>
                {cat.label}
              </span>
            </button>
          )
        })}
      </div>
    </div>
  )
}
