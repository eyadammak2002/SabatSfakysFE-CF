import { Category } from "../category/category";
import { Fournisseur } from "../pack/Fournisseur";
import { Photo } from "../photo/Photo";

// Interface pour StockArticle
export interface Stock {
  id: number;
  couleur: Couleur;
  pointure: Pointure;
  quantite: number;
  
}

export interface Couleur {
  id: number;
  nom: string;
}

export interface Pointure {
  id: number;
  taille: number;
}

export interface Article {
  id: number;
  ref: string;
  name: string;
  description: string;
  prixFournisseur: number;
  prixVente: number;
  genre: string;
  tissu: string;
  statut: 'EN_ATTENTE' | 'ACCEPTE' | 'REFUSE';
  category: Category | null;
  photos: Photo[]; 
  fournisseur: Fournisseur; 
  stocks: Stock[];// Liste des stocks associés

}
