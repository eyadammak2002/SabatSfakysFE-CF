import { AfterViewInit, Component, OnInit } from '@angular/core';
import { Panier, PanierService } from '../services/panier.service';
import { Router } from '@angular/router';
import { NgxPayPalModule, IPayPalConfig, ICreateOrderRequest } from 'ngx-paypal';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { MatDialog } from '@angular/material/dialog';
import { MatSnackBar, MatSnackBarModule } from '@angular/material/snack-bar';
import { ConfirmDialogComponent } from '../components/confirm-dialog.component';
import { MatIconModule } from '@angular/material/icon';
import { MatStepperModule } from '@angular/material/stepper';
import { forkJoin, map } from 'rxjs';

@Component({
  selector: 'app-commande',
  standalone: true,
  imports: [NgxPayPalModule, CommonModule, FormsModule, MatSnackBarModule, MatIconModule, MatStepperModule],
  templateUrl: './commande.component.html',
  styleUrls: ['./commande.component.css']
})
export class CommandeComponent implements OnInit, AfterViewInit {
  panier: Panier = { id: null, clientId: 0, lignesPanier: [], total: 0, statut: '', adresseLivraison: '', modePaiement: 'LIVRAISON' };  
  payer: boolean = false;
  public payPalConfig?: IPayPalConfig;
  panierIdCMD: number | null = null;
  modePaiement: string = 'PAYPAL'; // Valeur par défaut
  
  // Étapes de suivi de commande avec icônes Material correctes
  etapesCommande = [
    { statut: 'VALIDER', label: 'Validé', icon: 'check_circle', description: 'Votre commande a été enregistrée' },
    { statut: 'COMMANDEE', label: 'Commandé', icon: 'shopping_cart', description: 'Votre commande a été validée' },
    { statut: 'EN_ATTENTE_LIVRAISON', label: 'En préparation', icon: 'inventory_2', description: 'Votre commande est en préparation' },
    { statut: 'LIVRER', label: 'Livré', icon: 'local_shipping', description: 'Votre commande a été livrée' },
    { statut: 'ANNULER', label: 'Annulée', icon: 'cancel', description: 'Votre commande a été annulée' }
  ];
  
  constructor(private panierService: PanierService, private router: Router, private snackBar: MatSnackBar,
    private dialog: MatDialog) {}

    ngOnInit(): void {
      const clientId = this.panierService.getClientId();
      
      if (clientId) {
        this.panierService.getDernierPanierClient(clientId).subscribe({
          next: (panier) => {
            this.panier = panier;
            
            if (!this.panier.modePaiement) {
              this.panier.modePaiement = 'LIVRAISON';
            }
            this.modePaiement = this.panier.modePaiement;
    
            // Utiliser forkJoin comme dans le premier composant pour charger tous les détails
            const observables = this.panier.lignesPanier.map((ligne: any) => {
              return forkJoin({
                article: this.panierService.getArticleFromLignePanier(ligne.id),
                details: this.panierService.getCouleurAndPointureFromLigne(ligne.id)
              }).pipe(
                map(results => {
                  ligne.article = results.article;
                  ligne.couleur = results.details.couleur;
                  ligne.pointure = results.details.pointure;
                  return ligne;
                })
              );
            });
    
            // Si le panier n'a pas de lignes, initialiser PayPal immédiatement
            if (observables.length === 0) {
              this.initPayPalConfig();
              return;
            }
    
            // Attendre que toutes les requêtes soient terminées
            forkJoin(observables).subscribe({
              next: (lignesCompletes) => {
                this.panier.lignesPanier = lignesCompletes;
                this.initPayPalConfig();
              },
              error: (err) => {
                console.error('Erreur lors du chargement des détails des articles:', err);
                this.initPayPalConfig(); // Initialiser quand même PayPal
              }
            });
          },
          error: (err) => {
            console.error('Erreur lors de la récupération du dernier panier', err);
          }
        });
      }
    }

    
  ngAfterViewInit(): void {}

