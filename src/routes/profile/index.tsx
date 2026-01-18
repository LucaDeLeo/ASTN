import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { useQuery } from "convex/react";
import { Authenticated, Unauthenticated, AuthLoading } from "convex/react";
import { api } from "../../../convex/_generated/api";
import { AuthHeader } from "~/components/layout/auth-header";
import { Button } from "~/components/ui/button";
import { Card } from "~/components/ui/card";
import { Badge } from "~/components/ui/badge";
import { Spinner } from "~/components/ui/spinner";
import {
  User,
  MapPin,
  GraduationCap,
  Briefcase,
  Target,
  Edit,
} from "lucide-react";

export const Route = createFileRoute("/profile/")({
  component: ProfilePage,
});

function ProfilePage() {
  return (
    <div className="min-h-screen bg-slate-50">
      <AuthHeader />
      <AuthLoading>
        <div className="flex items-center justify-center min-h-[calc(100vh-65px)]">
          <Spinner />
        </div>
      </AuthLoading>
      <Unauthenticated>
        <UnauthenticatedRedirect />
      </Unauthenticated>
      <Authenticated>
        <ProfileContent />
      </Authenticated>
    </div>
  );
}

function UnauthenticatedRedirect() {
  const navigate = useNavigate();
  navigate({ to: "/login" });
  return (
    <div className="flex items-center justify-center min-h-[calc(100vh-65px)]">
      <Spinner />
    </div>
  );
}

