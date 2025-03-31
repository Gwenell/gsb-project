import React from 'react';
import { Container, Typography, Button, Box, Paper } from '@mui/material';
import { Link } from 'react-router-dom';
import { motion } from 'framer-motion';

const NotFound: React.FC = () => {
  return (
    <Container maxWidth="md" sx={{ mt: 8 }}>
      <motion.div
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5 }}
      >
        <Paper 
          elevation={2} 
          sx={{ 
            p: 4, 
            borderRadius: 2, 
            textAlign: 'center',
            backgroundColor: '#F9F8F4'
          }}
        >
          <Typography variant="h1" component="h1" sx={{ fontSize: '6rem', fontWeight: 'bold', color: '#2E2E2E' }}>
            404
          </Typography>
          
          <Typography variant="h4" component="h2" gutterBottom sx={{ mt: 2, color: '#2E2E2E' }}>
            Page non trouvée
          </Typography>
          
          <Typography variant="body1" sx={{ mt: 2, mb: 4 }}>
            La page que vous recherchez n'existe pas ou a été déplacée.
          </Typography>
          
          <Box sx={{ mt: 4 }}>
            <Button 
              component={Link} 
              to="/dashboard" 
              variant="contained" 
              color="secondary"
              size="large"
              sx={{ minWidth: 200 }}
            >
              Retour au tableau de bord
            </Button>
          </Box>
        </Paper>
      </motion.div>
    </Container>
  );
};

export default NotFound; 