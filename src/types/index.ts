export interface User {
  id: string;
  username: string;
  nom: string;
  prenom: string;
  adresse: string;
  cp: string;
  ville: string;
  dateEmbauche: string;
  typeUtilisateur: 'visiteur' | 'administrateur';
}

export interface Medecin {
  id: string;
  nom: string;
  prenom: string;
  adresse: string;
  tel: string;
  specialitecomplementaire: string;
  departement: string;
}

export interface Famille {
  id: string;
  libelle: string;
}

export interface Medicament {
  id: string;
  nomCommercial: string;
  idFamille: string;
  composition: string;
  effets: string;
  contreIndications: string;
  famille?: Famille;
}

export interface Rapport {
  id: string;
  date: string;
  motif: string;
  bilan: string;
  idVisiteur: string;
  idMedecin: string;
  medecin?: Medecin;
  medicaments?: MedicamentOffert[];
}

export interface MedicamentOffert {
  idRapport: string;
  idMedicament: string;
  quantite: number;
  medicament?: Medicament;
}

export interface AuthState {
  user: User | null;
  isAuthenticated: boolean;
  isLoading: boolean;
  error: string | null;
} 