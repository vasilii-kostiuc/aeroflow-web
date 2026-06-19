import { Navigate, createBrowserRouter } from 'react-router'

import { paths } from '@/app/router/paths'
import { AppLayout } from '@/app/router/ui/AppLayout'
import { FlightDefinitionsPage } from '@/pages/flight-definitions/FlightDefinitionsPage'
import { LoginPage } from '@/pages/login/LoginPage'
import { NotFoundPage } from '@/pages/not-found/NotFoundPage'

export const router = createBrowserRouter([
  {
    path: paths.login,
    element: <LoginPage />,
  },
  {
    element: <AppLayout />,
    children: [
      {
        path: paths.home,
        element: <Navigate to={paths.flightDefinitions} replace />,
      },
      {
        path: paths.flightDefinitions,
        element: <FlightDefinitionsPage />,
      },
    ],
  },
  {
    path: '*',
    element: <NotFoundPage />,
  },
])
