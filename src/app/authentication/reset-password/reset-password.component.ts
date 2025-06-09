import { Component, OnInit } from '@angular/core';
import { ActivatedRoute, Router } from '@angular/router';
import { ForgetpasswordService } from '../forgetpassword.service';

@Component({
  selector: 'app-reset-password',
  templateUrl: './reset-password.component.html',
  styleUrls: ['./reset-password.component.css']
})
export class ResetPasswordComponent implements OnInit{
  password: string = '';
  confirmPassword: string = '';
  successMessage: string = '';
  errorMessage: string = '';
  token: string = '';
  role: string = '';
  
  constructor(private route: ActivatedRoute,
    private forgetPasswordService: ForgetpasswordService,
    private router: Router){
  }

  ngOnInit(): void {
    this.route.queryParams.subscribe(params => {
      this.token = params['token'];
    });
  }

  envoiNouveauPassword(){
    this.role = "ROLE_CLIENT"
    this.forgetPasswordService.envoiNouveauPassword(this.confirmPassword, this.token).subscribe({
      next: res => {
        console.log('✅ Succès dans next:', res);
        
        let message = '';
        if (typeof res === 'string') {
          message = res;
        } else {
          message = 'Mot de passe réinitialisé avec succès';
        }
        
        this.successMessage = message + '. Redirection vers la page d\'accueil...';

        setTimeout(() => {
          this.router.navigate(['/accueil']);
        }, 2000);
      },
      error: err => {
        console.log('❌ Erreur dans error:', err);
        console.log('❌ err.status:', err.status);
        console.log('❌ err.error:', err.error);
        
        // 🔥 SOLUTION: Vérifier si c'est un faux échec (status 200 mais traité comme erreur)
        if (err.status === 200 || (err.error && typeof err.error === 'string' && err.error.includes('success'))) {
          console.log('🎉 C\'est en fait un succès !');
          
          // Traiter comme un succès
          let message = '';
          if (err.error && typeof err.error === 'string') {
            message = err.error;
          } else {
            message = 'Mot de passe réinitialisé avec succès';
          }
          
          this.successMessage = message + '. Redirection vers la page d\'accueil...';
          this.errorMessage = ''; // Effacer les erreurs
          
          setTimeout(() => {
            this.router.navigate(['/auth/client/login']);
          }, 2000);
          
          return; // Important: sortir de la fonction
        }
        
        // Vraie erreur
        if (typeof err.error === 'string') {
          this.errorMessage = err.error;
        } else if (err.error && err.error.message) {
          this.errorMessage = err.error.message;
        } else {
          this.errorMessage = 'Une erreur est survenue';
        }
      }
    });
  }
}