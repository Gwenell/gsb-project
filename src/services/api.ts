import axios from 'axios';

// Base API URL for Laravel backend
const API_URL = process.env.REACT_APP_API_URL || 'https://gsbapi.gwenell.com/api';

// Create an Axios instance with default config
const api = axios.create({
  baseURL: API_URL,
  headers: {
    'Content-Type': 'application/json',
    'Accept': 'application/json'
  },
  withCredentials: true, // Important for Sanctum authentication
  timeout: 10000
});

// Add request interceptor to include auth token
api.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem('token');
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    
    // For development debugging - log requests
    console.log(`API Request to: ${config.url}`, config);
    
    return config;
  },
  (error) => Promise.reject(error)
);

// Add response interceptor for error handling
api.interceptors.response.use(
  (response) => response,
  (error) => {
    // Log detailed error information
    console.error('API Error Details:', {
      url: error.config?.url,
      method: error.config?.method,
      status: error.response?.status,
      statusText: error.response?.statusText,
      data: error.response?.data,
      headers: error.response?.headers,
      message: error.message
    });
    
    // Handle 401 Unauthorized responses
    if (error.response && error.response.status === 401) {
      localStorage.removeItem('user');
      localStorage.removeItem('token');
      // Do not redirect to login for public pages
    }
    
    // Handle CORS errors specially
    if (error.message === 'Network Error') {
      console.error('Possible CORS issue detected. Please check API CORS configuration.');
    }
    
    return Promise.reject(error);
  }
);

// Authentication
export const login = async (username: string, password: string) => {
  try {
    console.log(`Attempting login with username: ${username} to ${API_URL}`);
    
    const response = await api.post('/login', {
        username,
        password
    });
    
    console.log("API login response:", response);
    
    if (response.data) {
      // Store user info and token in localStorage
      localStorage.setItem("user", JSON.stringify(response.data.user));
      localStorage.setItem("token", response.data.token);
      
        return {
          status: 'success',
        data: response.data.user
        };
    } else {
      throw new Error("Réponse vide du serveur");
    }
  } catch (error) {
    console.error("Erreur lors de la connexion:", error);
    
    let errorMessage = "Erreur lors de la connexion";
    
    if (error.response) {
      console.error("Error response data:", error.response.data);
      console.error("Error response status:", error.response.status);
      
      // Customized error message based on status
      if (error.response.status === 422) {
        errorMessage = "Identifiants incorrects";
      } else {
      errorMessage = `Erreur serveur: ${error.response.status}`;
      }
    } else if (error.request) {
      console.error("Error request:", error.request);
      errorMessage = "Aucune réponse du serveur. Vérifiez votre connexion internet.";
    } else {
      errorMessage = error instanceof Error ? error.message : "Erreur inconnue";
    }
    
    return {
      status: 'error',
      message: errorMessage
    };
  }
};

export const logout = async (): Promise<any> => {
  try {
    await api.post('/logout');
    
    // Clear local storage
    localStorage.removeItem('user');
    localStorage.removeItem('token');
    
    return {
      status: 'success',
      message: 'Déconnexion réussie',
      data: null
    };
  } catch (error) {
    console.error('Logout error:', error);
    return {
      status: 'error',
      message: error instanceof Error ? error.message : 'Erreur lors de la déconnexion',
      data: null
    };
  }
};

export const getCurrentUser = async () => {
  try {
    const response = await api.get('/user');
    return {
      status: 'success',
      data: response.data.user
    };
  } catch (error) {
    console.error('Error getting current user:', error);
    return {
      status: 'error',
      message: error instanceof Error ? error.message : 'Erreur lors de la récupération des informations utilisateur',
      data: null
    };
  }
};

// Médecins
export const getAllMedecins = async (search: string = '') => {
  try {
    const params = search ? { search } : {};
    console.log('Récupération des médecins avec paramètres:', params);
    
    const response = await api.get('/medecins', { params });
    console.log('Réponse médecins brute:', response);
    
    let medecinsData = null;
    
    if (response.data) {
      if (Array.isArray(response.data)) {
        medecinsData = response.data;
      } else if (response.data.data && Array.isArray(response.data.data)) {
        medecinsData = response.data.data;
      } else if (response.data.medecins && Array.isArray(response.data.medecins)) {
        medecinsData = response.data.medecins;
      } else {
        // Tenter d'extraire n'importe quel tableau dans la réponse
        const possibleArrays = Object.values(response.data).filter(val => Array.isArray(val));
        if (possibleArrays.length > 0) {
          medecinsData = possibleArrays[0];
        }
      }
    }
    
    return {
      status: 'success',
      data: medecinsData || []
    };
  } catch (error) {
    console.error("Error fetching medecins:", error);
    let errorMessage = "Erreur lors de la récupération des médecins";
    
    if (error.response) {
      console.error("Détails de l'erreur:", error.response.data);
      errorMessage = error.response.data?.message || errorMessage;
    }
    
    return {
      status: 'error',
      message: error instanceof Error ? error.message : errorMessage,
      data: []
    };
  }
};

