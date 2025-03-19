import { Category } from "../category/category";
import { Fournisseur } from "../pack/Fournisseur";
import { Photo } from "../photo/Photo";


export interface Article {
  id: number; // Optionnel car il est généré automatiquement
  ref: string;
  name: string;
  description: string;
  qte: number;
  prixFournisseur: number;
  prixVente: number;
  couleurs: string[];  // ✅ Liste des couleurs sélectionnées
  pointures: string[]; 
  genre: string;
  tissu: string;
  statut: 'EN_ATTENTE' | 'ACCEPTE' | 'REFUSE';
  category: Category | null;
  photos: Photo[]; 
  fournisseur: Fournisseur; 
}
