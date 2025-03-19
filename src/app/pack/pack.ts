

import { Article } from '../article/article'; // Importing Article model

export interface Pack {
  id?: number;  // ID is optional for new packs
  name: string;
 // fournisseurId: number; // Assuming each pack belongs to a fournisseur
  articles: Article[];  // List of selected articles
}