import { useEffect, useRef } from 'react';
import { createPortal } from 'react-dom';
import { AnimatePresence, m, useReducedMotion, type Transition, type Variants } from 'framer-motion';
import { useIngredientScan, type WizardStep } from '../../hooks/useIngredientScan.ts';
import { StepIndicator } from './StepIndicator.tsx';
import { InstructionsStep } from './InstructionsStep.tsx';
import { CameraStep } from './CameraStep.tsx';
import { ReviewStep } from './ReviewStep.tsx';
import { AnalyzingStep } from './AnalyzingStep.tsx';
import { ScanResult } from './ScanResult.tsx';

type InlineStep = Exclude<WizardStep, 'camera'>;

const STEP_INDEX: Record<WizardStep, number> = {
  instructions: 0,
  camera: 1,
  review: 2,
  analyzing: 3,
  result: 3,
};

// Spring con un rebote sutil: rápido al entrar y con un pequeño asentamiento al final
const SPRING: Transition = { type: 'spring', bounce: 0.22, duration: 0.55 };

const slide: Variants = {
  // dir > 0: avanzar (entra por la derecha) · dir < 0: retroceder (entra por la izquierda)
  enter: (dir: number) => ({ x: dir > 0 ? '100%' : '-35%', opacity: 0 }),
  center: { x: 0, opacity: 1, transition: { x: SPRING, opacity: { duration: 0.2 } } },
  exit: (dir: number) => ({
    x: dir > 0 ? '-35%' : '100%',
    opacity: 0,
    transition: { x: SPRING, opacity: { duration: 0.15 } },
  }),
};

const fade: Variants = {
  enter: { opacity: 0 },
  center: { opacity: 1, transition: { duration: 0.2 } },
  exit: { opacity: 0, transition: { duration: 0.15 } },
};

/**
 * Asistente de escaneo por OCR:
 * 1. Instrucciones → 2. Cámara con marco guía → 3. Confirmación → 4. Análisis y resultado
 */
export function ScanWizard() {
  const wizard = useIngredientScan();
  const reduceMotion = useReducedMotion();
  const containerRef = useRef<HTMLDivElement>(null);

  // Mientras la cámara (pantalla completa) está abierta, debajo se mantiene el último paso en línea
  const lastInline = useRef<InlineStep>('instructions');
  if (wizard.step !== 'camera') lastInline.current = wizard.step;
  const inlineStep = lastInline.current;

  // Dirección de la animación según se avance o retroceda en el asistente
  const prevIndex = useRef(STEP_INDEX[inlineStep]);
  const direction = STEP_INDEX[inlineStep] >= prevIndex.current ? 1 : -1;
  useEffect(() => {
    prevIndex.current = STEP_INDEX[inlineStep];
  }, [inlineStep]);

  // Al cambiar de paso, vuelve arriba y mueve el foco al contenido (lectores de pantalla)
  useEffect(() => {
    if (wizard.step === 'camera') return;
    window.scrollTo({ top: 0 });
    containerRef.current?.focus({ preventScroll: true });
  }, [wizard.step]);

  const renderStep = (step: InlineStep) => {
    switch (step) {
      case 'instructions':
        return <InstructionsStep onOpenCamera={wizard.openCamera} onPickFile={wizard.acceptPhoto} />;
      case 'review':
        return (
          <ReviewStep
            photo={wizard.photo}
            preparing={wizard.preparing}
            error={wizard.error}
            onRetake={wizard.retake}
            onAnalyze={() => void wizard.analyze()}
          />
        );
      case 'analyzing':
        return <AnalyzingStep stage={wizard.stage} onCancel={wizard.cancelAnalysis} />;
      case 'result':
        return wizard.result && <ScanResult data={wizard.result} photo={wizard.photo} onScanAgain={wizard.restart} />;
    }
  };

  return (
    <div className="space-y-6">
      <StepIndicator current={STEP_INDEX[wizard.step]} />

      {/* overflow-x-clip: el paso que sale no genera scroll horizontal */}
      <div ref={containerRef} tabIndex={-1} className="relative overflow-x-clip outline-none">
        <AnimatePresence mode="popLayout" initial={false} custom={direction}>
          <m.div
            key={inlineStep}
            custom={direction}
            variants={reduceMotion ? fade : slide}
            initial="enter"
            animate="center"
            exit="exit"
            className="w-full"
          >
            {renderStep(inlineStep)}
          </m.div>
        </AnimatePresence>
      </div>

      {/* La cámara va en un portal: un ancestro con transform rompería su position: fixed */}
      {createPortal(
        <AnimatePresence>
          {wizard.step === 'camera' && (
            <m.div
              key="camera"
              className="fixed inset-0 z-50"
              initial={reduceMotion ? { opacity: 0 } : { x: '100%' }}
              animate={reduceMotion ? { opacity: 1 } : { x: 0, transition: SPRING }}
              exit={{ opacity: 0, transition: { duration: 0.2 } }}
            >
              <CameraStep onCapture={wizard.acceptPhoto} onPickFile={wizard.acceptPhoto} onClose={wizard.closeCamera} />
            </m.div>
          )}
        </AnimatePresence>,
        document.body,
      )}
    </div>
  );
}
