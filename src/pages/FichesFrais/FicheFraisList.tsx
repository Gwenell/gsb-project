import React, { useState, useEffect } from 'react';
import {
  Box,
  Typography,
  Button,
  CircularProgress,
  List,
  ListItem,
  ListItemText,
  Paper,
  Grid,
  TextField,
  MenuItem,
  Chip
} from '@mui/material';
import { useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import api from '../../services/api';
import { useAuth } from '../../contexts/AuthContext';
import Layout from '../../components/Layout';

const FicheFraisList: React.FC = () => {
  const [fiches, setFiches] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [filterMonth, setFilterMonth] = useState('');
  const [filterEtat, setFilterEtat] = useState('');
  const navigate = useNavigate();
  const { user } = useAuth();

  useEffect(() => {
    const fetchFiches = async () => {
      setLoading(true);
      try {
        const params = new URLSearchParams();
        if (filterMonth) params.append('mois', filterMonth);
        if (filterEtat) params.append('etat', filterEtat);
        
        const response = await api.get(`/fiches-frais?${params.toString()}`);
        setFiches(response.data);
      } catch (error) {
        console.error('Erreur lors de la récupération des fiches de frais:', error);
      } finally {
        setLoading(false);
      }
    };

    fetchFiches();
  }, [filterMonth, filterEtat]);

  const getEtatChip = (etat: string) => {
    switch(etat) {
        case 'CR': return <Chip label="Créée" color="info" />;
        case 'VA': return <Chip label="Validée" color="success" />;
        case 'RB': return <Chip label="Remboursée" color="primary" />;
        case 'CL': return <Chip label="Clôturée" color="warning" />;
        default: return <Chip label={etat} />;
    }
  };

  const months = Array.from({ length: 12 }, (_, i) => {
    const d = new Date();
    d.setMonth(d.getMonth() - i);
    return d.toISOString().slice(0, 7);
  });
  
  return (
    <Layout title="Mes Fiches de Frais">
      <Box>
        <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 2 }}>
          <Typography variant="h5">Liste des fiches de frais</Typography>
          <Button variant="contained" color="primary" onClick={() => navigate('/fiches-frais/new')}>
            Nouvelle Fiche
          </Button>
        </Box>

        <Paper sx={{ p: 2, mb: 2 }}>
            <Grid container spacing={2}>
                <Grid item xs={12} sm={6}>
                    <TextField
                        select
                        label="Filtrer par mois"
                        value={filterMonth}
                        onChange={(e) => setFilterMonth(e.target.value)}
                        fullWidth
                    >
                        <MenuItem value=""><em>Tous les mois</em></MenuItem>
                        {months.map(m => <MenuItem key={m} value={m}>{m}</MenuItem>)}
                    </TextField>
                </Grid>
                <Grid item xs={12} sm={6}>
                    <TextField
                        select
                        label="Filtrer par état"
                        value={filterEtat}
                        onChange={(e) => setFilterEtat(e.target.value)}
                        fullWidth
                    >
                        <MenuItem value=""><em>Tous les états</em></MenuItem>
                        <MenuItem value="CR">Créée</MenuItem>
                        <MenuItem value="VA">Validée</MenuItem>
                        <MenuItem value="RB">Remboursée</MenuItem>
                        <MenuItem value="CL">Clôturée</MenuItem>
                    </TextField>
                </Grid>
            </Grid>
        </Paper>

        {loading ? (
          <Box sx={{ display: 'flex', justifyContent: 'center' }}><CircularProgress /></Box>
        ) : (
          <List>
            {fiches.map((fiche) => (
              <motion.div
                key={fiche.id}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.3 }}
              >
                <ListItem
                  button
                  onClick={() => navigate(`/fiches-frais/${fiche.id}`)}
                  sx={{
                    mb: 1,
                    p: 2,
                    borderRadius: 2,
                    boxShadow: 1,
                    '&:hover': { boxShadow: 3 }
                  }}
                >
                  <ListItemText
                    primary={`Fiche de ${fiche.mois}`}
                    secondary={user?.type_utilisateur !== 'visiteur' ? `Utilisateur: ${fiche.id_utilisateur}` : ''}
                  />
                  {getEtatChip(fiche.id_etat)}
                </ListItem>
              </motion.div>
            ))}
          </List>
        )}
      </Box>
    </Layout>
  );
};

export default FicheFraisList; 