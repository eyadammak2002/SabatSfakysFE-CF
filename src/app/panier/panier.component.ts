import { Component, OnInit } from '@angular/core';
import { Router } from '@angular/router';
import { LignePanier, Panier, PanierService } from '../services/panier.service';
import { TokenStorageService } from '../services/token-storage.service';
import { StockService } from './stock.service';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { ClientService } from '../services/client.service';

//solution pour error de polyfills car j'ai pas
declare var bootstrap: any;

@Component({
  selector: 'app-panier',
  standalone: true,
  imports: [FormsModule, CommonModule],
  templateUrl: './panier.component.html',
  styleUrls: ['./panier.component.css']
})
export class PanierComponent implements OnInit {
  
  stockDisponible: Map<string, number> = new Map();
  
  // 🆕 NOUVEAU CHAMP POUR GÉRER L'ÉTAT DE CHARGEMENT
  isLoading: boolean = false;
  
  // ✅ INITIALISER LE PANIER AVEC UNE STRUCTURE PAR DÉFAUT
  panier: any = {
    id: null,
    clientId: null,
    lignesPanier: [],
    total: 0,
    statut: 'EN_COURS',
    adresseLivraison: ''
  };
  
  clientId: number | null = null;
  adresseLivraison: string = ''; 
  
  // Nouvelles propriétés pour la gestion du téléphone
  telephone: string = '';
  telephoneOriginal: string = '';
  telephoneModifie: boolean = false;
  telephoneValide: boolean = true;
  clientData: any = null; // Pour stocker les données complètes du client
  private panierInviteTemp: any = null;

  constructor(
    private panierService: PanierService,
    private router: Router,
    private tokenStorage: TokenStorageService,
    private stockService: StockService,
    private clientService: ClientService // Injection du ClientService
  ) {
    // ✅ S'assurer que le panier est initialisé dès le constructeur
    this.initialiserPanierVide();
  }

  // 🆕 MÉTHODE POUR INITIALISER UN PANIER VIDE
  private initialiserPanierVide(): void {
    this.panier = {
      id: null,
      clientId: null,
      lignesPanier: [],
      total: 0,
      statut: 'EN_COURS',
      adresseLivraison: ''
    };
    console.log('✅ Panier initialisé:', this.panier);
  }

  ngOnInit(): void {
    // 🔄 DÉBUT DU CHARGEMENT
    this.isLoading = true;
    console.log('🔄 Début du chargement - isLoading:', this.isLoading);
    
    // ✅ Double sécurité - vérifier l'initialisation
    if (!this.panier || !this.panier.lignesPanier) {
      this.initialiserPanierVide();
    }
    
    // Vérifier si l'utilisateur est connecté
    const user = this.tokenStorage.getUser();
    
    if (user && user.id) {
      // Utilisateur connecté - récupérer le panier en cours depuis la base de données
      console.log('🔍 Utilisateur connecté détecté, ID:', user.id);
      this.chargerPanierEnCoursDepuisDB(user.id);
    } else {
      // Utilisateur non connecté - charger depuis localStorage
      console.log('👤 Utilisateur non connecté, chargement depuis localStorage');
      this.chargerPanierClient();
      // 🔄 FIN DU CHARGEMENT POUR LE CAS NON CONNECTÉ
      this.isLoading = false;
      console.log('✅ Chargement terminé - isLoading:', this.isLoading);
    }
    
    this.chargerTelephoneClient();

    // Récupérer l'adresse de livraison stockée dans localStorage
    const adresseSauvegardee = localStorage.getItem('adresseLivraison');
    if (adresseSauvegardee) {
      this.adresseLivraison = adresseSauvegardee;
    }
  }

