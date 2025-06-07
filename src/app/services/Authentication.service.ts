import { Injectable } from '@angular/core';
import { HttpClient, HttpHeaders } from '@angular/common/http';
import { Observable } from 'rxjs';
import { tap } from 'rxjs/operators';
import { Photo } from '../photo/Photo';
import { TokenRequest } from '../authentication/TokenRequest';
import { TokenStorageService } from './token-storage.service';
import { PanierService } from './panier.service';
import { Router, ActivatedRoute } from '@angular/router';

// Interface pour typer la réponse de l'API
interface AuthResponse {
  accessToken?: string;
  id?: number;
  username?: string;
  email?: string;
  role: string;
  role2: string;
  // autres propriétés que votre API pourrait renvoyer
}

const AUTH_API = 'http://localhost:8080/api/auth/';

const httpOptions = {
  headers: new HttpHeaders({ 'Content-Type': 'application/json' })
};

@Injectable({
  providedIn: 'root'
})
export class AuthenticationService {
  constructor(
    private http: HttpClient, 
    private tokenStorage: TokenStorageService,
    private panierService: PanierService,
    
    private router: Router,
    private route: ActivatedRoute
  ) {}

  loginWithGoogle(tokenRequest: TokenRequest): Observable<any> {
    console.log(tokenRequest, "token service");
    return this.http.post<AuthResponse>(AUTH_API + 'google', tokenRequest, httpOptions).pipe(
      tap(data => {
        if (data?.accessToken) {
          this.tokenStorage.saveToken(data.accessToken);
          this.tokenStorage.saveUser(data);
          
          console.log('✅ Connexion Google réussie pour utilisateur:', data.id);
          
          // ✅ NOUVELLE LOGIQUE DE FUSION
          if (typeof data.id === 'number' && data.id > 0) {
            const userId: number = data.id;
            const userEmail: string = data.email ?? '';
            
            setTimeout(() => {
              this.verifierEtFusionnerPaniers(userId, userEmail);
            }, 500);
          } else {
            console.error('❌ ID utilisateur invalide:', data.id);
          }
          
          // Vérifier s'il y a une URL de retour
          this.route.queryParams.subscribe(params => {
            const returnUrl = params['returnUrl'];
            if (returnUrl) {
              this.router.navigateByUrl(returnUrl);
            }
          });
        }
      })
    );
  }
  
  loginFournisseur(username: string, password: string): Observable<any> {
    return this.http.post<AuthResponse>(AUTH_API + 'signinFR', {
      username,
      password
    }, httpOptions).pipe(
      tap(data => {
        if (data?.accessToken) {
          this.tokenStorage.saveToken(data.accessToken);
          this.tokenStorage.saveUser(data);
          
          console.log('✅ Connexion Fournisseur réussie pour utilisateur:', data.id);
          
          // ✅ NOUVELLE LOGIQUE DE FUSION
          if (typeof data.id === 'number' && data.id > 0) {
            const userId: number = data.id;
            const userEmail: string = data.email ?? '';
            
            setTimeout(() => {
              this.verifierEtFusionnerPaniers(userId, userEmail);
            }, 500);
          } else {
            console.error('❌ ID utilisateur invalide:', data.id);
          }
        }
      })
    );
  }
  
loginClient(username: string, password: string): Observable<any> {
  return this.http.post<AuthResponse>(AUTH_API + 'signinCLIENT', {
    username,
    password
  }, httpOptions).pipe(
    tap(data => {
      if (data.accessToken) {
        this.tokenStorage.saveToken(data.accessToken);
        this.tokenStorage.saveUser(data);
        
        console.log('✅ Connexion Client réussie pour utilisateur:', data.id);
        
        // ✅ NOUVELLE LOGIQUE DE FUSION (déjà présente)
        if (data.id) {
          setTimeout(() => {
            this.verifierEtFusionnerPaniers(data.id!, data.email || '');
          }, 500);
        }
        
        // Gestion URL de retour
        this.route.queryParams.subscribe(params => {
          const returnUrl = params['returnUrl'];
          if (returnUrl) {
            this.router.navigateByUrl(returnUrl);
          }
        });
      }
    })
  );
}



  register(username: string, email: string, password: string, adresse: string, telephone: string, sexe: string): Observable<any> {
    return this.http.post(AUTH_API + 'signup', {
      username,
      email,
      password,
      adresse,
      telephone,
      sexe,
    }, httpOptions);
  }

  registerFournisseur(username: string, email: string, password: string, adresse: string, logo: Photo, telephone: string, numeroIdentificationEntreprise: string, materiauxUtilises: string, methodesProduction: string, programmeRecyclage: string, transportLogistiqueVerte: string, initiativesSociales: string, scoreEcologique: number): Observable<any> {
    return this.http.post(AUTH_API + 'signup', {
      username,
      email,
      password,
      adresse,
      telephone,
      logo,
      numeroIdentificationEntreprise,
      materiauxUtilises,
      methodesProduction,
      programmeRecyclage,
      transportLogistiqueVerte,
      initiativesSociales,
      scoreEcologique,
      statut: "EN_ATTENTE",
      role: "ROLE_FOURNISSEUR",
    }, httpOptions);
  }


