import React from 'react';
import { Check, FileText, RefreshCw, Brain, FileOutput } from 'lucide-react';
import { ProcessingStep } from '../types';

interface ProcessingStatusProps {
  currentStep: ProcessingStep;
}

const steps = [
  { key: ProcessingStep.READING, label: 'Reading file', icon: FileText },
  { key: ProcessingStep.CONVERTING, label: 'Converting document', icon: RefreshCw },
  { key: ProcessingStep.ANALYZING, label: 'Analyzing with AI', icon: Brain },
  { key: ProcessingStep.GENERATING, label: 'Generating markdown', icon: FileOutput },
];

const stepOrder = [
  ProcessingStep.READING,
  ProcessingStep.CONVERTING,
  ProcessingStep.ANALYZING,
  ProcessingStep.GENERATING,
];

export const ProcessingStatus: React.FC<ProcessingStatusProps> = ({ currentStep }) => {
  const currentIndex = stepOrder.indexOf(currentStep);

  return (
    <div className="flex flex-col items-center justify-center py-12 text-center space-y-8">
      {/* Header */}
      <div className="space-y-3">
        <div className="inline-flex items-center gap-2 bg-slate-900/90 text-white text-sm px-4 py-2 rounded-full">
          <div className="w-2 h-2 bg-orange-500 rounded-full animate-pulse" />
          <span className="text-slate-200">Processing</span>
        </div>
        <h3 className="text-3xl font-bold text-slate-900">Splitting your document</h3>
        <p className="text-slate-600">This may take a moment for large files</p>
      </div>

      {/* Progress Card */}
      <div className="w-full max-w-md bg-slate-900/90 backdrop-blur-sm rounded-2xl p-6 space-y-4">
        {steps.map((step, index) => {
          const isCompleted = index < currentIndex;
          const isCurrent = index === currentIndex;
          const isPending = index > currentIndex;
          const Icon = step.icon;

          return (
            <div
              key={step.key}
              className={`
                flex items-center gap-4 p-4 rounded-xl transition-all duration-300
                ${isCompleted ? 'bg-green-500/20' : ''}
                ${isCurrent ? 'bg-orange-500/20' : ''}
                ${isPending ? 'bg-slate-800/50 opacity-50' : ''}
              `}
            >
              <div
                className={`
                  w-10 h-10 rounded-xl flex items-center justify-center transition-all duration-300
                  ${isCompleted ? 'bg-green-500' : ''}
                  ${isCurrent ? 'bg-gradient-to-br from-orange-500 to-amber-500' : ''}
                  ${isPending ? 'bg-slate-700' : ''}
                `}
              >
                {isCompleted ? (
                  <Check className="w-5 h-5 text-white" />
                ) : (
                  <Icon className={`w-5 h-5 text-white ${isCurrent ? 'animate-pulse' : ''}`} />
                )}
              </div>

              <div className="flex-1 text-left">
                <p
                  className={`
                    font-medium transition-colors duration-300
                    ${isCompleted ? 'text-green-400' : ''}
                    ${isCurrent ? 'text-white' : ''}
                    ${isPending ? 'text-slate-500' : ''}
                  `}
                >
                  {step.label}
                </p>
                {isCurrent && (
                  <p className="text-sm text-orange-400 mt-0.5">In progress...</p>
                )}
                {isCompleted && (
                  <p className="text-sm text-green-500 mt-0.5">Done</p>
                )}
              </div>

              {isCurrent && (
                <div className="w-5 h-5 border-2 border-orange-500 border-t-transparent rounded-full animate-spin" />
              )}
            </div>
          );
        })}
      </div>

      {/* Footer note */}
      <p className="text-xs text-slate-500 max-w-sm">
        Large documents with many tabs may take longer to analyze
      </p>
    </div>
  );
};
