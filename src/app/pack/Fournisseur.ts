import { Photo } from "../photo/Photo";

export interface Fournisseur {
    id: number;
    nom: string;
    email: string;
    adresse: string;
    telephone: string;
    motDePasse: string;
    statut: 'EN_ATTENTE' | 'ACCEPTE' | 'REFUSE';
    logo:Photo
  }
  