  // 🆕 MÉTHODE - Vérifier et fusionner les paniers
  private verifierEtFusionnerPaniers(userId: number, userEmail: string): void {
    console.log('🔍 Vérification fusion panier pour utilisateur:', userId);
    
    const guestCart = localStorage.getItem('guest_cart');
    
    if (guestCart) {
      try {
        const guestPanier = JSON.parse(guestCart);
        
        if (guestPanier && guestPanier.lignesPanier && guestPanier.lignesPanier.length > 0) {
          console.log('🛒 Panier invité détecté avec', guestPanier.lignesPanier.length, 'articles');
          console.log('📦 Contenu panier invité:', guestPanier);
          this.afficherDialogueFusionPanier(guestPanier, userId, userEmail);
        } else {
          console.log('📭 Panier invité vide, pas de fusion nécessaire');
        }
      } catch (error) {
        console.error('❌ Erreur analyse panier invité:', error);
        localStorage.removeItem('guest_cart');
      }
    } else {
      console.log('📭 Aucun panier invité trouvé');
    }
  }

  // 🆕 MÉTHODE - Dialogue de fusion
  private afficherDialogueFusionPanier(guestPanier: any, userId: number, userEmail: string): void {
    let messageDetails = "🛒 Vous avez des articles dans votre panier :\n\n";
    
    guestPanier.lignesPanier.forEach((ligne: any, index: number) => {
      messageDetails += `${index + 1}. ${ligne.article.name}\n`;
      messageDetails += `   📏 Pointure: ${ligne.pointure.taille}\n`;
      messageDetails += `   🎨 Couleur: ${ligne.couleur.nom}\n`;
      messageDetails += `   📦 Quantité: ${ligne.quantite}\n`;
      messageDetails += `   💰 Prix: ${(ligne.quantite * ligne.article.prixVente).toFixed(2)} DT\n\n`;
    });
    
    messageDetails += "\n❓ Voulez-vous ajouter ces articles à votre panier connecté ?";
    messageDetails += "\n\n✅ OUI = Ajouter ces articles";
    messageDetails += "\n❌ NON = Supprimer et garder uniquement votre panier connecté";
    
    const confirmation = confirm(messageDetails);
    
    if (confirmation) {
      console.log('✅ Utilisateur accepte la fusion');
      this.procederFusionPanier(guestPanier, userId, userEmail);
    } else {
      console.log('❌ Utilisateur refuse la fusion');
      this.supprimerPanierInvite();
    }
  }

  // 🆕 MÉTHODE - Procéder à la fusion
  private procederFusionPanier(guestPanier: any, userId: number, userEmail: string): void {
    console.log('🔄 Début fusion panier pour utilisateur:', userId);
    
    let operationsTerminees = 0;
    let articlesAjoutes = 0;
    let erreurs = 0;
    const totalArticles = guestPanier.lignesPanier.length;
    
    guestPanier.lignesPanier.forEach((ligneInvite: any) => {
      const ligneData = {
        article: { id: ligneInvite.article.id },
        couleur: { id: ligneInvite.couleur.id },
        pointure: { id: ligneInvite.pointure.id },
        quantite: ligneInvite.quantite,
        prixUnitaire: ligneInvite.article.prixVente,
        total: ligneInvite.quantite * ligneInvite.article.prixVente
      };
      
      console.log(`➕ Ajout article: ${ligneInvite.article.name}`, ligneData);
      
      this.panierService.ajouterLigneAuPanierEnCours(userId, ligneData).subscribe({
        next: (response) => {
          operationsTerminees++;
          articlesAjoutes++;
          console.log(`✅ Article ajouté: ${ligneInvite.article.name}`);
          
          if (operationsTerminees === totalArticles) {
            this.finaliserFusion(articlesAjoutes, erreurs);
          }
        },
        error: (error) => {
          operationsTerminees++;
          erreurs++;
          console.error(`❌ Erreur ajout ${ligneInvite.article.name}:`, error);
          
          if (operationsTerminees === totalArticles) {
            this.finaliserFusion(articlesAjoutes, erreurs);
          }
        }
      });
    });
  }

  // 🆕 MÉTHODE - Finaliser la fusion
  private finaliserFusion(articlesAjoutes: number, erreurs: number): void {
    console.log('✅ Fusion terminée');
    
    localStorage.removeItem('guest_cart');
    
    if (erreurs === 0) {
      alert(`🎉 Fusion réussie !\n\n✅ ${articlesAjoutes} articles ajoutés à votre panier.\n\nVous pouvez consulter votre panier mis à jour.`);
    } else {
      alert(`⚠️ Fusion partielle\n\n✅ ${articlesAjoutes} articles ajoutés\n❌ ${erreurs} erreurs\n\nConsultez votre panier pour vérifier.`);
    }
  }

  // 🆕 MÉTHODE - Supprimer panier invité
  private supprimerPanierInvite(): void {
    localStorage.removeItem('guest_cart');
    console.log('🗑️ Panier invité supprimé');
    alert('✅ Panier temporaire supprimé.\nVotre panier connecté reste inchangé.');
  }
}