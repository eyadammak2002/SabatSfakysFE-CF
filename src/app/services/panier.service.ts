import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { TokenStorageService } from '../services/token-storage.service';
import { Article } from '../article/article';

export interface LignePanier {
  article: Article;
  quantite: number;
  prixUnitaire: number;
  total: number;
  couleur: string;
  pointure: string;
}

export interface Panier {
  clientId: number;
  lignesPanier: LignePanier[];
  total: number;
  statut: string; // Ajout du statut
  adresseLivraison: string; // Ajout de l'adresse de livraison
}

//  API URL
@Injectable({
  providedIn: 'root'
})
export class PanierService {
  private apiUrl = 'http://localhost:8080/article'; 
  private panier: Panier | null = null;
  private storageKeyPrefix = 'panier_';

  constructor(private http: HttpClient, private tokenStorage: TokenStorageService) {
    this.chargerPanierDepuisLocalStorage();
  }


  // Créer un panier
  creerPanier(userId: number, panier: any): Observable<any> {
    panier.statut = "EN_COURS"; 
    return this.http.post<any>(`http://localhost:8080/panier/${userId}`, panier);
  }

  // Exemple d'une méthode dans le service pour réduire le stock
  updateStock(articleId: number, quantite: number): Observable<any> {
    // Ici, il faudrait appeler l'API qui met à jour le stock de l'article dans la base de données
    return this.http.patch(`http://localhost:8080/article/update-stock/${articleId}`, { quantite });
  }



  //  Obtenir l'ID du client connecté
  private getClientId(): number | null {
    const user = this.tokenStorage.getUser();
    return user ? user.id : null;
  }

  //  Charger le panier depuis le stockage local
  public chargerPanierDepuisLocalStorage(): void {
    const clientId = this.getClientId();
    if (!clientId) {
        console.warn("⚠️ Aucun client connecté !");
        return;
    }
  
    // Charger les données du localStorage
    const savedPanier = localStorage.getItem(`${this.storageKeyPrefix}${clientId}`);
    this.panier = savedPanier ? JSON.parse(savedPanier) : null;
  
    // Vérifier si le panier est null ou non valide, et le réinitialiser si nécessaire
    if (!this.panier) {
        console.warn("⚠️ Panier introuvable, création d'un nouveau panier !");
        this.panier = {
            clientId, 
            lignesPanier: [], 
            total: 0, 
            statut: 'EN_COURS', 
            adresseLivraison: '' 
        };
    } else {
        // Vérifier et corriger les valeurs manquantes
        if (!this.panier.adresseLivraison || this.panier.adresseLivraison.trim() === '') {
            console.warn("⚠️ Adresse de livraison absente, réinitialisation !");
            this.panier.adresseLivraison = ''; 
        }
  
        if (!this.panier.statut) {
            console.warn("⚠️ Statut absent, réinitialisation !");
            this.panier.statut = 'EN_COURS';
        }
    }
  }
  

  
  // Sauvegarder le panier
  public sauvegarderPanierDansLocalStorage(): void {
    const clientId = this.getClientId();
    if (!clientId || !this.panier) return;

    // Calcul automatique du total du panier
    this.panier.total = this.panier.lignesPanier.reduce((sum, ligne) => sum + ligne.total, 0);

    localStorage.setItem(`${this.storageKeyPrefix}${clientId}`, JSON.stringify(this.panier));
  }

  public getStorageKeyPrefix(): string {
    return this.storageKeyPrefix;
  }
  

  //Récupérer le panier
  getPanier(): Panier {
    if (!this.panier) {
      this.chargerPanierDepuisLocalStorage();
    }
    return this.panier!;
  }
   


  //  Ajouter un article au panier
  ajouterAuPanier(article: Article, couleur: string, pointure: string): void {
    if (!this.panier) return;

    const ligneExistante = this.panier.lignesPanier.find(lp =>
      lp.article.id === article.id && lp.couleur === couleur && lp.pointure === pointure
    );

    if (ligneExistante) {
      ligneExistante.quantite += 1;
      ligneExistante.total = ligneExistante.quantite * ligneExistante.prixUnitaire;
    } else {
      this.panier.lignesPanier.push({
        article,
        quantite: 1,
        prixUnitaire: article.prixVente,
        total: article.prixVente,
        couleur,
        pointure
      });
    }

    this.sauvegarderPanierDansLocalStorage();
  }

 getQteArticle(articleId:number):Observable<any> {
    return this.http.get<any>(`${this.apiUrl}/qte/${articleId}`);
  }
  // Modifier la quantité d'un article
  modifierQuantite(index: number, changement: number, articleId: number, mapArticle: any): void {
    if (!this.panier) return;
  
    const ligne = this.panier.lignesPanier[index];
    const qte = mapArticle.get(articleId);
  
    if (ligne) {
      console.log("Quantité actuelle :", ligne.quantite);
      console.log("Stock disponible :", qte);
  
      if ((changement > 0 && ligne.quantite < qte) || changement < 0) {
        ligne.quantite += changement;
  
        if (ligne.quantite <= 0) {
          this.panier.lignesPanier.splice(index, 1);
        } else {
          ligne.total = ligne.quantite * ligne.prixUnitaire;
        }
      } else if (changement > 0) {
        alert("❌ Quantité maximale atteinte !");
      }
    }
  }
  
  // Supprimer un article du panier
  supprimerDuPanier(index: number): void {
    if (!this.panier) return;

    this.panier.lignesPanier.splice(index, 1);
    this.sauvegarderPanierDansLocalStorage();
  }

 
  

  //  Vider le panier après validation
  viderPanier(): void {
    if (!this.panier) return;

    this.panier.lignesPanier = [];
    this.sauvegarderPanierDansLocalStorage();
  }
}
