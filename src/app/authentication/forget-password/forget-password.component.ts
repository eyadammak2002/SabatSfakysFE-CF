import { Component } from '@angular/core';
import { User } from './user';
import { FormsModule } from '@angular/forms';
import { ForgetpasswordService } from '../forgetpassword.service';
import { CommonModule } from '@angular/common';

@Component({
  selector: 'app-forget-password',
  standalone: true,
  imports: [FormsModule, CommonModule],
  templateUrl: './forget-password.component.html',
  styleUrls: ['./forget-password.component.css']
})
export class ForgetPasswordComponent {
  user: User = new User();
  emailExists: boolean | null = null;
  isLoading: boolean = false;
  errorMessage: string = '';
  successMessage: string = '';
  
  constructor(private forgetPasswordService: ForgetpasswordService) {}
  
  findByEmail(email: string) {
    if (!email) return;
    
    this.isLoading = true;
    this.emailExists = null;
    this.errorMessage = '';
    this.successMessage = '';
    
    this.forgetPasswordService.findByEmail(email).subscribe((response: string) => {
      this.isLoading = false;

      this.successMessage=response;
    });
  }

  reinitialisation(){
    this.forgetPasswordService.reinitialisation(this.user.email).subscribe((response: string) => {
      this.isLoading = false;

      this.successMessage=response;
    })
  }
}
