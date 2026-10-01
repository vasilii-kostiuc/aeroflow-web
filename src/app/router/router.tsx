import { createBrowserRouter } from 'react-router'

import { paths } from '@/app/router/paths'
import { AppLayout } from '@/app/router/ui/AppLayout'
import { HomeRedirect } from '@/app/router/ui/HomeRedirect'
import { ProtectedRoute } from '@/app/router/ui/ProtectedRoute'
import { PublicOnlyRoute } from '@/app/router/ui/PublicOnlyRoute'
import { RequireRole } from '@/app/router/ui/RequireRole'
import { FlightDefinitionsPage } from '@/pages/flight-definitions/FlightDefinitionsPage'
import { FlightDefinitionCreatePage } from '@/pages/flight-definitions/FlightDefinitionCreatePage'
import { FlightDefinitionDetailsPage } from '@/pages/flight-definitions/FlightDefinitionDetailsPage'
import { AirportsPage } from '@/pages/airports/AirportsPage'
import { SupplementaryTemplatesPage } from '@/pages/supplementary-templates/SupplementaryTemplatesPage'
import { EmergencyTemplatesPage } from '@/pages/emergency-templates/EmergencyTemplatesPage'
import { DispatcherPage } from '@/pages/dispatcher/DispatcherPage'
import { AudioAssetsPage } from '@/pages/audio-assets/AudioAssetsPage'
import { UsersPage } from '@/pages/users/UsersPage'
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
        element: <HomeRedirect />,
      },
      {
        path: paths.flightDefinitions,
        element: (
          <RequireRole role="admin">
            <FlightDefinitionsPage />
          </RequireRole>
        ),
      },
      {
        path: paths.flightDefinitionNew,
        element: (
          <RequireRole role="admin">
            <FlightDefinitionCreatePage />
          </RequireRole>
        ),
      },
      {
        path: paths.flightDefinitionDetails,
        element: (
          <RequireRole role="admin">
            <FlightDefinitionDetailsPage />
          </RequireRole>
        ),
      },
      {
        path: paths.airports,
        element: (
          <RequireRole role="admin">
            <AirportsPage />
          </RequireRole>
        ),
      },
      {
        path: paths.supplementaryTemplates,
        element: (
          <RequireRole role="admin">
            <SupplementaryTemplatesPage />
          </RequireRole>
        ),
      },
      {
        path: paths.emergencyTemplates,
        element: (
          <RequireRole role="admin">
            <EmergencyTemplatesPage />
          </RequireRole>
        ),
      },
      {
        path: paths.audioAssets,
        element: (
          <RequireRole role="admin">
            <AudioAssetsPage />
          </RequireRole>
        ),
      },
      {
        path: paths.users,
        element: (
          <RequireRole role="admin">
            <UsersPage />
          </RequireRole>
        ),
      },
      {
        path: paths.dispatcher,
        element: (
          <RequireRole role="dispatcher">
            <DispatcherPage />
          </RequireRole>
        ),
      },
    ],
  },
  {
    path: '*',
    element: <NotFoundPage />,
  },
])