  // Initialisation de la configuration PayPal
  private initPayPalConfig(): void {
    this.payPalConfig = {
      currency: 'EUR',
      clientId: 'AZiI7guRsT6B_pbnyw_kN_xfdC8W7HOe6FtZbGALSP7QQlARxnCngL-7P1v8vSj7wwQ8Jz0AooY7UHrX', // Remplace par ton vrai Client ID PayPal
      createOrderOnClient: (data) => <ICreateOrderRequest>{
        intent: 'CAPTURE',
        purchase_units: [{
          amount: {
            currency_code: 'EUR',
            value: this.panier.total.toFixed(2),
            breakdown: {
              item_total: {
                currency_code: 'EUR',
                value: this.panier.total.toFixed(2)
              }
            }
          },
          items: this.panier.lignesPanier.map(ligne => ({
            name: ligne.article.name,
            quantity: ligne.quantite.toString(),
            category: 'PHYSICAL_GOODS',
            unit_amount: {
              currency_code: 'EUR',
              value: ligne.article.prixVente.toFixed(2)
            }
          }))
        }]
      },
      advanced: {
        commit: 'true',
        extraQueryParams: [
          { name: 'currency', value: 'EUR' }  // Ajouter la devise comme paramètre
        ]
      },
        
      style: {
        label: 'paypal',
        layout: 'vertical'
      },
      onApprove: (data, actions) => {
        console.log('Transaction approuvée', data);
        actions.order.get().then((details: any) => {
          console.log('Détails de la commande : ', details);
          this.snackBar.open('Paiement réussi ! Merci, ' + details.payer.name.given_name, 'Fermer', { duration: 3000 });
        });
      },
      onClientAuthorization: (data) => {
        console.log('Paiement finalisé côté client', data);
        
        // Fixer explicitement le mode de paiement sur PayPal
        this.modePaiement = 'PAYPAL';
        this.panier.modePaiement = 'PAYPAL';
        
        // Journalisation de débogage
        console.log('Mode de paiement explicitement défini sur PAYPAL avant validation');
        
        this.snackBar.open('Paiement réussi !', 'Fermer', { duration: 3000 });
        
        // Valider la commande avec le nouveau mode défini
        this.validerCommande();
      },
      onCancel: (data) => {
        console.log('Paiement annulé', data);
        this.snackBar.open('Paiement annulé.', 'Fermer', { duration: 3000 });
      },
      onError: err => {
        console.log('Erreur de paiement', err);
        console.error('Détails de l\'erreur:', err);
        this.snackBar.open('Erreur lors du paiement', 'Fermer', { duration: 5000 });
      },
      onClick: (data, actions) => {
        console.log('Bouton PayPal cliqué', data, actions);
      }
    };
  }

  // Changer le mode de paiement
  changerModePaiement(mode: string): void {
    this.modePaiement = mode;
    this.panier.modePaiement = mode;
    console.log('Mode de paiement sélectionné:', mode);
    
    // Réinitialiser l'état de paiement si on change le mode
    this.payer = false;
  }

  // Affichage du bouton PayPal après sélection du paiement
  payement() {
    // Appliquer explicitement le mode de paiement sélectionné au panier
    this.panier.modePaiement = this.modePaiement;
    
    if (this.modePaiement === 'PAYPAL') {
      // Assurez-vous que la configuration PayPal est initialisée avec le bon montant
      // et que le bouton PayPal sera affiché
      this.payer = true;
      
      // Important: Réinitialiser la configuration PayPal avec les données actuelles
      this.initPayPalConfig();
      
      console.log('Mode PayPal activé, bouton PayPal affiché');
    } else if (this.modePaiement === 'LIVRAISON') {
      // Pour être absolument certain que le mode est correctement défini
      this.panier.modePaiement = 'LIVRAISON';
      console.log('Mode Livraison sélectionné, validation directe');
      this.validerCommande();
    }
  }
  
