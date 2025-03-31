import axios from 'axios';

// Use IP address directly to avoid HTTPS-Only Mode issues in Firefox
const API_URL = 'http://192.168.1.128/gsbrapport';

const api = axios.create({
  baseURL: API_URL,
  headers: {
    'Content-Type': 'application/json',
    'Accept': 'application/json'
  },
  // Avoid CORS preflight requests when possible
  withCredentials: false,
  // Increase timeout for potentially slow connections
  timeout: 10000
});

// Authentification
export const login = async (username: string, password: string) => {
  try {
    console.log(`Attempting login with username: ${username} to ${API_URL}`);
    
    // Use axios directly with error handling
    const response = await api.get(`/index.php`, {
      params: {
        username,
        password
      }
    });
    
    console.log("API login response:", response);
    
    // Check if we have data
    if (response.data) {
      console.log("Login response data:", response.data);
      
      // Vérifier que l'authentification est réussie
      if (response.data.status === "success" && response.data.auth === true) {
        // Stocker les informations de l'utilisateur
        localStorage.setItem("user", JSON.stringify(response.data.data[0]));
        return {
          status: 'success',
          data: response.data.data[0]
        };
      } else {
        console.error("Authentication failed:", response.data);
        throw new Error(response.data.message || "Identifiants incorrects");
      }
    } else {
      console.error("Empty response received");
      throw new Error("Réponse vide du serveur");
    }
  } catch (error) {
    console.error("Erreur lors de la connexion:", error);
    
    // Formatted error message for better user experience
    let errorMessage = "Erreur lors de la connexion";
    
    if (error.response) {
      // The request was made and the server responded with a status code
      // that falls out of the range of 2xx
      console.error("Error response data:", error.response.data);
      console.error("Error response status:", error.response.status);
      errorMessage = `Erreur serveur: ${error.response.status}`;
    } else if (error.request) {
      // The request was made but no response was received
      console.error("Error request:", error.request);
      errorMessage = "Aucune réponse du serveur. Vérifiez votre connexion internet.";
    } else {
      // Something happened in setting up the request that triggered an Error
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
    // Si l'API n'a pas d'endpoint de déconnexion, nous retournons simplement un succès
    // Dans un cas réel, nous ferions un appel à l'API pour invalider le token
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

// Médecins
export const getAllMedecins = async (search: string = '') => {
  console.log(`Calling API to get medecins with search: ${search}`);
  
  try {
    // Based on the PHP backend code, the correct endpoint is 'noms'
    // If no value is provided, it returns all doctors
    const response = await api.get(`/index.php?noms=${encodeURIComponent(search)}`);
    
    // Format the response for consistency
    if (response.data) {
      // Check if it's already formatted correctly
      if (response.data.status && response.data.data) {
        return response;
      }
      
      // If it's just the raw data, format it
      return {
        ...response,
        data: {
          status: "success",
          data: Array.isArray(response.data) ? response.data : [response.data]
        }
      };
    }
    
    return response;
  } catch (error) {
    console.error("Error fetching medecins:", error);
    // Return an empty result in the expected format
    return {
      data: {
        status: "error",
        data: [],
        message: error instanceof Error ? error.message : "Erreur inconnue"
      }
    };
  }
};

export const getMedecinById = (id: string) => {
  return api.get(`/index.php?id=${encodeURIComponent(id)}`);
};

export const updateMedecin = (id: string, adresse: string, tel: string, speComplementaire: string) => {
  return api.get(`/index.php?id2=${encodeURIComponent(id)}&adresse=${encodeURIComponent(adresse)}&tel=${encodeURIComponent(tel)}&speComplementaire=${encodeURIComponent(speComplementaire)}`);
};

export const addMedecin = (nom: string, prenom: string, adresse: string, tel: string, specialite: string, departement: string) => {
  const formData = new FormData();
  formData.append('nom', nom);
  formData.append('prenom', prenom);
  formData.append('adresse', adresse);
  formData.append('tel', tel);
  formData.append('specialite', specialite);
  formData.append('departement', departement);
  
  return api.post('/index.php?addMedecin=1', formData);
};

// Médicaments
export const getAllMedicaments = async (search: string = '') => {
  console.log(`Calling API to get medicaments with search: ${search}`);
  
  try {
    // Based on the PHP backend code, the correct endpoint is 'nomMed'
    const response = await api.get(`/index.php?nomMed=${encodeURIComponent(search)}`);
    
    // Format the response for consistency
    if (response.data) {
      // Check if it's already formatted correctly
      if (response.data.status && response.data.data) {
        return response;
      }
      
      // If it's just the raw data, format it
      return {
        ...response,
        data: {
          status: "success",
          data: Array.isArray(response.data) ? response.data : [response.data]
        }
      };
    }
    
    return response;
  } catch (error) {
    console.error("Error fetching medicaments:", error);
    // Return an empty result in the expected format
    return {
      data: {
        status: "error",
        data: [],
        message: error instanceof Error ? error.message : "Erreur inconnue"
      }
    };
  }
};

export const getMedicamentById = (id: string) => {
  return api.get(`/index.php?idMed=${encodeURIComponent(id)}`);
};

export const updateMedicament = (id: string, composition: string, effets: string, contreIndications: string) => {
  return api.get(`/index.php?idMed2=${encodeURIComponent(id)}&composition=${encodeURIComponent(composition)}&effets=${encodeURIComponent(effets)}&contreIndications=${encodeURIComponent(contreIndications)}`);
};

export const addMedicament = (id: string, nom: string, idFam: string, composition: string, effets: string, contreIndications: string) => {
  return api.get(`/index.php?idMed4=${encodeURIComponent(id)}&nom=${encodeURIComponent(nom)}&Fam=${encodeURIComponent(idFam)}&composition=${encodeURIComponent(composition)}&effets=${encodeURIComponent(effets)}&contreIndications=${encodeURIComponent(contreIndications)}`);
};

export const getAllFamilles = (search: string = '') => {
  return api.get(`/index.php?getFams=${encodeURIComponent(search)}`);
};

// Rapports
export const getRapportsByVisiteur = (visiteurId: string) => {
  console.log(`Calling API to get reports for visitor: ${visiteurId}`);
  // Try both formats that could exist in the API
  return api.get(`/index.php?idForAllRapportVisiteur=${encodeURIComponent(visiteurId)}`);
};

export const getRapportById = (id: string) => {
  return api.get(`/index.php?id6=${encodeURIComponent(id)}`);
};

export const getMedicamentsByRapport = (rapportId: string) => {
  return api.get(`/index.php?idRapportForMedicamentDetails=${encodeURIComponent(rapportId)}`);
};

export const addRapport = (date: string, motif: string, bilan: string, idVisiteur: string, idMedecin: string) => {
  const formData = new FormData();
  formData.append('date', date);
  formData.append('motif', motif);
  formData.append('bilan', bilan);
  formData.append('idVisiteur', idVisiteur);
  formData.append('idMedecin', idMedecin);
  
  return api.post('/index.php?addRapport=1', formData);
};

export const updateRapport = (id: string, date: string, motif: string, bilan: string, idMedecin: string) => {
  return api.get(`/index.php?idRapport3=${encodeURIComponent(id)}&date=${encodeURIComponent(date)}&motif=${encodeURIComponent(motif)}&bilan=${encodeURIComponent(bilan)}&idMedecin=${encodeURIComponent(idMedecin)}`);
};

export const deleteRapport = (id: string) => {
  return api.get(`/index.php?deleteRapport=${encodeURIComponent(id)}`);
};

export const addMedicamentOffert = (idRapport: string, idMedicament: string, quantite: string) => {
  const formData = new FormData();
  formData.append('idRapport2', idRapport);
  formData.append('idMedicament', idMedicament);
  formData.append('quantite', quantite);
  
  return api.post('/index.php?addOffrir=1', formData);
};

// Users
export const getAllUsers = () => {
  return api.get('/index.php?getUsers=1');
};

export const addUser = (userData: {
  nom: string;
  prenom: string;
  email: string;
  adresse: string;
  cp: string;
  ville: string;
  date_embauche: string;
  type_utilisateur: string;
  login: string;
  password: string;
}) => {
  const formData = new FormData();
  Object.entries(userData).forEach(([key, value]) => {
    formData.append(key, String(value));
  });
  
  return api.post('/index.php?addUser=1', formData);
};

export const updateUser = (id: string, userData: any) => {
  const formData = new FormData();
  formData.append('id', id);
  
  Object.entries(userData).forEach(([key, value]) => {
    formData.append(key, String(value));
  });
  
  return api.post('/index.php?updateUser=1', formData);
};

export const deleteUser = (id: string) => {
  return api.get(`/index.php?deleteUser=${encodeURIComponent(id)}`);
};

export default api; 