export const getMedecinById = async (id: string) => {
  try {
    const response = await api.get(`/medecins/${id}`);
    return {
      status: 'success',
      data: response.data
    };
  } catch (error) {
    console.error(`Error fetching medecin ${id}:`, error);
    return {
      status: 'error',
      message: error instanceof Error ? error.message : "Erreur lors de la récupération du médecin",
      data: null
    };
  }
};

// Médicaments
export const getAllMedicaments = async (search: string = '') => {
  try {
    const params = search ? { search } : {};
    console.log('Récupération des médicaments avec paramètres:', params);
    
    const response = await api.get('/medicaments', { params });
    console.log('Réponse médicaments brute:', response);
    
    let medicamentsData = null;
    
    if (response.data) {
      if (Array.isArray(response.data)) {
        medicamentsData = response.data;
      } else if (response.data.data && Array.isArray(response.data.data)) {
        medicamentsData = response.data.data;
      } else if (response.data.medicaments && Array.isArray(response.data.medicaments)) {
        medicamentsData = response.data.medicaments;
      } else {
        // Tenter d'extraire n'importe quel tableau dans la réponse
        const possibleArrays = Object.values(response.data).filter(val => Array.isArray(val));
        if (possibleArrays.length > 0) {
          medicamentsData = possibleArrays[0];
        }
      }
    }
    
    // Normaliser les données des médicaments pour garantir une structure cohérente
    if (medicamentsData && Array.isArray(medicamentsData)) {
      medicamentsData = medicamentsData.map(med => {
        // S'assurer que chaque médicament a le champ nom_commercial (ou nomCommercial)
        const normalizedMed = {
          ...med,
          id: med.id || '',
          nom_commercial: med.nom_commercial || med.nomCommercial || '',
          nomCommercial: med.nomCommercial || med.nom_commercial || '',
          id_famille: med.id_famille || med.idFamille || '',
          idFamille: med.idFamille || med.id_famille || '',
        };
        return normalizedMed;
      });
    }
    
    return {
      status: 'success',
      data: medicamentsData || []
    };
  } catch (error) {
    console.error("Error fetching medicaments:", error);
    let errorMessage = "Erreur lors de la récupération des médicaments";
    
    if (error.response) {
      console.error("Détails de l'erreur:", error.response.data);
      errorMessage = error.response.data?.message || errorMessage;
    }
    
    return {
      status: 'error',
      message: error instanceof Error ? error.message : errorMessage,
      data: []
    };
  }
};

export const getMedicamentsByDangerosity = async () => {
  try {
    const response = await api.get('/medicaments/dangerosity');
    
    return {
      status: 'success',
      data: response.data
    };
  } catch (error) {
    console.error("Error fetching medicaments by dangerosity:", error);
    return {
      status: 'error',
      message: error instanceof Error ? error.message : "Erreur lors de la récupération des médicaments par dangerosité",
      data: []
    };
  }
};

export const getRecentMedicaments = async () => {
  try {
    const response = await api.get('/medicaments/recent');
    
    return {
      status: 'success',
      data: response.data
    };
  } catch (error) {
    console.error("Error fetching recent medicaments:", error);
    return {
      status: 'error',
      message: error instanceof Error ? error.message : "Erreur lors de la récupération des médicaments récents",
      data: []
    };
  }
};

export const getCurrentMonthMedicaments = async () => {
  try {
    const response = await api.get('/medicaments/current-month');
    
    return {
      status: 'success',
      data: response.data
    };
  } catch (error) {
    console.error("Error fetching current month medicaments:", error);
    return {
      status: 'error',
      message: error instanceof Error ? error.message : "Erreur lors de la récupération des médicaments du mois",
      data: []
    };
  }
};