  // 🔄 MÉTHODE CORRIGÉE POUR CHARGER LES DÉTAILS AVEC VOS MÉTHODES EXISTANTES
  private async chargerDetailsAvecMethodesExistantes(panier: any): Promise<any> {
    console.log('🔄 Chargement des détails avec les méthodes existantes...');
    
    for (let i = 0; i < panier.lignesPanier.length; i++) {
      const ligne: any = panier.lignesPanier[i];  // ✅ Typage explicite
      const ligneId: number = ligne.id;
      
      console.log(`🔍 Traitement ligne ${i + 1} - ID: ${ligneId}`);
      
      try {
        // ✅ 1. CHARGER L'ARTICLE avec getArticleFromLignePanier (CORRECTION DU NOM)
        console.log(`📦 Chargement article pour ligne ${ligneId}...`);
        const articleComplet: any = await this.panierService.getArticleFromLignePanier(ligneId).toPromise();
        
        if (articleComplet) {
          ligne.article = articleComplet;
          console.log(`✅ Article chargé pour ligne ${ligneId}:`, {
            nom: articleComplet.name,
            ref: articleComplet.ref,
            prix: articleComplet.prixVente,
            photosLength: articleComplet.photos?.length || 0,
            hasPhotos: !!(articleComplet.photos && articleComplet.photos.length > 0)
          });
          
          // 🖼️ LOG SPÉCIAL POUR LES PHOTOS
          if (articleComplet.photos && articleComplet.photos.length > 0) {
            console.log(`📸 Photos trouvées pour ${articleComplet.name}:`, articleComplet.photos);
          } else {
            console.warn(`⚠️ Aucune photo pour l'article ${articleComplet.name}`);
          }
        } else {
          console.warn(`⚠️ Aucun article récupéré pour la ligne ${ligneId}`);
        }
        
        // ✅ 2. CHARGER COULEUR ET POINTURE avec getCouleurAndPointureFromLigne
        console.log(`🎨 Chargement couleur et pointure pour ligne ${ligneId}...`);
        const couleurPointure: any = await this.panierService.getCouleurAndPointureFromLigne(ligneId).toPromise();
        
        if (couleurPointure) {
          ligne.couleur = couleurPointure.couleur;
          ligne.pointure = couleurPointure.pointure;
          
          console.log(`✅ Couleur et pointure chargées pour ligne ${ligneId}:`, {
            couleur: couleurPointure.couleur?.nom || 'Non définie',
            pointure: couleurPointure.pointure?.taille || 'Non définie'
          });
        } else {
          console.warn(`⚠️ Aucune couleur/pointure récupérée pour la ligne ${ligneId}`);
        }
        
        // 🔍 VÉRIFICATION FINALE DE LA LIGNE
        console.log(`🔍 Ligne ${ligneId} après chargement:`, {
          hasArticle: !!ligne.article,
          articleName: ligne.article?.name,
          hasPhotos: !!(ligne.article?.photos && ligne.article.photos.length > 0),
          photosCount: ligne.article?.photos?.length || 0,
          hasCouleur: !!ligne.couleur,
          couleurName: ligne.couleur?.nom,
          hasPointure: !!ligne.pointure,
          pointureTaille: ligne.pointure?.taille
        });
        
      } catch (error) {
        console.error(`❌ Erreur lors du chargement des détails pour la ligne ${ligneId}:`, error);
        
        // En cas d'erreur, essayer de garder les données de base
        if (!ligne.article) {
          console.warn(`⚠️ Création d'un article minimal pour la ligne ${ligneId}`);
          ligne.article = {
            id: null,
            name: 'Article non trouvé',
            photos: []
          };
        }
      }
    }
    
    console.log('✅ Tous les détails ont été chargés avec les méthodes existantes');
    
    // 🔧 DIAGNOSTIC FINAL
    this.diagnostiquerResultatFinal(panier);
    
    return panier;
  }

