import React, { ReactNode, forwardRef } from 'react';
import { Grid, GridProps } from '@mui/material';
import { GridSize } from '@mui/material/Grid';

interface CustomGridProps extends Omit<GridProps, 'children'> {
  children?: ReactNode;
  spacing?: number;
  xs?: GridSize;
  sm?: GridSize;
  md?: GridSize;
  alignItems?: 'flex-start' | 'center' | 'flex-end' | 'stretch' | 'baseline';
}

const CustomGrid = forwardRef<HTMLDivElement, CustomGridProps>(
  (props, ref) => {
    return <Grid ref={ref} {...props} />;
  }
);

CustomGrid.displayName = 'CustomGrid';

export default CustomGrid; 