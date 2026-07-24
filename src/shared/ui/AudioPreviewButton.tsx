import { useEffect, useRef, useState } from 'react'

import { ActionIcon, Tooltip } from '@mantine/core'
import { IconPlayerPlayFilled, IconPlayerStopFilled } from '@tabler/icons-react'

import { fetchAudioAssetObjectUrl } from '@/shared/api/audioAssetFile'

type Props = {
  audioAssetId: string | null | undefined
  /** Accessible label / tooltip; defaults to a generic one. */
  label?: string
}

/**
 * Play an audio asset in the browser. Fetches the file with auth (as a Blob) on
 * first play, then toggles play/stop. The object URL and Audio element are cleaned
 * up on stop, when the asset changes, and on unmount.
 */
export function AudioPreviewButton({ audioAssetId, label = 'Прослушать' }: Props) {
  const [playing, setPlaying] = useState(false)
  const [loading, setLoading] = useState(false)
  const audioRef = useRef<HTMLAudioElement | null>(null)
  const urlRef = useRef<string | null>(null)

  function cleanup() {
    if (audioRef.current) {
      audioRef.current.pause()
      audioRef.current.src = ''
      audioRef.current = null
    }
    if (urlRef.current) {
      URL.revokeObjectURL(urlRef.current)
      urlRef.current = null
    }
    setPlaying(false)
  }

  // Stop and release when the referenced asset changes or the button unmounts.
  useEffect(() => cleanup, [audioAssetId])

  async function toggle() {
    if (playing || loading) {
      cleanup()
      setLoading(false)

      return
    }
    if (!audioAssetId) return

    setLoading(true)
    try {
      const url = await fetchAudioAssetObjectUrl(audioAssetId)
      urlRef.current = url
      const audio = new Audio(url)
      audioRef.current = audio
      audio.addEventListener('ended', cleanup)
      audio.addEventListener('error', cleanup)
      await audio.play()
      setPlaying(true)
    } catch {
      cleanup()
    } finally {
      setLoading(false)
    }
  }

  return (
    <Tooltip label={playing ? 'Остановить' : label}>
      <ActionIcon
        variant="light"
        color={playing ? 'red' : 'blue'}
        aria-label={playing ? 'Остановить' : label}
        loading={loading}
        disabled={!audioAssetId}
        onClick={toggle}
      >
        {playing ? (
          <IconPlayerStopFilled size={16} />
        ) : (
          <IconPlayerPlayFilled size={16} />
        )}
      </ActionIcon>
    </Tooltip>
  )
}
