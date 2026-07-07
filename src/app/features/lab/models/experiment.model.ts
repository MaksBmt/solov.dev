export type CategoryStatus = 'ready' | 'soon';
export type ExperimentStatus = 'ready' | 'soon';

export interface LabCategory {
  slug: string;
  title: string;
  description: string;
  status: CategoryStatus;
}

export interface ExperimentPassport {
  cssOnly?: boolean;
  js?: boolean;
  raf?: boolean;
  cssVars?: boolean;
  svg?: boolean;
  clipPath?: boolean;
  mask?: boolean;
  intersectionObserver?: boolean;
  resizeObserver?: boolean;
  pointerEvents?: boolean;
  noLibraries?: boolean;
}

export interface DebugControl {
  id: string;
  label: string;
  description?: string;
  type: 'range';
  min: number;
  max: number;
  step: number;
  default: number;
  codeKey?: string;
  bind?: string;
}

export interface DebugMonitorItem {
  id: string;
  label: string;
  type: 'fps' | 'pointer' | 'cssVar';
}

export interface Experiment {
  slug: string;
  title: string;
  category: string;
  difficulty: number;
  tech: string[];
  description: string;
  status: ExperimentStatus;
  passport?: ExperimentPassport | null;
  sourceFile?: string;
  debugControls?: DebugControl[];
  debugMonitor?: DebugMonitorItem[];
  debugLegend?: string;
}

export interface PageMeta {
  title: string;
  description: string;
  ogImage?: string;
}
