import axios from 'axios';

// Base API URL for Laravel backend
const API_URL = process.env.REACT_APP_API_URL || 'http://127.0.0.1:8000/api';

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
    return config;
  },
  (error) => Promise.reject(error)
);

// Add response interceptor for error handling
api.interceptors.response.use(
  (response) => response,
  (error) => {
    // Handle 401 Unauthorized responses
    if (error.response && error.response.status === 401) {
      localStorage.removeItem('user');
      localStorage.removeItem('token');
      // Redirect to login if unauthorized
      window.location.href = '/login';
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
    const response = await api.get('/medecins', { params });
    
      return {
      status: 'success',
      data: response.data
    };
  } catch (error) {
    console.error("Error fetching medecins:", error);
    return {
      status: 'error',
      message: error instanceof Error ? error.message : "Erreur lors de la récupération des médecins",
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
    const response = await api.get('/medicaments', { params });
    
      return {
      status: 'success',
      data: response.data
    };
  } catch (error) {
    console.error("Error fetching medicaments:", error);
    return {
      status: 'error',
      message: error instanceof Error ? error.message : "Erreur lors de la récupération des médicaments",
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

// Rapports
export const getRapportsByVisiteur = async (visiteurId: string) => {
  try {
    const response = await api.get(`/visiteurs/${visiteurId}/rapports`);
    return {
      status: 'success',
      data: response.data
    };
  } catch (error) {
    console.error(`Error fetching rapports for visiteur ${visiteurId}:`, error);
    return {
      status: 'error',
      message: error instanceof Error ? error.message : "Erreur lors de la récupération des rapports",
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
    const response = await api.post('/users', userData);
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
    const response = await api.put(`/users/${id}`, userData);
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