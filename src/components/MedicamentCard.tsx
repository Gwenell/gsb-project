import React from 'react';
import { Card, CardContent, CardMedia, Typography, Box, Chip } from '@mui/material';

interface MedicamentProps {
  id: string;
  nomCommercial: string;
  famille?: {
    id: string;
    libelle: string;
  };
  composition: string;
  effets: string;
  contreIndications: string;
  image_url?: string;
  description?: string;
  niveau_dangerosité?: number;
  date_sortie?: string;
}

const MedicamentCard: React.FC<MedicamentProps> = ({
  nomCommercial,
  famille,
  composition,
  effets,
  contreIndications,
  image_url,
  description,
  niveau_dangerosité
}) => {
  // Get color for danger level
  const getDangerColor = (level?: number) => {
    switch (level) {
      case 1:
        return '#2ecc71'; // green
      case 2:
        return '#f39c12'; // orange
      case 3:
        return '#e74c3c'; // red
      default:
        return '#95a5a6'; // gray
    }
  };

  const dangerColor = getDangerColor(niveau_dangerosité);
  
  return (
    <Card sx={{ 
      display: 'flex', 
      flexDirection: { xs: 'column', md: 'row' },
      height: '100%', 
      boxShadow: 3,
      '&:hover': {
        boxShadow: 6,
      }
    }}>
      {image_url && (
        <CardMedia
          component="img"
          sx={{ 
            width: { xs: '100%', md: 200 },
            height: { xs: 200, md: 'auto' }
          }}
          image={image_url}
          alt={nomCommercial}
        />
      )}
      <CardContent sx={{ flex: '1 0 auto', display: 'flex', flexDirection: 'column' }}>
        <Typography variant="h5" component="div" gutterBottom>
          {nomCommercial}
        </Typography>
        
        <Box sx={{ display: 'flex', gap: 1, mb: 2, flexWrap: 'wrap' }}>
          {famille && (
            <Chip 
              label={famille.libelle} 
              size="small" 
              sx={{ bgcolor: '#3498db', color: 'white' }}
            />
          )}
          
          {niveau_dangerosité && (
            <Chip 
              label={`Dangerosité: ${niveau_dangerosité}`} 
              size="small"
              sx={{ bgcolor: dangerColor, color: 'white' }}
            />
          )}
        </Box>
        
        {description && (
          <Typography variant="body1" color="text.secondary" paragraph>
            {description}
          </Typography>
        )}
        
        <Typography variant="body2" sx={{ mb: 1 }}>
          <strong>Composition:</strong> {composition}
        </Typography>
        
        <Typography variant="body2" sx={{ mb: 1 }}>
          <strong>Effets:</strong> {effets}
        </Typography>
        
        <Typography variant="body2">
          <strong>Contre-indications:</strong> {contreIndications}
        </Typography>
      </CardContent>
    </Card>
  );
};

export default MedicamentCard; 