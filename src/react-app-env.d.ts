/// <reference types="react-scripts" />

import { ElementType } from 'react';
import '@mui/material/styles';
import '@mui/material/Grid';

declare module '@mui/material/Grid' {
  interface GridTypeMap {
    props: {
      container?: boolean;
      item?: boolean;
      xs?: boolean | number | 'auto';
      sm?: boolean | number | 'auto';
      md?: boolean | number | 'auto';
      lg?: boolean | number | 'auto';
      xl?: boolean | number | 'auto';
      spacing?: number | string;
      direction?: 'row' | 'row-reverse' | 'column' | 'column-reverse';
      wrap?: 'nowrap' | 'wrap' | 'wrap-reverse';
      zeroMinWidth?: boolean;
      component?: ElementType;
    };
  }
}

declare module '@mui/material/styles' {
  interface Theme {
    status: {
      danger: string;
    };
  }

  interface ThemeOptions {
    status?: {
      danger?: string;
    };
  }
}