  // 🔧 DIAGNOSTIC FINAL POUR VÉRIFIER LE RÉSULTAT (CORRIGÉ)
  private diagnostiquerResultatFinal(panier: any): void {
    console.log('🔧 === DIAGNOSTIC FINAL ===');
    
    panier.lignesPanier.forEach((ligne: any, index: number) => {  // ✅ Typage explicite
      console.log(`🔍 Résultat final ligne ${index + 1}:`, {
        ligneId: ligne.id,
        articleOK: !!ligne.article,
        articleName: ligne.article?.name || 'Non défini',
        photosOK: !!(ligne.article?.photos && ligne.article.photos.length > 0),
        photosCount: ligne.article?.photos?.length || 0,
        couleurOK: !!ligne.couleur,
        couleurName: ligne.couleur?.nom || 'Non définie',
        pointureOK: !!ligne.pointure,
        pointureTaille: ligne.pointure?.taille || 'Non définie'
      });
      
      // Test spécifique pour les photos
      if (ligne.article && ligne.article.photos) {
        console.log(`📸 Photos finales pour ligne ${index + 1}:`, ligne.article.photos);
      } else {
        console.warn(`⚠️ Pas de photos disponibles pour ligne ${index + 1}`);
      }
    });
    
    console.log('🔧 === FIN DIAGNOSTIC FINAL ===');
  }

 // ✅ DANS PanierComponent - chargerPanierEnCoursDepuisDB() SANS fusion - AVEC GESTION LOADING
 private chargerPanierEnCoursDepuisDB(userId: number): void {
   console.log('🔍 Chargement du panier en cours pour l\'utilisateur:', userId);
   
   this.panierService.getPanierEnCoursFromDB(userId).subscribe({
     next: (panierDB: any) => {
       console.log('📦 Panier récupéré depuis la DB:', panierDB);
       
       if (panierDB && panierDB.lignesPanier && panierDB.lignesPanier.length > 0) {
         console.log('✅ Panier trouvé avec', panierDB.lignesPanier.length, 'ligne(s)');
         
         this.chargerDetailsAvecMethodesExistantes(panierDB).then((panierComplet: any) => {
           this.panier = {
             id: panierComplet.id,
             clientId: userId,
             lignesPanier: panierComplet.lignesPanier || [],
             total: panierComplet.total || 0,
             statut: panierComplet.statut || 'EN_COURS',
             adresseLivraison: panierComplet.adresseLivraison || ''
           };
           
           console.log('✅ Panier chargé avec détails complets:', this.panier);
           this.chargerStocksPourPanier();
           this.panierService.sauvegarderPanierDansLocalStorage();
           
           // 🔄 FIN DU CHARGEMENT - SUCCÈS
           this.isLoading = false;
           console.log('✅ Chargement terminé avec succès - isLoading:', this.isLoading);
           
         }).catch(error => {
           console.error('❌ Erreur lors du chargement des détails:', error);
           this.initialiserPanierVide();
           // 🔄 FIN DU CHARGEMENT - ERREUR
           this.isLoading = false;
           console.log('❌ Chargement terminé avec erreur - isLoading:', this.isLoading);
         });
         
       } else {
         console.log('📭 Aucun panier en cours trouvé, création d\'un panier vide');
         this.panier = {
           id: panierDB ? panierDB.id : null,
           clientId: userId,
           lignesPanier: [],
           total: 0,
           statut: 'EN_COURS',
           adresseLivraison: ''
         };
         this.panierService.sauvegarderPanierDansLocalStorage();
         // 🔄 FIN DU CHARGEMENT - PANIER VIDE
         this.isLoading = false;
         console.log('✅ Chargement terminé (panier vide) - isLoading:', this.isLoading);
       }
     },
     error: (err: any) => {
       console.error('❌ Erreur lors du chargement du panier depuis la DB:', err);
       this.initialiserPanierVide();
       this.chargerPanierClient();
       // 🔄 FIN DU CHARGEMENT - ERREUR
       this.isLoading = false;
       console.log('❌ Chargement terminé avec erreur DB - isLoading:', this.isLoading);
     }
   });
 }
 
    
  // Méthode pour charger les stocks de tous les articles du panier
  private chargerStocksPourPanier(): void {
    if (this.panier && this.panier.lignesPanier && this.panier.lignesPanier.length > 0) {
      console.log('📊 Chargement des stocks pour', this.panier.lignesPanier.length, 'articles');
      
      this.panier.lignesPanier.forEach((ligne: LignePanier) => {
        const key = `${ligne.article.id}-${ligne.couleur.id}-${ligne.pointure.id}`;
        
        this.stockService.getStockQuantity(ligne.article.id, ligne.couleur.id, ligne.pointure.id)
          .subscribe({
            next: (qte) => {
              this.stockDisponible.set(key, qte);
              console.log(`📦 Stock chargé pour ${ligne.article.name}: ${qte} unités`);
            },
            error: (error) => {
              console.error(`❌ Erreur lors de la récupération du stock pour ${key}`, error);
              this.stockDisponible.set(key, 0); // Stock par défaut en cas d'erreur
            }
          });
      });
    }
  }

