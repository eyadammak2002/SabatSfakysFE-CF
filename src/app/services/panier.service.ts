import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable, throwError } from 'rxjs';
import { TokenStorageService } from './token-storage.service';
import { Article, Couleur, Pointure } from '../article/article';
import { StockService } from '../panier/stock.service';
import { Router } from '@angular/router';

export interface LignePanier {
  id: number;
  article: Article;
  quantite: number;
  prixUnitaire: number;
  total: number;
  couleur: Couleur;
  pointure: Pointure;
}

export interface Panier {
  id: number | null;
  clientId: number | null; // Peut être null pour les invités
  lignesPanier: LignePanier[];
  total: number;
  statut: string;
  adresseLivraison: string;
  dateCommande?: Date;
}

@Injectable({
  providedIn: 'root'
})
export class PanierService {
  private apiUrl = 'http://localhost:8080/article';
  private apiUrl2 = 'http://localhost:8080/panier';
  private apiUrl3 = 'http://localhost:8080/lignePanier';
  
  private panier: Panier | null = null;
  private storageKeyPrefix = 'panier_';
  private guestCartKey = 'guest_cart'; // Clé pour le panier invité
  
  constructor(
    private http: HttpClient, 
    private tokenStorage: TokenStorageService,
    private stockService: StockService,
    private router: Router
  ) {
    this.chargerPanierDepuisLocalStorage();
  }

  // Créer un panier
  creerPanier(userId: number | null, panier: any): Observable<any> {
    // Si l'utilisateur n'est pas connecté, rediriger vers la page de login
    if (userId === null) {
      // Sauvegarder temporairement les détails du panier
      this.sauvegarderPanierInvite();
      
      // Rediriger vers la page de login
      this.router.navigate(['/auth/client/login'], { 
        queryParams: { returnUrl: '/panier' } 
      });
      
      return throwError(() => new Error('Non connecté'));
    }
    
    panier.statut = "EN_COURS"; 
    return this.http.post<any>(`${this.apiUrl2}/${userId}`, panier);
  }

  // Sauvegarder le panier invité
  private sauvegarderPanierInvite(): void {
    if (this.panier) {
      localStorage.setItem(this.guestCartKey, JSON.stringify(this.panier));
    }
  }

  // Récupérer et fusionner le panier invité après la connexion
  fusionnerPanierInvite(): void {
    const guestCart = localStorage.getItem(this.guestCartKey);
    
    if (guestCart) {
      const guestPanier: Panier = JSON.parse(guestCart);
      const clientId = this.getClientId();
      
      if (clientId) {
        // Créer un nouveau panier avec l'ID client
        if (!this.panier) {
          this.panier = {
            id: null,
            clientId,
            lignesPanier: [],
            total: 0,
            statut: 'EN_COURS',
            adresseLivraison: guestPanier.adresseLivraison || ''
          };
        } else {
          // Mettre à jour l'ID client et conserver l'adresse de livraison s'il y en a une
          this.panier.clientId = clientId;
          if (guestPanier.adresseLivraison && guestPanier.adresseLivraison.trim() !== '') {
            this.panier.adresseLivraison = guestPanier.adresseLivraison;
          }
        }
        
        // Ajouter les lignes du panier invité au panier client
        guestPanier.lignesPanier.forEach(ligne => {
          const ligneExistante = this.panier!.lignesPanier.find(lp =>
            lp.article.id === ligne.article.id && 
            lp.couleur.id === ligne.couleur.id && 
            lp.pointure.id === ligne.pointure.id
          );
          
          if (ligneExistante) {
            // Conserver la quantité la plus élevée entre les deux paniers
            ligneExistante.quantite += ligne.quantite;
            ligneExistante.total = ligneExistante.quantite * ligneExistante.prixUnitaire;
          } else {
            // Ajouter la ligne telle quelle, avec sa quantité originale
            this.panier!.lignesPanier.push({...ligne});
          }
        });
        
        // Recalculer le total du panier
        this.calculerTotal();
        
        // Sauvegarder le panier fusionné
        this.sauvegarderPanierDansLocalStorage();
        
        // Supprimer le panier invité
        localStorage.removeItem(this.guestCartKey);
      }
    }
  }

  // Calculer le total du panier
  private calculerTotal(): void {
    if (this.panier) {
      this.panier.total = this.panier.lignesPanier.reduce((sum, ligne) => 
        sum + (ligne.quantite * ligne.prixUnitaire), 0);
    }
  }

  // Obtenir l'ID du client connecté
  public getClientId(): number | null {
    const user = this.tokenStorage.getUser();
    return user && user.id ? user.id : null;
  }

  // Charger le panier depuis le stockage local
  public chargerPanierDepuisLocalStorage(): void {
    const clientId = this.getClientId();
    
    if (clientId) {
      // Si l'utilisateur est connecté, charger son panier
      const savedPanier = localStorage.getItem(`${this.storageKeyPrefix}${clientId}`);
      this.panier = savedPanier ? JSON.parse(savedPanier) : null;
      
      // Si l'utilisateur vient de se connecter, fusionner avec le panier invité
      this.fusionnerPanierInvite();
    } else {
      // Si aucun utilisateur n'est connecté, essayer de charger le panier invité
      const guestCart = localStorage.getItem(this.guestCartKey);
      this.panier = guestCart ? JSON.parse(guestCart) : null;
    }
    
    // Initialiser un panier vide si aucun n'a été trouvé
    if (!this.panier) {
      this.panier = {
        id: null,
        clientId: clientId,
        lignesPanier: [],
        total: 0,
        statut: 'EN_COURS',
        adresseLivraison: ''
      };
    }
    
    // Vérifier et corriger les valeurs manquantes
    if (!this.panier.adresseLivraison) {
      this.panier.adresseLivraison = '';
    }
    
    if (!this.panier.statut) {
      this.panier.statut = 'EN_COURS';
    }
  }
  
