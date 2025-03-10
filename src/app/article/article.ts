import { Category } from "../category/category";
import { Photo } from "../photo/Photo";


export interface Article {
  id: number; // Optionnel car il est généré automatiquement
  ref: string;
  name: string;
  description: string;
  qte: number;
  prixFournisseur: number;
  prixVente: number;
  couleur: string;
  genre: string;
  tissu: string;
  statut: 'EN_ATTENTE' | 'ACCEPTE' | 'REFUSE';
  category: Category;
  photos: Photo[]; 
}