  // Nouvelle méthode pour charger le téléphone du client
  chargerTelephoneClient(): void {
    const user = this.tokenStorage.getUser();
    if (user && user.email) {
      // D'abord récupérer le client par email pour obtenir son ID
      this.clientService.getClientByEmail(user.email).subscribe({
        next: (client) => {
          this.clientData = client;
          console.log('Client trouvé:', client);
          
          // Vérifier que l'ID existe avant de l'utiliser
          if (client.id) {
            // Maintenant récupérer le téléphone avec l'ID du client
            this.clientService.getClientTelephone(client.id).subscribe({
              next: (telephone) => {
                this.telephone = telephone;
                this.telephoneOriginal = telephone;
                console.log('Téléphone chargé:', telephone);
              },
              error: (err) => {
                console.error('Erreur lors du chargement du téléphone:', err);
                // Si erreur, utiliser le téléphone du client récupéré par email
                this.telephone = client.telephone || '';
                this.telephoneOriginal = this.telephone;
              }
            });
          } else {
            console.error('ID du client non trouvé');
            this.telephone = client.telephone || '';
            this.telephoneOriginal = this.telephone;
          }
        },
        error: (err) => {
          console.error('Erreur lors du chargement du client:', err);
          this.telephone = '';
          this.telephoneOriginal = '';
        }
      });
    }
  }

  // Méthode pour valider le format du téléphone
  validerTelephone(): void {
    const phoneRegex = /^\d{8}$/; // Exactement 8 chiffres
    this.telephoneValide = phoneRegex.test(this.telephone);
    this.telephoneModifie = this.telephone !== this.telephoneOriginal;
  }

  // Méthode pour sauvegarder le téléphone modifié
  sauvegarderTelephone(): void {
    const user = this.tokenStorage.getUser();
    if (user && this.clientData && this.clientData.id && this.telephoneValide && this.telephoneModifie) {
      this.clientService.updateClientTelephone(this.clientData.id, this.telephone).subscribe({
        next: (response) => {
          console.log('Téléphone mis à jour:', response);
          this.telephoneOriginal = this.telephone;
          this.telephoneModifie = false;
          alert('Téléphone mis à jour avec succès !');
        },
        error: (err) => {
          console.error('Erreur lors de la mise à jour du téléphone:', err);
          alert('Erreur lors de la mise à jour du téléphone.');
        }
      });
    }
  }