function ProfileContent() {
  const profile = useQuery(api.profiles.getOrCreateProfile);
  const completeness = useQuery(api.profiles.getMyCompleteness);

  if (profile === undefined || completeness === undefined) {
    return (
      <div className="flex items-center justify-center min-h-[calc(100vh-65px)]">
        <Spinner />
      </div>
    );
  }

  // No profile yet - prompt to create
  if (profile === null) {
    return (
      <main className="container mx-auto px-4 py-8">
        <Card className="max-w-lg mx-auto p-8 text-center">
          <div className="size-16 rounded-full bg-primary/10 flex items-center justify-center mx-auto mb-4">
            <User className="size-8 text-primary" />
          </div>
          <h1 className="text-2xl font-bold text-slate-900 mb-2">
            Create Your Profile
          </h1>
          <p className="text-slate-500 mb-6">
            Set up your profile to get matched with AI safety opportunities
            tailored to your background and goals.
          </p>
          <Button asChild>
            <Link to="/profile/edit">Get Started</Link>
          </Button>
        </Card>
      </main>
    );
  }

  return (
    <main className="container mx-auto px-4 py-8">
      <div className="max-w-3xl mx-auto">
        {/* Header */}
        <div className="flex items-start justify-between mb-6">
          <div>
            <h1 className="text-2xl font-bold text-slate-900">
              {profile.name || "Your Profile"}
            </h1>
            {profile.headline && (
              <p className="text-slate-600 mt-1">{profile.headline}</p>
            )}
          </div>
          <Button asChild>
            <Link to="/profile/edit">
              <Edit className="size-4 mr-2" />
              Edit Profile
            </Link>
          </Button>
        </div>

        {/* Completeness banner */}
        {completeness && completeness.percentage < 100 && (
          <Card className="p-4 mb-6 bg-amber-50 border-amber-200">
            <div className="flex items-center justify-between">
              <div>
                <p className="font-medium text-amber-900">
                  Your profile is {completeness.percentage}% complete
                </p>
                <p className="text-sm text-amber-700">
                  Complete more sections to improve your opportunity matches
                </p>
              </div>
              <Button variant="outline" size="sm" asChild>
                <Link to="/profile/edit">Continue</Link>
              </Button>
            </div>
          </Card>
        )}

        {/* Profile sections */}
        <div className="space-y-6">
          {/* Basic Info */}
          <Card className="p-6">
            <div className="flex items-center gap-2 mb-4">
              <User className="size-5 text-slate-400" />
              <h2 className="text-lg font-semibold text-slate-900">
                Basic Information
              </h2>
            </div>
            <div className="space-y-3">
              {profile.name && (
                <div className="flex items-center gap-2">
                  <span className="text-slate-900 font-medium">
                    {profile.name}
                  </span>
                  {profile.pronouns && (
                    <span className="text-slate-500">({profile.pronouns})</span>
                  )}
                </div>
              )}
              {profile.location && (
                <div className="flex items-center gap-2 text-slate-600">
                  <MapPin className="size-4" />
                  {profile.location}
                </div>
              )}
              {!profile.name && !profile.location && (
                <p className="text-slate-400 italic">
                  No basic information added yet
                </p>
              )}
            </div>
          </Card>

          {/* Education */}
          <Card className="p-6">
            <div className="flex items-center gap-2 mb-4">
              <GraduationCap className="size-5 text-slate-400" />
              <h2 className="text-lg font-semibold text-slate-900">Education</h2>
            </div>
            {profile.education && profile.education.length > 0 ? (
              <div className="space-y-4">
                {profile.education.map((edu, index) => (
                  <div key={index} className="border-l-2 border-slate-200 pl-4">
                    <p className="font-medium text-slate-900">
                      {edu.degree && `${edu.degree} in `}
                      {edu.field || "Unknown Field"}
                    </p>
                    <p className="text-slate-600">{edu.institution}</p>
                    <p className="text-sm text-slate-500">
                      {edu.startYear && edu.startYear}
                      {edu.startYear && (edu.endYear || edu.current) && " - "}
                      {edu.current ? "Present" : edu.endYear}
                    </p>
                  </div>
                ))}
              </div>
            ) : (
              <p className="text-slate-400 italic">No education added yet</p>
            )}
          </Card>

          {/* Work History */}
          <Card className="p-6">
            <div className="flex items-center gap-2 mb-4">
              <Briefcase className="size-5 text-slate-400" />
              <h2 className="text-lg font-semibold text-slate-900">
                Work History
              </h2>
            </div>
            {profile.workHistory && profile.workHistory.length > 0 ? (
              <div className="space-y-4">
                {profile.workHistory.map((work, index) => (
                  <div key={index} className="border-l-2 border-slate-200 pl-4">
                    <p className="font-medium text-slate-900">{work.title}</p>
                    <p className="text-slate-600">{work.organization}</p>
                    {work.startDate && (
                      <p className="text-sm text-slate-500">
                        {new Date(work.startDate).toLocaleDateString("en-US", {
                          month: "short",
                          year: "numeric",
                        })}
                        {" - "}
                        {work.current
                          ? "Present"
                          : work.endDate
                            ? new Date(work.endDate).toLocaleDateString(
                                "en-US",
                                {
                                  month: "short",
                                  year: "numeric",
                                }
                              )
                            : ""}
                      </p>
                    )}
                    {work.description && (
                      <p className="text-sm text-slate-600 mt-2">
                        {work.description}
                      </p>
                    )}
                  </div>
                ))}
              </div>
            ) : (
              <p className="text-slate-400 italic">No work history added yet</p>
            )}
          </Card>

          {/* Career Goals */}
          <Card className="p-6">
            <div className="flex items-center gap-2 mb-4">
              <Target className="size-5 text-slate-400" />
              <h2 className="text-lg font-semibold text-slate-900">
                Career Goals
              </h2>
            </div>
            {profile.careerGoals ? (
              <div className="space-y-4">
                <p className="text-slate-600 whitespace-pre-wrap">
                  {profile.careerGoals}
                </p>
                {profile.aiSafetyInterests &&
                  profile.aiSafetyInterests.length > 0 && (
                    <div>
                      <p className="text-sm font-medium text-slate-700 mb-2">
                        Areas of Interest
                      </p>
                      <div className="flex flex-wrap gap-2">
                        {profile.aiSafetyInterests.map((interest) => (
                          <Badge key={interest} variant="secondary">
                            {interest}
                          </Badge>
                        ))}
                      </div>
                    </div>
                  )}
                {profile.seeking && (
                  <div>
                    <p className="text-sm font-medium text-slate-700 mb-1">
                      Looking for
                    </p>
                    <p className="text-slate-600">{profile.seeking}</p>
                  </div>
                )}
              </div>
            ) : (
              <p className="text-slate-400 italic">
                No career goals described yet
              </p>
            )}
          </Card>
        </div>
      </div>
    </main>
  );
}
