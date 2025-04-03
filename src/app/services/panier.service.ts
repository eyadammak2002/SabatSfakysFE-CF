import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { TokenStorageService } from '../services/token-storage.service';
import { Article, Couleur, Pointure } from '../article/article';
import { StockService } from '../panier/stock.service';


export interface LignePanier {
  article: Article;
  quantite: number;
  prixUnitaire: number;
  total: number;
  couleur: Couleur;
  pointure: Pointure;
}

export interface Panier {
  id: number | null;
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
  private apiUrl2 = 'http://localhost:8080/panier'; 
  private panier: Panier | null = null;
  private storageKeyPrefix = 'panier_';

  constructor(private http: HttpClient, private tokenStorage: TokenStorageService,private stockService: StockService) {
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
          id: null, 
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
  ajouterAuPanier(article: Article, couleur: Couleur, pointure: Pointure): void {
    if (!this.panier) return;
  
    const ligneExistante = this.panier.lignesPanier.find(lp =>
      lp.article.id === article.id && 
      lp.couleur.id === couleur.id && // Use the ID or other unique property for comparison
      lp.pointure.id === pointure.id // Same for pointure
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
 // Modifier la quantité d'un article
 modifierQuantite(index: number, changement: number, articleId: number, couleurId: number, pointureId: number): void {
  // Utilisation de "!" pour garantir que panier et lignesPanier ne sont pas null ou undefined
  const ligne = this.panier!.lignesPanier[index];
  console.log("couleurId",couleurId);
  console.log("pointureId", pointureId);
  if (!couleurId || !pointureId) {
    console.error('couleurId ou pointureId est invalide');
    return; // Quittez la méthode si les identifiants sont invalides
  }
  // Appel à l'API pour récupérer la quantité disponible pour cette combinaison
  this.stockService.getStockQuantity(articleId, couleurId, pointureId).subscribe(qte => {
    console.log("Quantité actuelle dans le panier :", ligne.quantite);
    console.log("Stock disponible pour cette combinaison :", qte);

    if (ligne) {
      // Vérifie si le changement est possible en fonction du stock disponible
      if ((changement > 0 && ligne.quantite < qte) || changement < 0) {
        ligne.quantite += changement;

        // Si la quantité devient inférieure ou égale à zéro, on supprime l'article du panier
        if (ligne.quantite <= 0) {
          // Vérifie que l'index est valide avant de le supprimer
          if (index >= 0 && index < this.panier!.lignesPanier.length) {
            this.panier!.lignesPanier.splice(index, 1);
          }
        } else {
          // Mise à jour du total de la ligne en fonction de la nouvelle quantité
          ligne.total = ligne.quantite * ligne.prixUnitaire;
        }
      } else if (changement > 0) {
        alert("❌ Quantité maximale atteinte !");
      }
    }
  }, error => {
    console.error("Erreur lors de la récupération de la quantité du stock", error);
  });
}

  
  // Supprimer un article du panier
  supprimerDuPanier(index: number): void {
    if (!this.panier) return;

    this.panier.lignesPanier.splice(index, 1);
    this.sauvegarderPanierDansLocalStorage();
  }

 
  validerPanier(panier: Panier): Observable<Panier> {
    if (!panier.id) {
      console.error('Le panier n\'a pas d\'ID');
      // Vous pouvez soit lever une erreur, soit chercher l'ID du panier d'une autre façon
    }
    return this.http.put<Panier>(`${this.apiUrl2}/valider`, panier);
  }

  //  Vider le panier après validation
  viderPanier(): void {
    if (!this.panier) return;

    this.panier.lignesPanier = [];
    this.sauvegarderPanierDansLocalStorage();
  }
}
