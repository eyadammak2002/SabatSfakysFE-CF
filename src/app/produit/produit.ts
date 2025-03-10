import { Couleur } from "./Couleur";
import { Genre } from "./Genre";
import { Statut } from "./Statut";
import { Tissu } from "./Tissu";

export interface Produit {
  id: number; // Primary Key (Auto-generated)
  ref: string; // Unique Reference
  name: string; // Product Name
  description: string; // Product Description
  qte: number; // Quantity
  prixFournisseur: number; // Supplier Price
  prixVente: number; // Selling Price
  couleur: Couleur; // Enum for color
  genre: Genre; // Enum for gender
  tissu: Tissu; // Enum for fabric type
  statut: Statut; // Enum for product status
}