  // Sauvegarder le panier
  public sauvegarderPanierDansLocalStorage(): void {
    const clientId = this.getClientId();
    
    if (!this.panier) return;
    
    // Calculer automatiquement le total du panier
    this.calculerTotal();
    
    if (clientId) {
      // Sauvegarder dans le panier utilisateur
      localStorage.setItem(`${this.storageKeyPrefix}${clientId}`, JSON.stringify(this.panier));
    } else {
      // Sauvegarder comme panier invité
      localStorage.setItem(this.guestCartKey, JSON.stringify(this.panier));
    }
  }

  public getStorageKeyPrefix(): string {
    return this.storageKeyPrefix;
  }

  // Récupérer le panier
  getPanier(): Panier {
    if (!this.panier) {
      this.chargerPanierDepuisLocalStorage();
    }
    return this.panier!;
  }

  // Ajouter un article au panier
  ajouterAuPanier(article: Article, couleur: Couleur, pointure: Pointure): void {
    if (!this.panier) return;
  
    const ligneExistante = this.panier.lignesPanier.find(lp =>
      lp.article.id === article.id && 
      lp.couleur.id === couleur.id && 
      lp.pointure.id === pointure.id
    );
  
    if (ligneExistante) {
      // Si l'article existe déjà, augmenter la quantité de 1
      ligneExistante.quantite += 1;
      ligneExistante.total = ligneExistante.quantite * ligneExistante.prixUnitaire;
    } else {
      // Sinon, ajouter une nouvelle ligne avec quantité initiale à 1
      this.panier.lignesPanier.push({
        id: 1,
        article,
        quantite: 1, // Initialisation à 1
        prixUnitaire: article.prixVente,
        total: article.prixVente, // total = quantité (1) * prixUnitaire
        couleur,
        pointure
      });
    }
  
    // Mettre à jour le total du panier
    this.calculerTotal();
    
    // Sauvegarder le panier
    this.sauvegarderPanierDansLocalStorage();
  }

  getQteArticle(articleId: number): Observable<any> {
    return this.http.get<any>(`${this.apiUrl}/qte/${articleId}`);
  }

  // Modifier la quantité d'un article
  modifierQuantite(index: number, changement: number, articleId: number, couleurId: number, pointureId: number): void {
    // Utilisation de "!" pour garantir que panier et lignesPanier ne sont pas null ou undefined
    const ligne = this.panier!.lignesPanier[index];
    
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
          
          // Recalculer le total du panier
          this.calculerTotal();
          
          // Sauvegarder le panier
          this.sauvegarderPanierDansLocalStorage();
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
    
    // Recalculer le total
    this.calculerTotal();
    
    // Sauvegarder le panier
    this.sauvegarderPanierDansLocalStorage();
  }

  validerPanier(panier: Panier): Observable<Panier> {
    if (!panier.id) {
      console.error('Le panier n\'a pas d\'ID');
      // Vous pouvez soit lever une erreur, soit chercher l'ID du panier d'une autre façon
    }
    return this.http.put<Panier>(`${this.apiUrl2}/valider`, panier);
  }

  // Vider le panier après validation
  viderPanier(): void {
    if (!this.panier) return;

    this.panier.lignesPanier = [];
    this.panier.total = 0;
    this.sauvegarderPanierDansLocalStorage();
  }

  // Récupérer les commandes validées d'un utilisateur
  getCommandesByUser(userId: number): Observable<Panier[]> {
    return this.http.get<Panier[]>(`${this.apiUrl2}/commandes/user/${userId}`);
  }

  getArticleFromLignePanier(lignePanierId: number): Observable<Article> {
    return this.http.get<Article>(`${this.apiUrl3}/${lignePanierId}/article`);
  }

  annulerPanier(id: number): Observable<any> {
    return this.http.put(`${this.apiUrl2}/paniers/${id}/annuler`, {});
  }
  
  // Méthode pour vérifier si l'utilisateur est connecté avant de créer une commande
  verifierConnexionAvantCommande(): boolean {
    if (!this.getClientId()) {
      this.sauvegarderPanierInvite();
      this.router.navigate(['/auth/client/login'], { 
        queryParams: { returnUrl: '/panier' } 
      });
      return false;
    }
    return true;
  }
  
  // Méthode pour après la connexion
  mettreAJourClientId(clientId: number): void {
    if (this.panier) {
      this.panier.clientId = clientId;
      this.sauvegarderPanierDansLocalStorage();
    }
  }


  getLastPanierIdByUser(userId: number): Observable<number | null> {
    return this.http.get<number | null>(`${this.apiUrl}/lastId/${userId}`);
  }
  

  payerPanier(panierId: number): Observable<Panier> {
    return this.http.post<Panier>(`${this.apiUrl2}/${panierId}/payer`, {});
  }

  getPanierById(id: number): Observable<Panier> {
    return this.http.get<Panier>(`${this.apiUrl2}/${id}`);
  }
}