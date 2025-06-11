import React, { useState, useEffect } from 'react';
import {
  Box,
  Typography,
  Button,
  CircularProgress,
  Paper,
  Grid,
  Chip,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  TextField,
  Divider,
} from '@mui/material';
import { useParams, useNavigate } from 'react-router-dom';
import api from '../../services/api';
import { useAuth } from '../../contexts/AuthContext';
import Layout from '../../components/Layout';

const FicheFraisDetails: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { user } = useAuth();
  const [fiche, setFiche] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [nbJustificatifs, setNbJustificatifs] = useState(0);
  const [montantValide, setMontantValide] = useState(0);

  useEffect(() => {
    if (id) {
      api.get(`/fiches-frais/${id}`)
        .then(response => {
          setFiche(response.data);
          setNbJustificatifs(response.data.nb_justificatifs || 0);
          setMontantValide(response.data.montant_valide || 0);
          setLoading(false);
        })
        .catch(err => {
          console.error(err);
          setLoading(false);
        });
    }
  }, [id]);

  const handleValidate = async () => {
    try {
      await api.put(`/fiches-frais/${id}/valider`, {
        nb_justificatifs: nbJustificatifs,
        montant_valide: montantValide,
      });
      navigate('/fiches-frais');
    } catch (error) {
      console.error('Erreur lors de la validation:', error);
    }
  };

  const handleReimburse = async () => {
    try {
      await api.put(`/fiches-frais/${id}/rembourser`);
      navigate('/fiches-frais');
    } catch (error) {
      console.error('Erreur lors du remboursement:', error);
    }
  };
  
  const getEtatChip = (etat: string) => {
    switch(etat) {
        case 'CR': return <Chip label="Créée" color="info" />;
        case 'VA': return <Chip label="Validée" color="success" />;
        case 'RB': return <Chip label="Remboursée" color="primary" />;
        case 'CL': return <Chip label="Clôturée" color="warning" />;
        default: return <Chip label={etat} />;
    }
  };

  if (loading) return <Layout title="Chargement..."><CircularProgress /></Layout>;
  if (!fiche) return <Layout title="Erreur"><Typography>Fiche non trouvée.</Typography></Layout>;

  const canEdit = fiche.id_etat === 'CR' && (user?.id === fiche.utilisateur.id || user?.type_utilisateur === 'admin');
  const canValidate = (user?.type_utilisateur === 'responsable' || user?.type_utilisateur === 'admin') && fiche.id_etat === 'CR';
  const canReimburse = (user?.type_utilisateur === 'responsable' || user?.type_utilisateur === 'admin') && fiche.id_etat === 'VA';
  
  return (
    <Layout title={`Détails de la fiche de frais de ${fiche.mois}`}>
      <Paper sx={{ p: 3 }}>
        <Grid container spacing={2} sx={{ mb: 2 }}>
          <Grid item xs={12} sm={6}>
            <Typography variant="h6">Informations Générales</Typography>
            <Typography><b>Utilisateur:</b> {fiche.utilisateur.prenom} {fiche.utilisateur.nom}</Typography>
            <Typography><b>Mois:</b> {fiche.mois}</Typography>
            <Typography><b>État:</b> {getEtatChip(fiche.id_etat)}</Typography>
            <Typography><b>Dernière modification:</b> {new Date(fiche.date_modif).toLocaleDateString()}</Typography>
          </Grid>
          {canEdit && (
            <Grid item xs={12} sm={6} sx={{ textAlign: 'right' }}>
              <Button variant="contained" onClick={() => navigate(`/fiches-frais/edit/${id}`)}>
                Modifier
              </Button>
            </Grid>
          )}
        </Grid>

        <Divider sx={{ my: 2 }} />
        
        <Typography variant="h6">Frais Forfaitaires</Typography>
        <TableContainer component={Paper} sx={{ my: 2 }}>
            <Table>
                <TableHead>
                    <TableRow>
                        <TableCell>Type de Frais</TableCell>
                        <TableCell align="right">Quantité</TableCell>
                        <TableCell align="right">Montant Unitaire</TableCell>
                        <TableCell align="right">Total</TableCell>
                    </TableRow>
                </TableHead>
                <TableBody>
                    {fiche.lignes_frais_forfait.map((ligne: any) => (
                        <TableRow key={ligne.id_frais_forfait}>
                            <TableCell>{ligne.frais_forfait.libelle}</TableCell>
                            <TableCell align="right">{ligne.quantite}</TableCell>
                            <TableCell align="right">{parseFloat(ligne.frais_forfait.montant).toFixed(2)} €</TableCell>
                            <TableCell align="right">{(ligne.quantite * ligne.frais_forfait.montant).toFixed(2)} €</TableCell>
                        </TableRow>
                    ))}
                </TableBody>
            </Table>
        </TableContainer>

        <Typography variant="h6">Frais Hors Forfait</Typography>
        <TableContainer component={Paper} sx={{ my: 2 }}>
            <Table>
                <TableHead>
                    <TableRow>
                        <TableCell>Libellé</TableCell>
                        <TableCell>Date</TableCell>
                        <TableCell align="right">Montant</TableCell>
                    </TableRow>
                </TableHead>
                <TableBody>
                    {fiche.lignes_frais_hors_forfait.map((ligne: any) => (
                        <TableRow key={ligne.id}>
                            <TableCell>{ligne.libelle}</TableCell>
                            <TableCell>{new Date(ligne.date).toLocaleDateString()}</TableCell>
                            <TableCell align="right">{parseFloat(ligne.montant).toFixed(2)} €</TableCell>
                        </TableRow>
                    ))}
                </TableBody>
            </Table>
        </TableContainer>

        {(canValidate || canReimburse || fiche.id_etat === 'VA' || fiche.id_etat === 'RB') && <Divider sx={{ my: 2 }} />}

        {(canValidate || fiche.id_etat === 'VA' || fiche.id_etat === 'RB') && (
        <Box sx={{ mt: 2 }}>
            <Typography variant="h6">Validation Comptable</Typography>
            <Grid container spacing={2} sx={{ mt: 1, alignItems: 'center' }}>
                <Grid item>
                    <TextField
                        type="number"
                        label="Nb. Justificatifs"
                        value={nbJustificatifs}
                        onChange={(e) => setNbJustificatifs(parseInt(e.target.value))}
                        disabled={!canValidate}
                    />
                </Grid>
                <Grid item>
                    <TextField
                        type="number"
                        label="Montant Validé"
                        value={montantValide}
                        onChange={(e) => setMontantValide(parseFloat(e.target.value))}
                        disabled={!canValidate}
                        inputProps={{ step: "0.01" }}
                    />
                </Grid>
                {canValidate && (
                    <Grid item>
                        <Button variant="contained" color="success" onClick={handleValidate}>Valider</Button>
                    </Grid>
                )}
            </Grid>
        </Box>
        )}

        {canReimburse && (
            <Box sx={{ mt: 2 }}>
                 <Button variant="contained" color="primary" onClick={handleReimburse}>
                    Marquer comme Remboursée
                </Button>
            </Box>
        )}
      </Paper>
    </Layout>
  );
};

export default FicheFraisDetails; 