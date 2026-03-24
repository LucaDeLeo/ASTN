import { Link, createFileRoute } from '@tanstack/react-router'
import { Card, CardContent, CardHeader, CardTitle } from '~/components/ui/card'

export const Route = createFileRoute('/admin/')({
  component: AdminDashboard,
})

function AdminDashboard() {
  return (
    <div>
      <h1 className="text-2xl font-display text-foreground mb-6">
        Admin Dashboard
      </h1>
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
        <Link to="/admin/opportunities">
          <Card className="hover:shadow-md transition-shadow cursor-pointer">
            <CardHeader>
              <CardTitle className="text-lg">Opportunities</CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-sm text-slate-600">
                Manage job opportunities, add new listings, edit existing ones.
              </p>
            </CardContent>
          </Card>
        </Link>
        <Link to="/admin/applications">
          <Card className="hover:shadow-md transition-shadow cursor-pointer">
            <CardHeader>
              <CardTitle className="text-lg">Org Applications</CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-sm text-slate-600">
                Review and approve organization applications to join ASTN.
              </p>
            </CardContent>
          </Card>
        </Link>
        <Link to="/admin/users">
          <Card className="hover:shadow-md transition-shadow cursor-pointer">
            <CardHeader>
              <CardTitle className="text-lg">Users</CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-sm text-slate-600">
                Browse user profiles, view agent conversations, and review data.
              </p>
            </CardContent>
          </Card>
        </Link>
        <Link to="/admin/costs">
          <Card className="hover:shadow-md transition-shadow cursor-pointer">
            <CardHeader>
              <CardTitle className="text-lg">LLM Costs</CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-sm text-slate-600">
                Monitor AI model usage, costs, and token consumption across all
                operations.
              </p>
            </CardContent>
          </Card>
        </Link>
      </div>
    </div>
  )
}
