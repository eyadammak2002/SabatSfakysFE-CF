import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { catchError, Observable, tap, throwError } from 'rxjs';
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
  statut?: 'EN_COURS' | 'VALIDER' | 'COMMANDEE' | 'ANNULER' | 'LIVRER' | 'PAYER' | 'LIVRER_FR';

}


export interface Panier {
  id: number | null;
  clientId: number | null; // Peut être null pour les invités
  lignesPanier: LignePanier[];
  total: number;
  statut: string;
  adresseLivraison: string;
  dateCommande?: Date;
  modePaiement?: string;

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
    return this.http.post<any>(`${this.apiUrl2}/new/${userId}`, panier);
  }

  // Sauvegarder le panier invité
  private sauvegarderPanierInvite(): void {
    if (this.panier) {
      localStorage.setItem(this.guestCartKey, JSON.stringify(this.panier));
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

 // Méthode chargerPanierDepuisLocalStorage sécurisée contre les erreurs TypeScript
 public chargerPanierDepuisLocalStorage(): void {
  const clientId = this.getClientId();
  
  if (clientId) {
    // Si l'utilisateur est connecté, charger son panier
    const savedPanier = localStorage.getItem(`${this.storageKeyPrefix}${clientId}`);
    if (savedPanier) {
      this.panier = JSON.parse(savedPanier);
    } else {
      this.panier = null;
    }
    
    // ❌ SUPPRIMER CETTE LIGNE (fusion maintenant dans AuthenticationService)
    // this.fusionnerPanierInvite();
    
  } else {
    // Si aucun utilisateur n'est connecté, essayer de charger le panier invité
    const guestCart = localStorage.getItem(this.guestCartKey);
    
    if (guestCart) {
      try {
        const panierData = JSON.parse(guestCart);
        
        if (panierData && typeof panierData === 'object') {
          this.panier = {
            ...panierData,
            adresseLivraison: ''
          };
          
          localStorage.setItem(this.guestCartKey, JSON.stringify(this.panier));
        } else {
          this.panier = null;
        }
      } catch (error) {
        console.error('Erreur lors de l\'analyse du panier invité:', error);
        this.panier = null;
      }
    } else {
      this.panier = null;
    }
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
  if (!this.panier.statut) {
    this.panier.statut = 'EN_COURS';
  }
  
  // Sauvegarder immédiatement les modifications si c'est un panier invité
  if (!clientId && this.panier) {
    this.sauvegarderPanierDansLocalStorage();
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
  
  // Sauvegarder le panier
  public (): void {
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
    const clientId = this.getClientId();
    
    if (clientId) {
      // Utilisateur connecté - sauvegarder en base de données
      this.ajouterAuPanierConnecte(article, couleur, pointure, clientId);
    } else {
      // Utilisateur non connecté - sauvegarder en localStorage (code existant)
      this.ajouterAuPanierLocalStorage(article, couleur, pointure);
    }
  }
  private ajouterAuPanierConnecte(article: Article, couleur: Couleur, pointure: Pointure, clientId: number): void {
  const lignePanier = {
    article: { id: article.id },
    couleur: { id: couleur.id },
    pointure: { id: pointure.id },
    quantite: 1,
    prixUnitaire: article.prixVente,
    total: article.prixVente
  };

  this.ajouterLigneAuPanierEnCours(clientId, lignePanier).subscribe({
    next: (ligneSauvegardee) => {
      console.log('Ligne ajoutée en base de données:', ligneSauvegardee);
      
      // Mettre à jour le panier local pour la synchronisation
      this.synchroniserPanierDepuisDB(clientId);
      
      // Optionnel : afficher un message de succès
      // alert('Article ajouté au panier !');
    },
    error: (err) => {
      console.error('Erreur lors de l\'ajout en base:', err);
      const messageErreur = err.error?.message || err.error || "Erreur lors de l'ajout au panier.";
      alert(messageErreur);
    }
  });
}

// Méthode pour ajouter au panier local (utilisateurs non connectés)
private ajouterAuPanierLocalStorage(article: Article, couleur: Couleur, pointure: Pointure): void {
  if (!this.panier) return;

  const ligneExistante = this.panier.lignesPanier.find(lp =>
    lp.article.id === article.id && 
    lp.couleur.id === couleur.id && 
    lp.pointure.id === pointure.id
  );

  if (ligneExistante) {
    ligneExistante.quantite += 1;
    ligneExistante.total = ligneExistante.quantite * ligneExistante.prixUnitaire;
  } else {
    this.panier.lignesPanier.push({
      id: Date.now(), // ID temporaire pour le localStorage
      article,
      quantite: 1,
      prixUnitaire: article.prixVente,
      total: article.prixVente,
      couleur,
      pointure
    });
  }

  this.calculerTotal();
  this.sauvegarderPanierDansLocalStorage();
}

// Synchroniser le panier local avec la base de données
synchroniserPanierDepuisDB(userId: number): void {
  this.getPanierEnCoursFromDB(userId).subscribe({
    next: (panierDB) => {
      if (panierDB) {
        // Mettre à jour le panier local avec les données de la DB
        this.panier = {
          id: panierDB.id,
          clientId: userId,
          lignesPanier: panierDB.lignesPanier || [],
          total: panierDB.total,
          statut: panierDB.statut,
          adresseLivraison: panierDB.adresseLivraison || ''
        };
      } else {
        // Aucun panier en cours en DB, garder le panier local vide
        this.panier = {
          id: null,
          clientId: userId,
          lignesPanier: [],
          total: 0,
          statut: 'EN_COURS',
          adresseLivraison: ''
        };
      }
      
      // Sauvegarder aussi en localStorage pour la cohérence
      this.sauvegarderPanierDansLocalStorage();
    },
    error: (err) => {
      console.error('Erreur lors de la synchronisation:', err);
    }
  });
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

 // Ajouter une nouvelle méthode spécifique pour réinitialiser l'adresse de livraison
resetAdresseLivraison(): void {
  if (!this.panier) return;
  
  // Réinitialiser l'adresse de livraison
  this.panier.adresseLivraison = '';
  
  // Sauvegarder les changements
  this.sauvegarderPanierDansLocalStorage();
}

// Modifier la méthode validerPanier pour réinitialiser l'adresse après validation
validerPanier(panier: Panier): Observable<Panier> {
  if (!panier.id) {
    console.error('Le panier n\'a pas d\'ID');
  }
  
  // Appel à l'API pour valider le panier
  return this.http.put<Panier>(`${this.apiUrl2}/valider`, panier).pipe(
    tap(() => {
      // Après validation réussie, réinitialiser l'adresse de livraison
      this.resetAdresseLivraison();
    })
  );
}

// Modifier la méthode viderPanier dans PanierService pour réinitialiser l'adresse de livraison

// Méthode viderPanier modifiée
viderPanier(): void {
  if (!this.panier) return;

  // Vider le contenu du panier
  this.panier.lignesPanier = [];
  this.panier.total = 0;
  
  // Réinitialiser l'adresse de livraison
  this.panier.adresseLivraison = '';
  
  // Sauvegarder les changements dans le localStorage
  this.sauvegarderPanierDansLocalStorage();
  
  // Si c'est un panier invité, assurer que les modifications sont enregistrées
  if (!this.getClientId()) {
    localStorage.setItem(this.guestCartKey, JSON.stringify(this.panier));
  }
}
  // Récupérer les commandes validées d'un utilisateur
  getCommandesByUser(userId: number): Observable<Panier[]> {
    return this.http.get<Panier[]>(`${this.apiUrl2}/commandes/user/${userId}`);
  }

  getCommandesByFournisseur(userId: number): Observable<Panier[]> {
    return this.http.get<Panier[]>(`${this.apiUrl2}/commandes/fournisseur/${userId}`);
  }
  getCommandesByFournisseurCOMMANDEE(userId: number): Observable<Panier[]> {
    return this.http.get<Panier[]>(`${this.apiUrl2}/commandes/COMMANDEE/fournisseur/${userId}`);
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

  getDernierPanierClient(clientId: number) {
    return this.http.get<Panier>(`http://localhost:8080/panier/dernier/${clientId}`);
  }



  changerStatutEnLivrerFr(lignePanierIds: number[]): Observable<any> {
    return this.http.put(`http://localhost:8080/lignePanier/changerStatutLivrerFr`, lignePanierIds);
  }
  

  getFournisseurByEmail(email: string): Observable<any> {
    return this.http.get(`http://localhost:8080/fournisseur/email/${email}`);
  }

  // Dans panier.service.ts, ajoutez cette fonction
  updateModePaiement(panierId: number, modePaiement: string): Observable<Panier> {
    return this.http.put<Panier>(`${this.apiUrl2}/${panierId}/mode-paiement?modePaiement=${modePaiement}`, {});
  }

  getCouleurAndPointureFromLigne(ligneId: number): Observable<any> {
    return this.http.get(`http://localhost:8080/lignePanier/bindCouleurPointureByLigne/${ligneId}`);
  }

  getPanierEnCoursFromDB(userId: number): Observable<Panier | null> {
    return this.http.get<Panier | null>(`${this.apiUrl2}/enCours/${userId}`);
  }
  
  // Ajouter une ligne au panier en base de données
  ajouterLigneAuPanierEnCours(userId: number, lignePanier: any): Observable<LignePanier> {
    return this.http.post<LignePanier>(`${this.apiUrl2}/ajouterLigne/${userId}`, lignePanier);
  }

  modifierQuantiteLignePanier(lignePanierId: number, nouvelleQuantite: number): Observable<any> {
    const url = `${this.apiUrl2}/ligne-panier/${lignePanierId}/quantite`;
    
    const body = {
      quantite: nouvelleQuantite
    };
    
    console.log(`🔄 Appel API pour modifier quantité`);
    console.log(`📍 URL: ${url}`);
    console.log(`📝 Body:`, body);
    
    return this.http.put<any>(url, body).pipe(
      tap(response => {
        console.log('✅ Réponse API modification quantité:', response);
      }),
      catchError(error => {
        console.error('❌ Erreur API modification quantité:', error);
        return throwError(() => error);
      })
    );
  }
  
}