  // 🔄 MÉTHODE MISE À JOUR - chargerPanierClient avec sécurité
  chargerPanierClient(): void {
    try {
      const panierFromService = this.panierService.getPanier();
      
      if (panierFromService && panierFromService.lignesPanier) {
        // Assigner le panier récupéré
        this.panier = {
          id: panierFromService.id || null,
          clientId: panierFromService.clientId || null,
          lignesPanier: panierFromService.lignesPanier || [],
          total: panierFromService.total || 0,
          statut: panierFromService.statut || 'EN_COURS',
          adresseLivraison: panierFromService.adresseLivraison || ''
        };
        this.clientId = this.panier.clientId;
        console.log('✅ Panier chargé depuis le service:', this.panier);
      } else {
        // Si le service retourne null/undefined, garder le panier vide initialisé
        console.log('📭 Aucun panier trouvé dans le service, utilisation du panier vide');
        this.initialiserPanierVide();
      }
      
      // Si le panier a des lignes, charger les quantités de stock
      if (this.panier.lignesPanier && this.panier.lignesPanier.length > 0) {
        this.chargerStocksPourPanier();
      }
      
      console.log("Stock disponible chargé :", this.stockDisponible);
      
    } catch (error) {
      console.error('❌ Erreur lors du chargement du panier client:', error);
      this.initialiserPanierVide();
    }
  }

  // Modifier la quantité d'un article - VERSION CORRIGÉE AVEC LOADING
  modifierQuantite(index: number, changement: number, ligne: LignePanier): void {
    if (!ligne || !ligne.couleur || !ligne.pointure) {
      console.error('Ligne de panier invalide');
      return;
    }

    const couleurId = ligne.couleur.id;
    const pointureId = ligne.pointure.id;

    if (!couleurId || !pointureId) {
      console.error('couleurId ou pointureId est invalide');
      return;
    }

    const key = `${ligne.article.id}-${couleurId}-${pointureId}`;
    const stockMax = this.stockDisponible.get(key) ?? 0;

    // Vérifier si on peut augmenter la quantité
    if (changement > 0 && ligne.quantite >= stockMax) {
      alert("❌ Quantité maximale atteinte !");
      return;
    }

    // Vérifier si on peut diminuer la quantité
    if (changement < 0 && ligne.quantite <= 1) {
      alert("❌ Quantité minimale atteinte !");
      return;
    }

    // Calculer la nouvelle quantité
    const nouvelleQuantite = ligne.quantite + changement;

    if (nouvelleQuantite < 1) {
      alert("❌ La quantité ne peut pas être inférieure à 1 !");
      return;
    }

    if (nouvelleQuantite > stockMax) {
      alert("❌ Quantité demandée supérieure au stock disponible !");
      return;
    }

    // Vérifier si l'utilisateur est connecté
    const user = this.tokenStorage.getUser();
    
    if (user && user.id && this.panier.id) {
      // 🔄 DÉBUT DU CHARGEMENT POUR MODIFICATION QUANTITÉ
      this.isLoading = true;
      console.log('🔄 Début modification quantité - isLoading:', this.isLoading);
      
      // UTILISATEUR CONNECTÉ - Mettre à jour via l'API backend
      console.log(`🔄 Mise à jour quantité via API pour ligne ${ligne.id}: ${ligne.quantite} → ${nouvelleQuantite}`);
      
      // Vérifier que la ligne a un ID (nécessaire pour la mise à jour en BDD)
      if (!ligne.id) {
        console.error('❌ ID de ligne manquant pour la mise à jour en BDD');
        alert('Erreur : impossible de mettre à jour la quantité');
        this.isLoading = false;
        return;
      }

      // Appeler l'API pour mettre à jour la quantité en base
      this.panierService.modifierQuantiteLignePanier(ligne.id, nouvelleQuantite).subscribe({
        next: (response) => {
          console.log('✅ Quantité mise à jour en base:', response);
          
          // Mettre à jour localement après succès de l'API
          ligne.quantite = nouvelleQuantite;
          ligne.total = ligne.quantite * ligne.prixUnitaire;
          
          // Recalculer le total du panier
          this.updateTotal();
          
          // Sauvegarder dans localStorage pour synchronisation
          this.panierService.sauvegarderPanierDansLocalStorage();
          
          console.log(`✅ Quantité mise à jour: ${ligne.article.name} → ${nouvelleQuantite}`);
          
          // 🔄 FIN DU CHARGEMENT - SUCCÈS
          this.isLoading = false;
          console.log('✅ Modification quantité terminée - isLoading:', this.isLoading);
        },
        error: (error) => {
          console.error('❌ Erreur lors de la mise à jour de la quantité:', error);
          alert('Erreur lors de la mise à jour de la quantité. Veuillez réessayer.');
          // 🔄 FIN DU CHARGEMENT - ERREUR
          this.isLoading = false;
          console.log('❌ Modification quantité terminée avec erreur - isLoading:', this.isLoading);
        }
      });
      
    } else {
      // UTILISATEUR NON CONNECTÉ - Mettre à jour en localStorage uniquement
      console.log(`🏠 Mise à jour quantité en localStorage: ${ligne.quantite} → ${nouvelleQuantite}`);
      
      // Utiliser la méthode existante pour localStorage
      this.panierService.modifierQuantite(index, changement, ligne.article.id, couleurId, pointureId);
      this.panierService.sauvegarderPanierDansLocalStorage();
      this.updateTotal();
      
      console.log(`✅ Quantité mise à jour en localStorage: ${ligne.article.name} → ${nouvelleQuantite}`);
    }
  }