export const getMedicamentsByVisiteurAndMonth = async (idVisiteur: string, annee_mois: string) => {
  try {
    const response = await api.get('/medicaments/by-visiteur', {
      params: { idVisiteur, annee_mois }
    });
    
    return {
      status: 'success',
      data: response.data
    };
  } catch (error) {
    console.error("Error fetching medicaments by visiteur and month:", error);
    return {
      status: 'error',
      message: error instanceof Error ? error.message : "Erreur lors de la récupération des médicaments par visiteur",
      data: []
    };
  }
};

export const getMedicamentById = async (id: string) => {
  try {
    const response = await api.get(`/medicaments/${id}`);
    return {
      status: 'success',
      data: response.data
    };
  } catch (error) {
    console.error(`Error fetching medicament ${id}:`, error);
    return {
      status: 'error',
      message: error instanceof Error ? error.message : "Erreur lors de la récupération du médicament",
      data: null
    };
  }
};

export const createMedicament = async (medicamentData: {
  id: string;
  nomCommercial: string;
  idFamille: string;
  composition: string;
  effets: string;
  contreIndications: string;
  image_url?: string;
  description?: string;
  niveau_dangerosité?: number;
  date_sortie?: string;
}) => {
  try {
    const response = await api.post('/medicaments', medicamentData);
    return {
      status: 'success',
      data: response.data
    };
  } catch (error) {
    console.error("Error creating medicament:", error);
    return {
      status: 'error',
      message: error instanceof Error ? error.message : "Erreur lors de la création du médicament",
      data: null
    };
  }
};

export const updateMedicament = async (id: string, medicamentData: {
  nomCommercial?: string;
  idFamille?: string;
  composition?: string;
  effets?: string;
  contreIndications?: string;
  image_url?: string;
  description?: string;
  niveau_dangerosité?: number;
  date_sortie?: string;
}) => {
  try {
    const response = await api.put(`/medicaments/${id}`, medicamentData);
    return {
      status: 'success',
      data: response.data
    };
  } catch (error) {
    console.error(`Error updating medicament ${id}:`, error);
    return {
      status: 'error',
      message: error instanceof Error ? error.message : "Erreur lors de la mise à jour du médicament",
      data: null
    };
  }
};

export const deleteMedicament = async (id: string) => {
  try {
    await api.delete(`/medicaments/${id}`);
    return {
      status: 'success',
      message: 'Médicament supprimé avec succès'
    };
  } catch (error) {
    console.error(`Error deleting medicament ${id}:`, error);
    return {
      status: 'error',
      message: error instanceof Error ? error.message : "Erreur lors de la suppression du médicament"
    };
  }
};

export const assignMedicamentsToVisiteurs = async (data: {
  annee_mois: string;
  visiteurs: string[];
  medicaments: string[];
}) => {
  try {
    const response = await api.post('/medicaments/assign', data);
    return {
      status: 'success',
      data: response.data
    };
  } catch (error) {
    console.error("Error assigning medicaments to visiteurs:", error);
    return {
      status: 'error',
      message: error instanceof Error ? error.message : "Erreur lors de l'affectation des médicaments aux visiteurs",
      data: null
    };
  }
};

export const generateMedicamentPdf = async (annee_mois: string) => {
  try {
    const response = await api.get('/medicaments/pdf', {
      params: { annee_mois },
      responseType: 'blob'
    });
    
    // Create blob link to download
    const url = window.URL.createObjectURL(new Blob([response.data]));
    const link = document.createElement('a');
    link.href = url;
    link.setAttribute('download', `medicaments-${annee_mois}.pdf`);
    document.body.appendChild(link);
    link.click();
    link.remove();
    
    return {
      status: 'success'
    };
  } catch (error) {
    console.error("Error generating medicament PDF:", error);
    return {
      status: 'error',
      message: error instanceof Error ? error.message : "Erreur lors de la génération du PDF"
    };
  }
};

// Familles
export const getAllFamilles = async () => {
  try {
    const response = await api.get('/familles');
    return {
      status: 'success',
      data: response.data
    };
  } catch (error) {
    console.error("Error fetching familles:", error);
    return {
      status: 'error',
      message: error instanceof Error ? error.message : "Erreur lors de la récupération des familles",
      data: []
    };
  }
};

