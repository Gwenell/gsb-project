import React, { useState, useEffect } from 'react';
import {
  Box,
  Typography,
  Button,
  CircularProgress,
  Paper,
  Grid,
  TextField,
  IconButton,
  MenuItem
} from '@mui/material';
import { useNavigate, useParams } from 'react-router-dom';
import { AddCircleOutline, RemoveCircleOutline } from '@mui/icons-material';
import api from '../../services/api';
import Layout from '../../components/Layout';

const FicheFraisForm: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const [loading, setLoading] = useState(false);
  const [mois, setMois] = useState(new Date().toISOString().slice(0, 7));
  const [lignesFraisForfait, setLignesFraisForfait] = useState<any[]>([]);
  const [lignesFraisHorsForfait, setLignesFraisHorsForfait] = useState<any[]>([]);
  const [fraisForfaitOptions, setFraisForfaitOptions] = useState<any[]>([]);

  useEffect(() => {
    const fetchFraisForfait = async () => {
        try {
            const response = await api.get('/frais-forfait');
            const options = response.data;
            setFraisForfaitOptions(options);

            if (!id) { // Only set default lines for new forms
                setLignesFraisForfait(options.map((o: any) => ({ id_frais_forfait: o.id, quantite: 0, libelle: o.libelle })));
            }

        } catch (error) {
            console.error("Erreur lors de la récupération des frais forfaitaires", error);
        }
    };
    fetchFraisForfait();

    if (id) {
      setLoading(true);
      api.get(`/fiches-frais/${id}`)
        .then(response => {
          const { mois, lignes_frais_forfait, lignes_frais_hors_forfait } = response.data;
          setMois(mois);
          if (fraisForfaitOptions.length > 0) {
            setLignesFraisForfait(
              fraisForfaitOptions.map(option => {
                const existing = lignes_frais_forfait.find((l:any) => l.id_frais_forfait === option.id);
                return { id_frais_forfait: option.id, libelle: option.libelle, quantite: existing ? existing.quantite : 0 };
              })
            );
          }
          setLignesFraisHorsForfait(lignes_frais_hors_forfait || []);
          setLoading(false);
        })
        .catch(err => {
            console.error(err);
            setLoading(false);
        });
    }
  }, [id, fraisForfaitOptions.length]);

  const handleForfaitChange = (index: number, value: string) => {
    const newLignes = [...lignesFraisForfait];
    newLignes[index].quantite = value;
    setLignesFraisForfait(newLignes);
  };
  
  const handleHorsForfaitChange = (index: number, field: string, value: string) => {
    const newLignes = [...lignesFraisHorsForfait];
    newLignes[index][field] = value;
    setLignesFraisHorsForfait(newLignes);
  };

  const addHorsForfait = () => {
    setLignesFraisHorsForfait([...lignesFraisHorsForfait, { libelle: '', date: '', montant: '' }]);
  };

  const removeHorsForfait = (index: number) => {
    const newLignes = lignesFraisHorsForfait.filter((_, i) => i !== index);
    setLignesFraisHorsForfait(newLignes);
  };

  const handleSubmit = async (event: React.FormEvent) => {
    event.preventDefault();
    setLoading(true);

    const payload = {
      mois,
      lignesFraisForfait: lignesFraisForfait.map(l => ({ id_frais_forfait: l.id_frais_forfait, quantite: parseInt(l.quantite) || 0})),
      lignesFraisHorsForfait,
    };

    try {
      if (id) {
        await api.put(`/fiches-frais/${id}`, payload);
      } else {
        await api.post('/fiches-frais', payload);
      }
      navigate('/fiches-frais');
    } catch (error) {
      console.error('Erreur lors de la soumission de la fiche:', error);
      setLoading(false);
    }
  };

  if (loading && id) return <Layout title="Chargement..."><CircularProgress /></Layout>;

  return (
    <Layout title={id ? 'Modifier la fiche de frais' : 'Nouvelle fiche de frais'}>
      <Paper sx={{ p: 3 }}>
        <form onSubmit={handleSubmit}>
          <Grid container spacing={3}>
            <Grid item xs={12}>
              <TextField
                label="Mois (YYYY-MM)"
                value={mois}
                onChange={(e) => setMois(e.target.value)}
                fullWidth
                required
                disabled={!!id}
              />
            </Grid>

            <Grid item xs={12}>
              <Typography variant="h6">Frais Forfaitaires</Typography>
              {lignesFraisForfait.map((ligne, index) => (
                <Box key={ligne.id_frais_forfait} sx={{ display: 'flex', alignItems: 'center', mt: 1 }}>
                    <Typography sx={{ flexGrow: 1 }}>{ligne.libelle}</Typography>
                    <TextField
                        type="number"
                        value={ligne.quantite}
                        onChange={(e) => handleForfaitChange(index, e.target.value)}
                        sx={{ width: 100 }}
                        inputProps={{ min: 0 }}
                    />
                </Box>
              ))}
            </Grid>

            <Grid item xs={12}>
              <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <Typography variant="h6">Frais Hors Forfait</Typography>
                <Button startIcon={<AddCircleOutline />} onClick={addHorsForfait}>
                  Ajouter
                </Button>
              </Box>
              {lignesFraisHorsForfait.map((ligne, index) => (
                <Grid container spacing={2} key={index} sx={{ mt: 1, alignItems: 'center' }}>
                  <Grid item xs={12} sm={5}>
                    <TextField
                      label="Libellé"
                      value={ligne.libelle}
                      onChange={(e) => handleHorsForfaitChange(index, 'libelle', e.target.value)}
                      fullWidth
                      required
                    />
                  </Grid>
                  <Grid item xs={12} sm={3}>
                    <TextField
                      type="date"
                      value={ligne.date}
                      onChange={(e) => handleHorsForfaitChange(index, 'date', e.target.value)}
                      fullWidth
                      required
                      InputLabelProps={{ shrink: true }}
                    />
                  </Grid>
                  <Grid item xs={12} sm={3}>
                    <TextField
                      type="number"
                      label="Montant"
                      value={ligne.montant}
                      onChange={(e) => handleHorsForfaitChange(index, 'montant', e.target.value)}
                      fullWidth
                      required
                      inputProps={{ min: 0, step: "0.01" }}
                    />
                  </Grid>
                  <Grid item xs={12} sm={1}>
                    <IconButton onClick={() => removeHorsForfait(index)}>
                      <RemoveCircleOutline />
                    </IconButton>
                  </Grid>
                </Grid>
              ))}
            </Grid>

            <Grid item xs={12} sx={{ mt: 2 }}>
              <Button type="submit" variant="contained" color="primary" disabled={loading}>
                {loading ? <CircularProgress size={24} /> : (id ? 'Mettre à jour' : 'Créer')}
              </Button>
            </Grid>
          </Grid>
        </form>
      </Paper>
    </Layout>
  );
};

export default FicheFraisForm; 