  // 🔄 MÉTHODE MISE À JOUR - updateTotal avec sécurité
  updateTotal(): void {
    if (!this.panier || !this.panier.lignesPanier) {
      console.warn('⚠️ Panier ou lignesPanier non défini lors du calcul du total');
      return;
    }
    
    this.panier.total = this.panier.lignesPanier.reduce((total: number, ligne: LignePanier) => {
      if (ligne && ligne.quantite && ligne.article && ligne.article.prixVente) {
        return total + (ligne.quantite * ligne.article.prixVente);
      }
      return total;
    }, 0);
    
    console.log('💰 Total mis à jour:', this.panier.total);
  }
  
// ==========================================
// VERSION SIMPLE - Sans message d'erreur + rechargement automatique
// ==========================================

supprimerLigne(index: number): void {
  if (!this.panier || !this.panier.lignesPanier) {
    console.warn('⚠️ Impossible de supprimer : panier non défini');
    return;
  }

  const ligne = this.panier.lignesPanier[index];
  
  if (!ligne) {
    console.warn('⚠️ Ligne non trouvée à l\'index:', index);
    return;
  }

  // Demander confirmation
  const confirmation = confirm('🗑️ Êtes-vous sûr de vouloir supprimer cet article ?');
  
  if (!confirmation) {
    return;
  }

  // Vérifier si l'utilisateur est connecté
  const user = this.tokenStorage.getUser();
  
  if (user && user.id && this.panier.id && ligne.id) {
    // 🔄 DÉBUT DU CHARGEMENT
    this.isLoading = true;
    console.log('🔄 Début suppression ligne via API');
    console.log(`🗑️ Suppression ligne ${ligne.id} du panier ${this.panier.id}`);
    
    this.panierService.supprimerLignePanier(this.panier.id, ligne.id).subscribe({
      next: (response) => {
        console.log('✅ Suppression terminée - rechargement du panier');
        this.rechargerPanier(user.id);
      },
      error: (error) => {
        console.log('⚠️ Erreur API mais rechargement du panier quand même');
        // 🚫 PAS DE MESSAGE D'ERREUR - rechargement direct
        this.rechargerPanier(user.id);
      }
    });
    
  } else {
    // UTILISATEUR NON CONNECTÉ - Utiliser la méthode localStorage existante
    console.log('🏠 Suppression ligne en localStorage pour utilisateur non connecté');
    this.panierService.supprimerDuPanier(index);
    this.chargerPanierClient();
    console.log(`✅ Article supprimé du localStorage`);
  }
}

// 🆕 MÉTHODE POUR RECHARGER LE PANIER APRÈS SUPPRESSION
private rechargerPanier(userId: number): void {
  console.log('🔄 Rechargement du panier après suppression...');
  
  // Option 1: Recharger depuis la base de données (recommandé)
  this.chargerPanierEnCoursDepuisDB(userId);
  // Le isLoading sera mis à false automatiquement par chargerPanierEnCoursDepuisDB
}