// Récupérer les statistiques publiques du dashboard
export const getPublicDashboardStats = async (periode: string = 'mois', date: string = '') => {
  try {
    const params: { periode: string; date?: string } = { periode };
    if (date) params.date = date;
    
    console.log('Récupération des statistiques publiques avec paramètres:', params);
    const response = await api.get('/dashboard-stats', { params });
    console.log('Réponse statistiques publiques brute:', response);
    
    return {
      status: 'success',
      data: response.data || {}
    };
  } catch (error) {
    console.error("Error fetching public dashboard statistics:", error);
    let errorMessage = "Erreur lors de la récupération des statistiques publiques";
    
    if (error.response) {
      console.error("Détails de l'erreur:", error.response.data);
      errorMessage = error.response.data?.message || errorMessage;
    }
    
    return {
      status: 'error',
      message: error instanceof Error ? error.message : errorMessage,
      data: {}
    };
  }
};

// Rapports
export const getRapportsByVisiteur = async (visiteurId: string) => {
  try {
    console.log(`Récupération des rapports pour le visiteur: ${visiteurId}`);
    
    const response = await api.get(`/visiteurs/${visiteurId}/rapports`);
    console.log('Réponse rapports brute:', response);
    
    let rapportsData = null;
    
    if (response.data) {
      if (Array.isArray(response.data)) {
        rapportsData = response.data;
      } else if (response.data.data && Array.isArray(response.data.data)) {
        rapportsData = response.data.data;
      } else if (response.data.rapports && Array.isArray(response.data.rapports)) {
        rapportsData = response.data.rapports;
      } else {
        // Tenter d'extraire n'importe quel tableau dans la réponse
        const possibleArrays = Object.values(response.data).filter(val => Array.isArray(val));
        if (possibleArrays.length > 0) {
          rapportsData = possibleArrays[0];
        }
      }
    }
    
    return {
      status: 'success',
      data: rapportsData || []
    };
  } catch (error) {
    console.error(`Error fetching rapports for visiteur ${visiteurId}:`, error);
    let errorMessage = "Erreur lors de la récupération des rapports";
    
    if (error.response) {
      console.error("Détails de l'erreur:", error.response.data);
      errorMessage = error.response.data?.message || errorMessage;
    }
    
    return {
      status: 'error',
      message: error instanceof Error ? error.message : errorMessage,
      data: []
    };
  }
};

export const getRapportById = async (id: string) => {
  try {
    const response = await api.get(`/rapports/${id}`);
    return {
      status: 'success',
      data: response.data
    };
  } catch (error) {
    console.error(`Error fetching rapport ${id}:`, error);
    return {
      status: 'error',
      message: error instanceof Error ? error.message : "Erreur lors de la récupération du rapport",
      data: null
    };
  }
};

// Get visiteurs in the director's region
export const getVisiteursInRegion = async () => {
  try {
    const response = await api.get('/region/visiteurs');
    
    return {
      status: 'success',
      data: response.data
    };
  } catch (error) {
    console.error("Error fetching visiteurs in region:", error);
    return {
      status: 'error',
      message: error instanceof Error ? error.message : "Erreur lors de la récupération des visiteurs de votre région",
      data: []
    };
  }
};

// Alias createMedicament to addMedicament for backward compatibility
export const addMedicament = createMedicament;

// Medecins
export const addMedecin = async (medecinData: {
  id: string;
  nom: string;
  prenom: string;
  adresse: string;
  tel: string;
  specialiteComplementaire?: string;
  departement: string;
}) => {
  try {
    const response = await api.post('/medecins', medecinData);
    return {
      status: 'success',
      data: response.data
    };
  } catch (error) {
    console.error("Error creating medecin:", error);
    return {
      status: 'error',
      message: error instanceof Error ? error.message : "Erreur lors de la création du médecin",
      data: null
    };
  }
};

export const updateMedecin = async (id: string, medecinData: {
  nom?: string;
  prenom?: string;
  adresse?: string;
  tel?: string;
  specialiteComplementaire?: string;
  departement?: string;
}) => {
  try {
    const response = await api.put(`/medecins/${id}`, medecinData);
    return {
      status: 'success',
      data: response.data
    };
  } catch (error) {
    console.error(`Error updating medecin ${id}:`, error);
    return {
      status: 'error',
      message: error instanceof Error ? error.message : "Erreur lors de la mise à jour du médecin",
      data: null
    };
  }
};

export const deleteMedecin = async (id: string) => {
  try {
    await api.delete(`/medecins/${id}`);
    return {
      status: 'success',
      message: 'Médecin supprimé avec succès'
    };
  } catch (error) {
    console.error(`Error deleting medecin ${id}:`, error);
    return {
      status: 'error',
      message: error instanceof Error ? error.message : "Erreur lors de la suppression du médecin"
    };
  }
};