  // Méthode pour déterminer si l'étape est complétée en cas d'annulation
  isEtapeCompletee(statutEtape: string): boolean {
    if (!this.panier.statut) return false;
    
    // Si la commande est annulée
    if (this.panier.statut === 'ANNULER') {
      // Si c'est l'étape ANNULER qui est vérifiée, elle est complétée
      if (statutEtape === 'ANNULER') {
        return true;
      }
      
      // Si c'est l'étape VALIDER, elle est aussi complétée (car on doit avoir validé la commande avant de l'annuler)
      if (statutEtape === 'VALIDER') {
        return true;
      }
      
      // Pour les étapes intermédiaires, nous les considérons comme "complétées" 
      // pour que la ligne rouge apparaisse sur tout le parcours
      // mais les icônes auront un style spécial défini en CSS
      return true;
    }
    
    // Comportement normal pour les autres statuts
    const statutsIndex: { [key: string]: number } = {
      'VALIDER': 0,
      'COMMANDEE': 1,
      'EN_ATTENTE_LIVRAISON': 2,
      'LIVRER': 3,
      'ANNULER': 4
    };
    
    const indexEtapeActuelle = statutsIndex[this.panier.statut];
    const indexEtapeVerifiee = statutsIndex[statutEtape];
    
    return indexEtapeVerifiee <= indexEtapeActuelle;
  }
  
  // Méthode pour déterminer quelle étape est active
  isEtapeActive(statutEtape: string): boolean {
    // Si la commande est annulée, seule l'étape ANNULER est active
    if (this.panier.statut === 'ANNULER') {
      return statutEtape === 'ANNULER';
    }
    
    // Pour les autres statuts, comportement normal
    return this.panier.statut === statutEtape;
  }
  
  // Méthode pour obtenir l'affichage du mode de paiement
  getPaymentModeDisplay(): string {
    if (!this.panier.modePaiement) return 'Non défini';
    
    // Normaliser le mode de paiement en majuscules pour la comparaison
    const mode = this.panier.modePaiement.toUpperCase();
    
    switch (mode) {
      case 'PAYPAL':
        return 'Paiement par PayPal';
      case 'LIVRAISON':
        return 'Paiement à la livraison';
      default:
        return this.panier.modePaiement;
    }
  }
  
  // Méthode pour obtenir l'icône du mode de paiement
  getPaymentModeIcon(): string {
    if (!this.panier.modePaiement) return 'help_outline';
    
    // Normaliser le mode de paiement en majuscules pour la comparaison
    const mode = this.panier.modePaiement.toUpperCase();
    
    switch (mode) {
      case 'PAYPAL':
        return 'payment';
      case 'LIVRAISON':
        return 'local_shipping';
      default:
        return 'payment';
    }
  }

  // Méthode qui appelle le service pour payer le panier sur le backend
  payerPanier(): void {
    if (!this.panier.id) {
      console.error('Aucun ID de panier disponible pour le paiement.');
      this.snackBar.open('Aucun panier à payer', 'Fermer', { duration: 3000 });
      return;
    }
    
    // Appel au service avec l'ID du panier
    this.panierService.payerPanier(this.panier.id).subscribe({
      next: (panierPaye) => {
        console.log('Panier payé:', panierPaye);
        this.snackBar.open('Panier payé avec succès', 'Fermer', { duration: 3000 });
        // Vous pouvez mettre à jour votre panier local ici si besoin
        this.panier = panierPaye;
      },
      error: (err) => {
        console.error('Erreur lors du paiement du panier', err);
        this.snackBar.open('Erreur pendant le paiement', 'Fermer', { duration: 5000 });
      }
    });
  }
  
