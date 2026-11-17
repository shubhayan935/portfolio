import { Card, CardContent } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { writingData } from "@/lib/data"

export default function Writing() {
  return (
    <section className="mb-16">
      <h2 className="text-2xl font-normal mb-4 font-garnett">Writing</h2>
      <div className="grid grid-cols-1">
        {writingData.map((writing) => (
          <a key={writing.id} href={writing.url} target="_blank" rel="noopener noreferrer">
            <Card className="h-full bg-transparent border-none overflow-hidden transition-all duration-300 cursor-pointer group gap-0 p-0 hover:underline">
              {/* Body */}
              <CardContent className="py-4 px-0 flex flex-col h-full">
                {/* Title row with date */}
                <div className="flex justify-between flex-row mb-1">
                  <div className="flex items-start justify-between">
                    <h3 className="text-lg font-normal text-white font-garnett group-hover:underline">{writing.title}</h3>
                  </div>

                  {/* Date */}
                  {writing.date && (
                    <div>
                      <Badge className="text-[13px] text-gray-400 font-medium rounded-md px-2 py-0 bg-transparent">{writing.date}</Badge>
                    </div>
                  )}
                </div>

                {/* Description */}
                <p className="text-gray-300 text-sm flex-grow leading-relaxed group-hover:underline">
                  {writing.description}
                </p>
              </CardContent>
              {/* Dotted separator - don't show after last item or when current/next item is open */}
              {writing.id < writingData.length - 1 && (
                <div className="flex justify-center my-0">
                  <div className="w-full max-w-2xl h-px bg-gradient-to-r from-transparent via-gray-700 to-transparent" />
                </div>
              )}
            </Card>
          </a>
        ))}
      </div>
    </section>
  )
}