// Rapports
export const addRapport = async (rapportData: any) => {
  try {
    const response = await api.post('/rapports', rapportData);
    return {
      status: 'success',
      data: response.data
    };
  } catch (error) {
    console.error("Error creating rapport:", error);
    return {
      status: 'error',
      message: error instanceof Error ? error.message : "Erreur lors de la création du rapport",
      data: null
    };
  }
};

// Nouvelles fonctions pour GSB

// Motifs standardisés
export const getMotifs = async () => {
  try {
    const response = await api.get('/motifs');
    return {
      status: 'success',
      data: response.data
    };
  } catch (error) {
    console.error("Error fetching motifs:", error);
    return {
      status: 'error',
      message: error instanceof Error ? error.message : "Erreur lors de la récupération des motifs",
      data: []
    };
  }
};

// Rapports à valider
export const getRapportsToValidate = async (mois: string = '') => {
  try {
    const params = mois ? { mois } : {};
    const response = await api.get('/rapports-validation', { params });
    return {
      status: 'success',
      data: response.data
    };
  } catch (error) {
    console.error("Error fetching rapports to validate:", error);
    return {
      status: 'error',
      message: error instanceof Error ? error.message : "Erreur lors de la récupération des rapports à valider",
      data: []
    };
  }
};

// Valider un rapport
export const validerRapport = async (id: string, data: { nbJustificatifs?: number; totalValide?: number }) => {
  try {
    const response = await api.put(`/rapports/${id}/valider`, data);
    return {
      status: 'success',
      data: response.data
    };
  } catch (error) {
    console.error("Error validating rapport:", error);
    return {
      status: 'error',
      message: error instanceof Error ? error.message : "Erreur lors de la validation du rapport",
      data: null
    };
  }
};

// Rembourser un rapport
export const rembourserRapport = async (id: string) => {
  try {
    const response = await api.put(`/rapports/${id}/rembourser`);
    return {
      status: 'success',
      data: response.data
    };
  } catch (error) {
    console.error("Error reimbursing rapport:", error);
    return {
      status: 'error',
      message: error instanceof Error ? error.message : "Erreur lors du remboursement du rapport",
      data: null
    };
  }
};

// Statistiques
export const getStatistiques = async (periode: string = 'mois', date: string = '') => {
  try {
    const params: { periode: string; date?: string } = { periode };
    if (date) params.date = date;
    
    console.log('Récupération des statistiques avec paramètres:', params);
    const response = await api.get('/statistiques', { params });
    console.log('Réponse statistiques brute:', response);
    
    // S'assurer que les données retournées contiennent un tableau top_medicaments
    if (response.data && !response.data.top_medicaments) {
      console.log('Aucun top_medicaments trouvé dans la réponse, ajout d\'une liste vide');
      response.data.top_medicaments = [];
    }
    
    return {
      status: 'success',
      data: response.data || {}
    };
  } catch (error) {
    console.error("Error fetching statistics:", error);
    let errorMessage = "Erreur lors de la récupération des statistiques";
    
    if (error.response) {
      console.error("Détails de l'erreur:", error.response.data);
      errorMessage = error.response.data?.message || errorMessage;
    }
    
    return {
      status: 'error',
      message: error instanceof Error ? error.message : errorMessage,
      data: { top_medicaments: [] }  // Renvoyer un objet avec un tableau vide au lieu de null
    };
  }
};

// Rapports de l'équipe
export const getRapportsEquipe = async (mois: string = '') => {
  try {
    const params = mois ? { mois } : {};
    const response = await api.get('/equipe/rapports', { params });
    return {
      status: 'success',
      data: response.data
    };
  } catch (error) {
    console.error("Error fetching team reports:", error);
    return {
      status: 'error',
      message: error instanceof Error ? error.message : "Erreur lors de la récupération des rapports de l'équipe",
      data: null
    };
  }
};