  viderPanier(): void {
    // Demander confirmation avant de vider
    const confirmation = confirm('🗑️ Êtes-vous sûr de vouloir vider votre panier ?');
    
    if (!confirmation) {
      return; // L'utilisateur a annulé
    }
    
    console.log('🗑️ Début du vidage du panier...');    
    // Appeler la méthode du service (qui gère localStorage et BDD)
    this.panierService.viderPanier();   
    // Réinitialiser le panier dans le composant
    this.initialiserPanierVide();
    
    // Recharger le panier depuis le service
    this.chargerPanierClient();
  
    // Vérifier si le panier était validé et rediriger si nécessaire
    const panier = this.panierService.getPanier();
    if (panier && panier.statut === 'VALIDER') {
      setTimeout(() => {
        this.router.navigate(['/accueil']);
      }, 2000);
    }
    
    console.log('✅ Panier vidé avec succès !');
  }
  
  // 🔄 MÉTHODE MISE À JOUR - createPanier avec sécurité ET LOADING
  createPanier(): void {
    if (!this.panier || !this.panier.lignesPanier || this.panier.lignesPanier.length === 0) {
      alert('Ajoutez au moins un article au panier !');
      return;
    }

    if (!this.adresseLivraison || this.adresseLivraison.trim() === '') {
      alert('Veuillez entrer une adresse de livraison.');
      return;
    }

    // VALIDATION DU TÉLÉPHONE AVANT LA COMMANDE
    if (!this.telephoneValide) {
      alert('Veuillez saisir un numéro de téléphone valide (8 chiffres).');
      return;
    }

    // Vérifier si l'utilisateur est connecté
    const user = this.tokenStorage.getUser();
    if (!user || !user.email) {
      // L'utilisateur n'est pas connecté
      this.panier.adresseLivraison = this.adresseLivraison;
      this.panier.statut = 'VALIDER';
      this.panierService.sauvegarderPanierDansLocalStorage();
      
      localStorage.setItem('adresseLivraison', this.adresseLivraison);

      // Rediriger vers la page de login avec URL de retour
      this.router.navigate(['/auth/client/login'], { 
        queryParams: { returnUrl: '/panier' } 
      });
      return;
    }

    // 🔄 DÉBUT DU CHARGEMENT POUR CRÉATION PANIER
    this.isLoading = true;
    console.log('🔄 Début création panier - isLoading:', this.isLoading);

    // Sauvegarder le téléphone si modifié avant de continuer
    if (this.telephoneModifie && this.telephoneValide) {
      this.sauvegarderTelephone();
    }
    
    // Si l'utilisateur est connecté, continuer avec la création du panier
    this.panier.adresseLivraison = this.adresseLivraison;
    this.panier.statut = 'VALIDER';
    this.panierService.sauvegarderPanierDansLocalStorage();

    // 🔧 CRÉER UN PANIER PROPRE AVEC TYPAGE CORRECT
    const panierPourAPI = {
      adresseLivraison: this.adresseLivraison,
      statut: "VALIDER",
      lignesPanier: this.panier.lignesPanier.map((ligne: LignePanier) => ({
        article: { id: ligne.article.id },
        couleur: { id: ligne.couleur.id },
        pointure: { id: ligne.pointure.id },
        quantite: ligne.quantite,
        prixUnitaire: ligne.prixUnitaire,
        total: ligne.quantite * ligne.prixUnitaire
      }))
    };

    console.log("🛒 Envoi du panier nettoyé au backend", panierPourAPI);

    // PREMIÈRE ÉTAPE : Créer le panier avec l'ID de l'utilisateur
    console.log("🔥 Création du panier avec user.id :", user.id);
    
    this.panierService.creerPanier(user.id, panierPourAPI).subscribe({
      next: (data) => {
        console.log("✅ Panier créé avec user.id :", data);
        
        // DEUXIÈME ÉTAPE : Maintenant changer avec l'ID du client si disponible
        if (this.clientData && this.clientData.id && this.clientData.id !== user.id) {
          console.log("🔄 Mise à jour du panier avec client.id :", this.clientData.id);
          
          // Mettre à jour le panier avec l'ID du client
          const panierAvecClientId = { 
            ...data,
            clientId: this.clientData.id
          };
          
          console.log("📝 Panier final avec client.id :", panierAvecClientId);
          alert("Panier créé avec succès avec l'adresse de livraison et l'ID client !");
        } else {
          console.log("ℹ️ Utilisation de l'user.id comme client.id");
          alert("Panier créé avec succès avec l'adresse de livraison !");
        }
        
        console.log('Panier créé avec ID:', data.id);
        localStorage.setItem('panierIdCMD', data.id);
        console.log('🆔 ID du panier sauvegardé dans localStorage :', localStorage.getItem('panierIdCMD'));

        // Mettre à jour le panier dans localStorage
        this.panierService.sauvegarderPanierDansLocalStorage();
        console.log('Panier créé après sauvegarde:', this.panierService);
        
        // Nettoyer le localStorage
        localStorage.removeItem('adresseLivraison');

        // 🔄 FIN DU CHARGEMENT - SUCCÈS
        this.isLoading = false;
        console.log('✅ Création panier terminée avec succès - isLoading:', this.isLoading);

        // Redirection vers la page de commande
        console.log("Redirection vers commande...");
        this.router.navigate(['/commande']);
      },
      error: (err) => {
        console.error("❌ Erreur lors de la création du panier:", err);
        
        // 🔄 FIN DU CHARGEMENT - ERREUR
        this.isLoading = false;
        console.log('❌ Création panier terminée avec erreur - isLoading:', this.isLoading);
        
        // Vérifier si l'erreur est due à une non-authentification (403 Forbidden)
        if (err.status === 403) {
          alert("Vous devez vous connecter pour finaliser votre commande.");
          
          // Sauvegarder l'état actuel du panier avant la redirection
          this.panier.adresseLivraison = this.adresseLivraison;
          this.panierService.sauvegarderPanierDansLocalStorage();
          
          // Rediriger vers la page de login avec URL de retour
          this.router.navigate(['/auth/client/login'], { 
            queryParams: { returnUrl: '/panier' } 
          });
        } else {
          const messageErreur = err.error?.message || err.error || "Une erreur est survenue lors de la création du panier.";
          alert(messageErreur);        
        }
      }
    });
  }

