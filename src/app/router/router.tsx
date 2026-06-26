import { Navigate, createBrowserRouter } from 'react-router'

import { paths } from '@/app/router/paths'
import { AppLayout } from '@/app/router/ui/AppLayout'
import { ProtectedRoute } from '@/app/router/ui/ProtectedRoute'
import { PublicOnlyRoute } from '@/app/router/ui/PublicOnlyRoute'
import { FlightDefinitionsPage } from '@/pages/flight-definitions/FlightDefinitionsPage'
import { FlightDefinitionCreatePage } from '@/pages/flight-definitions/FlightDefinitionCreatePage'
import { FlightDefinitionDetailsPage } from '@/pages/flight-definitions/FlightDefinitionDetailsPage'
import { AirportsPage } from '@/pages/airports/AirportsPage'
import { DispatcherPage } from '@/pages/dispatcher/DispatcherPage'
import { LoginPage } from '@/pages/login/LoginPage'
import { NotFoundPage } from '@/pages/not-found/NotFoundPage'

export const router = createBrowserRouter([
  {
    path: paths.login,
    element: (
      <PublicOnlyRoute>
        <LoginPage />
      </PublicOnlyRoute>
    ),
  },
  {
    element: (
      <ProtectedRoute>
        <AppLayout />
      </ProtectedRoute>
    ),
    children: [
      {
        path: paths.home,
        element: <Navigate to={paths.flightDefinitions} replace />,
      },
      {
        path: paths.flightDefinitions,
        element: <FlightDefinitionsPage />,
      },
      {
        path: paths.flightDefinitionNew,
        element: <FlightDefinitionCreatePage />,
      },
      {
        path: paths.flightDefinitionDetails,
        element: <FlightDefinitionDetailsPage />,
      },
      {
        path: paths.airports,
        element: <AirportsPage />,
      },
      {
        path: paths.dispatcher,
        element: <DispatcherPage />,
      },
    ],
  },
  {
    path: '*',
    element: <NotFoundPage />,
  },
])
