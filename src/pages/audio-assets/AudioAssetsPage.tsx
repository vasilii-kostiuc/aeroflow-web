import { useSearchParams } from 'react-router'

import { parseLibraryFilters, writeLibraryFilters } from '@/features/audio-assets/model/urlFilters'
import { AudioLibraryScreen } from '@/features/audio-assets/ui/AudioLibraryScreen'

export function AudioAssetsPage() {
  const [searchParams, setSearchParams] = useSearchParams()

  return (
    <AudioLibraryScreen
      filters={parseLibraryFilters(searchParams)}
      onFiltersChange={(filters) =>
        setSearchParams(writeLibraryFilters(filters), { replace: true })
      }
    />
  )
}