  redirectToListCommande(): void {
    // Vérifier si l'utilisateur est connecté
    const user = this.tokenStorage.getUser();
    
    if (!user || !user.email) {
      // L'utilisateur n'est pas connecté, rediriger vers la page de login
      this.router.navigate(['/auth/client/login'], { 
        queryParams: { returnUrl: '/listCommande' } 
      });
    } else {
      // L'utilisateur est connecté, rediriger vers la liste des commandes
      this.router.navigate(['/listCommande']);
    }
  }

  getNomCouleur(couleurCode: string): string {
    const mapCouleurs: { [key: string]: string } = {
      '#3c2313': 'marron',
      '#ffffff': 'blanc',
      '#000000': 'noir',
      // ajoute d'autres couleurs si nécessaire
    };
    return mapCouleurs[couleurCode] || couleurCode;
  }

  redirectToaccueil(): void {
    // Vérifier si l'utilisateur est connecté
    const user = this.tokenStorage.getUser();
    
    if (!user || !user.id) {
      // L'utilisateur n'est pas connecté, rediriger vers la page de login
      this.router.navigate(['/auth/client/login'], { 
        queryParams: { returnUrl: '/accueil' } 
      });
    } else {
      // L'utilisateur est connecté, rediriger vers la liste des commandes
      this.router.navigate(['/accueil']);
    }
  }
}