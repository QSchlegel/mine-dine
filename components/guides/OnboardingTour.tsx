'use client'

import { useState, useEffect, useCallback } from 'react'
import dynamic from 'next/dynamic'
import { getTourConfig, type TourType } from '@/lib/guides'
import type { CallBackProps, Step } from 'react-joyride'

const Joyride = dynamic(() => import('react-joyride').then((mod) => mod.default), {
  ssr: false,
})

interface OnboardingTourProps {
  tourType: TourType
  isOpen: boolean
  onClose: () => void
  onComplete?: () => void
  run?: boolean
}

export default function OnboardingTour({
  tourType,
  isOpen,
  onClose,
  onComplete,
  run = true,
}: OnboardingTourProps) {
  const [runTour, setRunTour] = useState(run)
  const config = getTourConfig(tourType)

  useEffect(() => {
    setRunTour(isOpen && run)
  }, [isOpen, run])

  const handleJoyrideCallback = useCallback(
    (data: CallBackProps) => {
      const status = data?.status

      if (status === 'finished' || status === 'skipped') {
        setRunTour(false)
        onClose()
        if (onComplete) {
          onComplete()
        }
      }
    },
    [onClose, onComplete]
  )

  if (!isOpen) return null

  const steps: Step[] = config.steps.map((step) => ({
    target: step.target,
    content: step.content,
    title: step.title,
    placement: step.placement ?? 'auto',
    disableBeacon: step.disableBeacon ?? false,
  }))

  return (
    <Joyride
      steps={steps}
      run={runTour}
      continuous
      showProgress
      showSkipButton
      callback={handleJoyrideCallback}
      styles={{
        options: {
          primaryColor: '#6366f1',
          zIndex: 10000,
        },
        tooltip: {
          borderRadius: '12px',
          padding: '20px',
        },
        tooltipContainer: {
          textAlign: 'left',
        },
        buttonNext: {
          backgroundColor: '#6366f1',
          borderRadius: '8px',
          padding: '10px 20px',
          fontSize: '14px',
          fontWeight: 600,
        },
        buttonBack: {
          color: '#6b7280',
          marginRight: '10px',
          fontSize: '14px',
        },
        buttonSkip: {
          color: '#6b7280',
          fontSize: '14px',
        },
      }}
      locale={{
        back: 'Back',
        close: 'Close',
        last: 'Finish',
        next: 'Next',
        skip: 'Skip tour',
      }}
    />
  )
}
