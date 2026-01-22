import React from 'react';
import { Check, FileText, Search, Layers, FileOutput, X } from 'lucide-react';
import { ProcessingStep, ProcessingProgress } from '../types';

interface ProcessingStatusProps {
  progress: ProcessingProgress;
  onCancel?: () => void;
}

const steps = [
  { key: ProcessingStep.READING, label: 'Reading file', icon: FileText },
  { key: ProcessingStep.DETECTING, label: 'Detecting tabs', icon: Search },
  { key: ProcessingStep.PROCESSING_TABS, label: 'Processing tabs', icon: Layers },
  { key: ProcessingStep.GENERATING, label: 'Generating markdown', icon: FileOutput },
];

const stepOrder = [
  ProcessingStep.READING,
  ProcessingStep.DETECTING,
  ProcessingStep.PROCESSING_TABS,
  ProcessingStep.GENERATING,
];

export const ProcessingStatus: React.FC<ProcessingStatusProps> = ({ progress, onCancel }) => {
  const currentIndex = stepOrder.indexOf(progress.step);

  const getStepLabel = (step: typeof steps[0], index: number) => {
    if (step.key === ProcessingStep.PROCESSING_TABS && progress.step === ProcessingStep.PROCESSING_TABS) {
      if (progress.currentTab && progress.totalTabs) {
        return `Processing tab ${progress.currentTab} of ${progress.totalTabs}`;
      }
    }
    return step.label;
  };

  const getStepSubtitle = (step: typeof steps[0], isCurrent: boolean, isCompleted: boolean) => {
    if (step.key === ProcessingStep.PROCESSING_TABS && isCurrent && progress.tabName) {
      return progress.tabName;
    }
    if (isCurrent) {
      return 'In progress...';
    }
    if (isCompleted) {
      return 'Done';
    }
    return null;
  };

  // Calculate overall progress percentage
  const getProgressPercentage = () => {
    if (progress.step === ProcessingStep.PROCESSING_TABS && progress.currentTab && progress.totalTabs) {
      // During tab processing, interpolate between step 3 and step 4
      const baseProgress = (2 / 4) * 100; // 50% at start of processing
      const tabProgress = (progress.currentTab / progress.totalTabs) * 25; // 25% for all tabs
      return baseProgress + tabProgress;
    }
    return (currentIndex / (stepOrder.length - 1)) * 100;
  };

  return (
    <div className="flex flex-col items-center justify-center py-12 text-center space-y-8">
      {/* Header */}
      <div className="space-y-3">
        <div className="inline-flex items-center gap-2 bg-slate-900/90 text-white text-sm px-4 py-2 rounded-full">
          <div className="w-2 h-2 bg-orange-500 rounded-full animate-pulse" />
          <span className="text-slate-200">Processing</span>
        </div>
        <h3 className="text-3xl font-bold text-slate-900">Splitting your document</h3>
        {progress.step === ProcessingStep.PROCESSING_TABS && progress.totalTabs && (
          <p className="text-slate-600">
            Processing {progress.totalTabs} tabs in parallel for faster results
          </p>
        )}
        {progress.step !== ProcessingStep.PROCESSING_TABS && (
          <p className="text-slate-600">This may take a moment for large files</p>
        )}
      </div>

      {/* Progress Bar */}
      <div className="w-full max-w-md">
        <div className="h-2 bg-slate-800 rounded-full overflow-hidden">
          <div
            className="h-full bg-gradient-to-r from-orange-500 to-amber-500 transition-all duration-500 ease-out"
            style={{ width: `${getProgressPercentage()}%` }}
          />
        </div>
      </div>

      {/* Progress Card */}
      <div className="w-full max-w-md bg-slate-900/90 backdrop-blur-sm rounded-2xl p-6 space-y-4">
        {steps.map((step, index) => {
          const isCompleted = index < currentIndex;
          const isCurrent = index === currentIndex;
          const isPending = index > currentIndex;
          const Icon = step.icon;
          const subtitle = getStepSubtitle(step, isCurrent, isCompleted);

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
                  {getStepLabel(step, index)}
                </p>
                {subtitle && (
                  <p className={`text-sm mt-0.5 ${isCompleted ? 'text-green-500' : 'text-orange-400'}`}>
                    {subtitle}
                  </p>
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
        {progress.step === ProcessingStep.PROCESSING_TABS
          ? "Each tab is processed individually for better accuracy"
          : "Large documents with many tabs may take longer to analyze"
        }
      </p>

      {/* Cancel Button */}
      {onCancel && (
        <button
          onClick={onCancel}
          className="flex items-center gap-2 px-6 py-3 bg-slate-800 hover:bg-slate-700 text-slate-300 hover:text-white rounded-full text-sm font-medium transition-all"
        >
          <X className="w-4 h-4" />
          Cancel
        </button>
      )}
    </div>
  );
};
