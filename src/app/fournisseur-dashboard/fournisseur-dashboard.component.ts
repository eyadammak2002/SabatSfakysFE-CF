import { Component } from '@angular/core';
import { RouterLink, RouterModule } from '@angular/router';

@Component({
  selector: 'app-fournisseur-dashboard',
  
  standalone: true,
  imports: [RouterModule],
  templateUrl: './fournisseur-dashboard.component.html',
  styleUrls: ['./fournisseur-dashboard.component.css']
})
export class FournisseurDashboardComponent {
  constructor() {
    console.log("✅ FournisseurDashboardComponent chargé !");
  }
}

