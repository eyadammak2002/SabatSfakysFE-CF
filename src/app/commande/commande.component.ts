import { AfterViewInit, Component, OnInit } from '@angular/core';
import { Panier, PanierService } from '../services/panier.service';
import { Router } from '@angular/router';
import { NgxPayPalModule, IPayPalConfig, ICreateOrderRequest } from 'ngx-paypal';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';

@Component({
  selector: 'app-commande',
  standalone: true,
  imports: [NgxPayPalModule,CommonModule,FormsModule],
  templateUrl: './commande.component.html',
  styleUrls: ['./commande.component.css']
})
export class CommandeComponent implements OnInit, AfterViewInit {
  panier: Panier = { id: null, clientId: 0, lignesPanier: [], total: 0, statut: '', adresseLivraison: '' };  
  payer: boolean = false;
  public payPalConfig?: IPayPalConfig;

  constructor(private panierService: PanierService, private router: Router) {}

  ngOnInit(): void {
    this.panier = this.panierService.getPanier();  
    this.initPayPalConfig();  
  }

  ngAfterViewInit(): void {}

  // Initialisation de la configuration PayPal
  private initPayPalConfig(): void {
    this.payPalConfig = {
      currency: 'TND',
      clientId: 'Acm8C-nrWKW_qT5CJQEBfAdWJsx9TiaZ7BhdWy1jQyqPL16hef4WIcy35Vd7EETIpiMdU7Febdo-EDSH', // Remplace par ton vrai Client ID PayPal
      createOrderOnClient: (data) => <ICreateOrderRequest>{
        intent: 'CAPTURE',
        purchase_units: [{
          amount: {
            currency_code: 'USD',
            value: this.panier.total.toFixed(2),
            breakdown: {
              item_total: {
                currency_code: 'USD',
                value: this.panier.total.toFixed(2)
              }
            }
          },
          items: this.panier.lignesPanier.map(ligne => ({
            name: ligne.article.name,
            quantity: ligne.quantite.toString(),
            category: 'PHYSICAL_GOODS',
            unit_amount: {
              currency_code: 'USD',
              value: ligne.article.prixVente.toFixed(2)
            }
          }))
        }]
      },
      advanced: {
        commit: 'true'
      },
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

  // Validation de la commande après paiement
  validerCommande(): void {
    if (this.panier.lignesPanier.length === 0) {
      alert('Votre panier est vide !');
      return;
    }

    this.panierService.validerPanier(this.panier).subscribe({
      next: (panierValide) => {
        this.panier = panierValide;
        alert('Commande validée avec succès !');
        this.panierService.sauvegarderPanierDansLocalStorage();

        setTimeout(() => {
          window.location.reload();
        }, 300);
      },
      error: () => {
        alert("Erreur lors de la validation du panier !");
      }
    });

    this.panier.statut = 'COMMANDEE'; 
  }
}
