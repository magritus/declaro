import { useNavigate, useParams } from 'react-router-dom'
import { getNextStep, getPrevStep, WIZARD_STEPS } from '@/config/wizardSteps'

export function useWizardNavigation() {
  const navigate = useNavigate()
  const { calismaId, stepKey } = useParams<{ calismaId: string; stepKey: string }>()

  function navigateNext() {
    if (!calismaId) return
    const nextStep = getNextStep(stepKey ?? 'donem-acilis')
    if (nextStep) {
      navigate(`/calisma/${calismaId}/wizard/${nextStep.key}`)
    } else {
      // Son adımdan sonra istek listesine git
      navigate(`/calisma/${calismaId}/istek-listesi`)
    }
  }

  function navigatePrev() {
    if (!calismaId) return
    const prevStep = getPrevStep(stepKey ?? 'donem-acilis')
    if (prevStep) {
      navigate(`/calisma/${calismaId}/wizard/${prevStep.key}`)
    }
  }

  function getStepPath(key: string) {
    return `/calisma/${calismaId}/wizard/${key}`
  }

  // Sidebar için: wizard_faz integer'ından hangi step'lerin tamamlandığını hesapla
  function isStepDone(key: string, wizardFaz: number): boolean {
    const step = WIZARD_STEPS.find(s => s.key === key)
    return step ? wizardFaz > step.order : false
  }

  function isStepAccessible(key: string, wizardFaz: number): boolean {
    const step = WIZARD_STEPS.find(s => s.key === key)
    return step ? wizardFaz >= step.order : false
  }

  return { navigateNext, navigatePrev, getStepPath, isStepDone, isStepAccessible, calismaId }
}
