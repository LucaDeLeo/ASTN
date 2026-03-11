import { BookOpen, FileText, Headphones, Link2, Video } from 'lucide-react'

export function MaterialIcon({
  type,
  className = 'size-4',
}: {
  type: string
  className?: string
}) {
  switch (type) {
    case 'pdf':
      return <FileText className={className} />
    case 'video':
      return <Video className={className} />
    case 'reading':
      return <BookOpen className={className} />
    case 'audio':
      return <Headphones className={className} />
    default:
      return <Link2 className={className} />
  }
}
