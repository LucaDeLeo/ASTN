import { User } from 'lucide-react'
import { Badge } from '~/components/ui/badge'
import { Card } from '~/components/ui/card'

interface AttendeeProfile {
  name: string | undefined
  headline: string | undefined
  skills: Array<string> | undefined
}

interface Attendee {
  bookingId: string
  userId: string
  workingOn: string | undefined
  interestedInMeeting: string | undefined
  profile: AttendeeProfile | null
}

interface AttendeeListProps {
  attendees: Array<Attendee>
  title?: string
}

export function AttendeeList({
  attendees,
  title = "Who's coming",
}: AttendeeListProps) {
  if (attendees.length === 0) {
    return (
      <div className="text-center py-8 text-muted-foreground">
        <User className="size-8 mx-auto mb-2 opacity-50" />
        <p>No one else booked yet</p>
        <p className="text-sm">Be the first to book!</p>
      </div>
    )
  }

  return (
    <div className="space-y-3">
      <h3 className="font-medium text-sm text-muted-foreground">{title}</h3>
      <div className="grid gap-3">
        {attendees.map((attendee) => (
          <AttendeeCard key={attendee.bookingId} attendee={attendee} />
        ))}
      </div>
    </div>
  )
}

function AttendeeCard({ attendee }: { attendee: Attendee }) {
  const { profile, workingOn, interestedInMeeting } = attendee

  return (
    <Card className="p-4">
      <div className="space-y-2">
        {/* Name and headline */}
        <div>
          <p className="font-medium">{profile?.name || 'Anonymous'}</p>
          {profile?.headline && (
            <p className="text-sm text-muted-foreground">{profile.headline}</p>
          )}
        </div>

        {/* Skills */}
        {profile?.skills && profile.skills.length > 0 && (
          <div className="flex flex-wrap gap-1">
            {profile.skills.slice(0, 5).map((skill, idx) => (
              <Badge key={idx} variant="secondary" className="text-xs">
                {skill}
              </Badge>
            ))}
            {profile.skills.length > 5 && (
              <Badge variant="outline" className="text-xs">
                +{profile.skills.length - 5} more
              </Badge>
            )}
          </div>
        )}

        {/* Working on / Interested in meeting tags */}
        {(workingOn || interestedInMeeting) && (
          <div className="pt-2 space-y-1.5 border-t">
            {workingOn && (
              <div className="text-sm">
                <span className="text-muted-foreground">Working on:</span>{' '}
                <span>{workingOn}</span>
              </div>
            )}
            {interestedInMeeting && (
              <div className="text-sm">
                <span className="text-muted-foreground">
                  Interested in meeting:
                </span>{' '}
                <span>{interestedInMeeting}</span>
              </div>
            )}
          </div>
        )}
      </div>
    </Card>
  )
}
