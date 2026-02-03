import { Outlet, createFileRoute } from '@tanstack/react-router'

export const Route = createFileRoute('/apply')({
  component: () => <Outlet />,
})
