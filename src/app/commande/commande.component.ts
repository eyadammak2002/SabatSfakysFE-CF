import { AfterViewInit, Component, OnInit } from '@angular/core';
import { Panier, PanierService } from '../services/panier.service';
import { Router } from '@angular/router';
import { NgxPayPalModule, IPayPalConfig, ICreateOrderRequest } from 'ngx-paypal';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { MatDialog } from '@angular/material/dialog';
import { MatSnackBar, MatSnackBarModule } from '@angular/material/snack-bar';
import { ConfirmDialogComponent } from '../components/confirm-dialog.component';

@Component({
  selector: 'app-commande',
  standalone: true,
  imports: [NgxPayPalModule,CommonModule,FormsModule,    MatSnackBarModule],
  templateUrl: './commande.component.html',
  styleUrls: ['./commande.component.css']
})
export class CommandeComponent implements OnInit, AfterViewInit {
  panier: Panier = { id: null, clientId: 0, lignesPanier: [], total: 0, statut: '', adresseLivraison: '' };  
  payer: boolean = false;
  public payPalConfig?: IPayPalConfig;
  panierIdCMD: number | null = null;

  
  constructor(private panierService: PanierService, private router: Router,  private snackBar: MatSnackBar,
    private dialog: MatDialog) {}
// Modification de ngOnInit pour récupérer l'ID sauvegardé
// Dans commande.component.ts, méthode ngOnInit()
ngOnInit(): void {
  this.panier = this.panierService.getPanier();
  
  // Récupérer l'ID du panier depuis localStorage
  const savedPanierId = localStorage.getItem('panierIdCMD');
  console.log("ID du panier récupéré:", savedPanierId);
  
  if (savedPanierId) {
    this.panierIdCMD = parseInt(savedPanierId, 10); // Conversion en nombre
    console.log("ID du panier à utiliser pour la commande:", this.panierIdCMD);
    
    // Si le panier actuel n'a pas d'ID mais qu'on a un ID sauvegardé, l'utiliser
    if (this.panier.id === null) {
      this.panier.id = this.panierIdCMD;
    }
  }
  
  this.initPayPalConfig();
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
      ]    },
      
    style: {
      label: 'paypal',
      layout: 'vertical'
    },
    onApprove: (data, actions) => {
      console.log('Transaction approuvée', data);
      actions.order.get().then((details: any) => {
        console.log('Détails de la commande : ', details);
        alert('Paiement réussi ! Merci, ' + details.payer.name.given_name);
      });
    },
    onClientAuthorization: (data) => {
      console.log('Paiement finalisé côté client', data);
      alert('Paiement réussi !');
      this.validerCommande();
    },
    onCancel: (data) => {
      console.log('Paiement annulé', data);
      alert('Paiement annulé.');
    },
    onError: err => {
      console.log('Erreur de paiement', err);
      console.error('Détails de l\'erreur:', err);
    },
    onClick: (data, actions) => {
      console.log('Bouton PayPal cliqué', data, actions);
    }
  };
}

  // Affichage du bouton PayPal après sélection du paiement
  payement() {
    this.payer = true;
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
      alert('Votre panier est vide !');
      return;
    }
  
    // Assurez-vous que l'ID du panier est correct avant validation
    if (this.panierIdCMD && (!this.panier.id || this.panier.id !== this.panierIdCMD)) {
      console.log("Mise à jour de l'ID du panier avant validation:", this.panierIdCMD);
      this.panier.id = this.panierIdCMD;
    }
    
    console.log("Validation du panier avec ID:", this.panier.id);
    
    this.panierService.validerPanier(this.panier).subscribe({
      next: (panierValide) => {
        this.panier = panierValide;
        this.panierIdCMD = this.panier.id;
        
        // Sauvegarder l'ID du panier dans localStorage avant le rechargement
        localStorage.setItem('panierIdCMD', JSON.stringify(this.panierIdCMD));
        
        alert('Commande validée avec succès !');
        this.panierService.sauvegarderPanierDansLocalStorage();
        console.log("Panier validé:", this.panier);
        
        setTimeout(() => {
          window.location.reload();
        }, 300);
      },
      error: (err) => {
        console.error("Erreur lors de la validation:", err);
        alert("Erreur lors de la validation du panier !");
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
          // Traiter la réponse après annulation
          this.panier.statut = 'ANNULEE';
          
          // Mettre à jour le localStorage
          this.panierService.sauvegarderPanierDansLocalStorage();
          
          // Supprimer l'ID sauvegardé puisque la commande est annulée
          localStorage.removeItem('panierIdCMD');
          
          this.snackBar.open('Commande annulée avec succès', 'Fermer', {
            duration: 3000,
            panelClass: ['success-snackbar']
          });
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
