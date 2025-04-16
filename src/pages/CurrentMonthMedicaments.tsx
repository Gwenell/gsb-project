import React, { useState, useEffect } from 'react';
import { 
  Container, Typography, Grid, Box, Button, 
  CircularProgress, Alert, Select, MenuItem, 
  InputLabel, FormControl, TextField, InputAdornment,
  SelectChangeEvent
} from '@mui/material';
import SearchIcon from '@mui/icons-material/Search';
import PictureAsPdfIcon from '@mui/icons-material/PictureAsPdf';
import { getCurrentMonthMedicaments, generateMedicamentPdf } from '../services/api';
import MedicamentCard from '../components/MedicamentCard';
import { useAuth } from '../contexts/AuthContext';

interface Medicament {
  id: string;
  nomCommercial: string;
  famille: {
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

const CurrentMonthMedicaments: React.FC = () => {
  const [medicaments, setMedicaments] = useState<Medicament[]>([]);
  const [filteredMedicaments, setFilteredMedicaments] = useState<Medicament[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [dangerFilter, setDangerFilter] = useState<string>('all');
  const [searchQuery, setSearchQuery] = useState<string>('');
  const [currentMonth, setCurrentMonth] = useState<string>('');
  
  const { user } = useAuth();

  useEffect(() => {
    const fetchMedicaments = async () => {
      setLoading(true);
      try {
        const response = await getCurrentMonthMedicaments();
        if (response.status === 'success') {
          setMedicaments(response.data);
          setFilteredMedicaments(response.data);
          
          // Get current month in YYYYMM format
          const now = new Date();
          const month = now.getMonth() + 1;
          const year = now.getFullYear();
          setCurrentMonth(`${year}${month.toString().padStart(2, '0')}`);
        } else {
          setError('Erreur lors de la récupération des médicaments');
        }
      } catch (err) {
        console.error('Error fetching medicaments:', err);
        setError('Une erreur est survenue lors de la récupération des médicaments');
      } finally {
        setLoading(false);
      }
    };

    fetchMedicaments();
  }, []);

  // Apply filters whenever they change
  useEffect(() => {
    let filtered = [...medicaments];
    
    // Apply danger level filter
    if (dangerFilter !== 'all') {
      filtered = filtered.filter(med => 
        med.niveau_dangerosité === parseInt(dangerFilter)
      );
    }
    
    // Apply search filter
    if (searchQuery) {
      const query = searchQuery.toLowerCase();
      filtered = filtered.filter(med => 
        med.nomCommercial.toLowerCase().includes(query) || 
        med.famille.libelle.toLowerCase().includes(query) ||
        med.composition.toLowerCase().includes(query) ||
        (med.description && med.description.toLowerCase().includes(query))
      );
    }
    
    setFilteredMedicaments(filtered);
  }, [dangerFilter, searchQuery, medicaments]);

  const handleDangerFilterChange = (event: SelectChangeEvent) => {
    setDangerFilter(event.target.value);
  };

  const handleSearchChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    setSearchQuery(event.target.value);
  };

  const handleGeneratePdf = async () => {
    try {
      await generateMedicamentPdf(currentMonth);
    } catch (err) {
      console.error('Error generating PDF:', err);
      setError('Erreur lors de la génération du PDF');
    }
  };

  return (
    <Container maxWidth="lg">
      <Box display="flex" justifyContent="space-between" alignItems="center" mb={4}>
        <Typography variant="h4" component="h1" gutterBottom>
          Médicaments à présenter ce mois-ci
        </Typography>
        <Button 
          variant="contained" 
          color="primary" 
          startIcon={<PictureAsPdfIcon />}
          onClick={handleGeneratePdf}
          disabled={loading || medicaments.length === 0}
        >
          Exporter PDF
        </Button>
      </Box>

      {loading ? (
        <Box display="flex" justifyContent="center" my={4}>
          <CircularProgress />
        </Box>
      ) : error ? (
        <Alert severity="error" sx={{ my: 2 }}>{error}</Alert>
      ) : medicaments.length === 0 ? (
        <Alert severity="info" sx={{ my: 2 }}>
          Aucun médicament à présenter pour ce mois.
        </Alert>
      ) : (
        <>
          <Box display="flex" gap={2} mb={3} flexDirection={{ xs: 'column', sm: 'row' }}>
            <FormControl variant="outlined" sx={{ minWidth: 200 }}>
              <InputLabel id="danger-filter-label">Niveau de dangerosité</InputLabel>
              <Select
                labelId="danger-filter-label"
                value={dangerFilter}
                onChange={handleDangerFilterChange}
                label="Niveau de dangerosité"
              >
                <MenuItem value="all">Tous</MenuItem>
                <MenuItem value="1">Niveau 1</MenuItem>
                <MenuItem value="2">Niveau 2</MenuItem>
                <MenuItem value="3">Niveau 3</MenuItem>
              </Select>
            </FormControl>

            <TextField
              label="Rechercher"
              variant="outlined"
              fullWidth
              value={searchQuery}
              onChange={handleSearchChange}
              InputProps={{
                startAdornment: (
                  <InputAdornment position="start">
                    <SearchIcon />
                  </InputAdornment>
                ),
              }}
            />
          </Box>

          <Grid container spacing={3}>
            {filteredMedicaments.map(medicament => (
              <Grid item xs={12} key={medicament.id}>
                <MedicamentCard {...medicament} />
              </Grid>
            ))}
          </Grid>

          {filteredMedicaments.length === 0 && (
            <Alert severity="info" sx={{ mt: 2 }}>
              Aucun médicament ne correspond aux critères de recherche.
            </Alert>
          )}
        </>
      )}
    </Container>
  );
};

export default CurrentMonthMedicaments; 