  validerCommande(): void {
    if (this.panier.lignesPanier.length === 0) {
      this.snackBar.open('Votre panier est vide !', 'Fermer', { duration: 3000 });
      return;
    }
  
    // Assurez-vous que l'ID du panier est correct avant validation
    if (this.panierIdCMD && (!this.panier.id || this.panier.id !== this.panierIdCMD)) {
      console.log("Mise à jour de l'ID du panier avant validation:", this.panierIdCMD);
      this.panier.id = this.panierIdCMD;
    }
    
    // MODIFICATION ICI: Assurez-vous que le mode de paiement est correctement appliqué
    // Définir explicitement le mode de paiement selon la sélection actuelle
    this.panier.modePaiement = this.modePaiement;
    
    console.log("Validation du panier avec ID:", this.panier.id);
    console.log("Mode de paiement:", this.panier.modePaiement);
    
    this.panierService.validerPanier(this.panier).subscribe({
      next: (panierValide) => {
        // IMPORTANT: Préserver le mode de paiement lors de la mise à jour de l'objet panier
        const modePaiementSelectionne = this.panier.modePaiement;
        this.panier = panierValide;
        
        // Réappliquer le mode de paiement si le serveur ne l'a pas conservé
        if (this.panier.modePaiement !== modePaiementSelectionne) {
          this.panier.modePaiement = modePaiementSelectionne;
        }
        
        this.panierIdCMD = this.panier.id;
        
        // Sauvegarder l'ID du panier dans localStorage avant le rechargement
        localStorage.setItem('panierIdCMD', JSON.stringify(this.panierIdCMD));
        
        let message = 'Commande validée avec succès !';
        if (this.panier.modePaiement === 'LIVRAISON') {
          message += ' Paiement à la livraison.';
        } else {
          message += ' Paiement PayPal effectué.';
        }
        
        this.snackBar.open(message, 'Fermer', { duration: 3000 });
        
        // IMPORTANT: Assurez-vous que le mode de paiement est correctement sauvegardé
        this.panierService.sauvegarderPanierDansLocalStorage();
        console.log("Panier validé:", this.panier);
        
        setTimeout(() => {
          window.location.reload();
        }, 300);
      },
      error: (err) => {
        console.error("Erreur lors de la validation:", err);
      
        const messageErreur = typeof err.error === 'string'
          ? err.error
          : "Erreur lors de la validation du panier !";
      
        this.snackBar.open(messageErreur, 'Fermer', { duration: 5000 });
      }
    });
  
    this.panier.statut = 'COMMANDEE'; 
  }

  annulerCommande(): void {
    // Vérifier si l'ID du panier est valide
    if (this.panier.id === null) {
      // Si l'ID est null, essayer d'utiliser l'ID sauvegardé
      if (this.panierIdCMD !== null) {
        this.panier.id = this.panierIdCMD;
        console.log("Utilisation de l'ID sauvegardé:", this.panierIdCMD);
      } else {
        this.snackBar.open("Impossible d'annuler: ID du panier non disponible.", "Fermer", {
          duration: 5000,
          panelClass: ['error-snackbar']
        });
        console.log("Aucun ID de panier disponible");
        return;
      }
    }

    // Utiliser MatDialog pour confirmation
    const dialogRef = this.dialog.open(ConfirmDialogComponent, {
      width: '350px',
      data: { 
        title: 'Confirmation',
        message: 'Êtes-vous sûr de vouloir annuler cette commande ?'
      }
    });

    dialogRef.afterClosed().subscribe(result => {
      if (result) {
        this.panierService.annulerPanier(this.panier.id!).subscribe(
          (response) => {
            // Mettre à jour le statut local
            this.panier.statut = 'ANNULER';
            
            // Mettre à jour le localStorage
            this.panierService.sauvegarderPanierDansLocalStorage();
            
            // Supprimer l'ID sauvegardé puisque la commande est annulée
            localStorage.removeItem('panierIdCMD');
            
            this.snackBar.open('Commande annulée avec succès', 'Fermer', {
              duration: 3000,
              panelClass: ['success-snackbar']
            });
            
            // Recharger la page pour actualiser l'affichage du statut
            setTimeout(() => {
              window.location.reload();
            }, 300);
          },
          (error) => {
            // Gérer les erreurs
            console.error('Erreur lors de l\'annulation de la commande', error);
            
            // Message d'erreur approprié
            if (error.error?.message?.includes('déjà livré')) {
              this.snackBar.open('Impossible d\'annuler cette commande car elle est déjà livrée.', 'Fermer', {
                duration: 5000,
                panelClass: ['error-snackbar']
              });
            } else {
              this.snackBar.open('Une erreur est survenue lors de l\'annulation de la commande', 'Fermer', {
                duration: 5000,
                panelClass: ['error-snackbar']
              });
            }
          }
        );
      }
    });
  }
}