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
  token:string='';
  role:string='';
  constructor(private route:ActivatedRoute ,
    private forgetPasswordService: ForgetpasswordService,
    private router: Router){

  }

  ngOnInit(): void {
    
    this.route.queryParams.subscribe(params=>{this.token=params['token']});
  }

  envoiNouveauPassword(){
    this.role="ROLE_CLIENT"
    this.forgetPasswordService.envoiNouveauPassword(this.confirmPassword,this.token).subscribe({
      next: res => {
        this.successMessage = 'Mot de passe réinitialisé avec succès. Redirection vers la page de connexion...';
  
        // Redirige vers la page de login après 2 secondes
        setTimeout(() => {
          this.router.navigate(['/accueil']);
        }, 2000);
      },
      error:err=>this.errorMessage=err.error
    });
  }
}