// Récupérer tous les rapports (admin seulement)
export const getAllRapports = async () => {
  try {
    console.log("Appel de l'API pour tous les rapports (admin)");
    const response = await api.get('/admin/rapports');
    
    console.log("Réponse de l'API pour tous les rapports:", response);
    
    if (!response.data) {
      return {
        status: 'error',
        message: 'Aucune donnée reçue du serveur',
        data: null
      };
    }
    
    return {
      status: 'success',
      data: response.data
    };
  } catch (error) {
    console.error("Error fetching all reports:", error);
    
    let errorMessage = "Erreur lors de la récupération de tous les rapports";
    
    if (error.response) {
      console.error("Détails de l'erreur:", error.response.data);
      errorMessage = error.response.data?.message || errorMessage;
      
      // Si c'est une erreur d'autorisation, afficher un message plus clair
      if (error.response.status === 403) {
        errorMessage = "Vous n'êtes pas autorisé à accéder à tous les rapports. Seuls les administrateurs peuvent voir tous les rapports.";
      } else if (error.response.status === 401) {
        errorMessage = "Session expirée. Veuillez vous reconnecter.";
      } else if (error.response.status === 500) {
        errorMessage = "Erreur serveur. Veuillez contacter l'administrateur.";
      }
    }
    
    return {
      status: 'error',
      message: error instanceof Error ? error.message : errorMessage,
      data: null
    };
  }
};

export const updateRapport = async (id: string, rapportData: any) => {
  try {
    const response = await api.put(`/rapports/${id}`, rapportData);
    return {
      status: 'success',
      data: response.data
    };
  } catch (error) {
    console.error(`Error updating rapport ${id}:`, error);
    return {
      status: 'error',
      message: error instanceof Error ? error.message : "Erreur lors de la mise à jour du rapport",
      data: null
    };
  }
};

export const deleteRapport = async (id: string) => {
  try {
    await api.delete(`/rapports/${id}`);
    return {
      status: 'success',
      message: 'Rapport supprimé avec succès'
    };
  } catch (error) {
    console.error(`Error deleting rapport ${id}:`, error);
    return {
      status: 'error',
      message: error instanceof Error ? error.message : "Erreur lors de la suppression du rapport"
    };
  }
};

export const getMedicamentsByRapport = async (rapportId: string) => {
  try {
    const response = await api.get(`/rapports/${rapportId}/medicaments`);
    return {
      status: 'success',
      data: response.data
    };
  } catch (error) {
    console.error(`Error fetching medicaments for rapport ${rapportId}:`, error);
    return {
      status: 'error',
      message: error instanceof Error ? error.message : "Erreur lors de la récupération des médicaments du rapport",
      data: []
    };
  }
};

export const addMedicamentOffert = async (rapportId: string, data: any) => {
  try {
    const response = await api.post(`/rapports/${rapportId}/medicaments`, data);
    return {
      status: 'success',
      data: response.data
    };
  } catch (error) {
    console.error(`Error adding medicament to rapport ${rapportId}:`, error);
    return {
      status: 'error',
      message: error instanceof Error ? error.message : "Erreur lors de l'ajout du médicament au rapport",
      data: null
    };
  }
};

// Users management
export const getAllUsers = async () => {
  try {
    const response = await api.get('/users');
    return {
      status: 'success',
      data: response.data
    };
  } catch (error) {
    console.error("Error fetching users:", error);
    return {
      status: 'error',
      message: error instanceof Error ? error.message : "Erreur lors de la récupération des utilisateurs",
      data: []
    };
  }
};

export const addUser = async (userData: any) => {
  try {
    const response = await api.post('/users', {
      ...userData,
      dateEmbauche: userData.dateEmbauche,
      username: userData.username,
    });
    return {
      status: 'success',
      data: response.data
    };
  } catch (error) {
    console.error("Error creating user:", error);
    return {
      status: 'error',
      message: error instanceof Error ? error.message : "Erreur lors de la création de l'utilisateur",
      data: null
    };
  }
};

export const updateUser = async (id: string, userData: any) => {
  try {
    const response = await api.put(`/users/${id}`, {
      ...userData,
      dateEmbauche: userData.dateEmbauche,
      username: userData.username,
    });
    return {
      status: 'success',
      data: response.data
    };
  } catch (error) {
    console.error(`Error updating user ${id}:`, error);
    return {
      status: 'error',
      message: error instanceof Error ? error.message : "Erreur lors de la mise à jour de l'utilisateur",
      data: null
    };
  }
};

export const deleteUser = async (id: string) => {
  try {
    await api.delete(`/users/${id}`);
    return {
      status: 'success',
      message: 'Utilisateur supprimé avec succès'
    };
  } catch (error) {
    console.error(`Error deleting user ${id}:`, error);
    return {
      status: 'error',
      message: error instanceof Error ? error.message : "Erreur lors de la suppression de l'utilisateur"
    };
  }
};

export default api; 