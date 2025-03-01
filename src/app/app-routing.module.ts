import { NgModule } from '@angular/core';
import { RouterModule, Routes } from '@angular/router';

import { BannerComponent } from './components/banner/banner.component';
import { CategoriesComponent } from './components/categories/categories.component';
import { ProduitsComponent } from './components/produits/produits.component';
import { AboutComponent } from './components/about/about.component';
import { LoginFournisseurComponent } from './authentication/login-fournisseur/login-fournisseur.component';
import { LoginComponent } from './authentication/login/login.component';
import { RegisterFournisseurComponent } from './authentication/register-fournisseur/register-fournisseur.component';
import { RegisterComponent } from './authentication/register/register.component';
import { AuthenticationComponent } from './authentication/authentification.component';
import { PhotoComponent } from './photo/photo.component';
import { CreatePhotoComponent } from './photo/create-photo/create-photo.component';

const routes: Routes = [
  { path: '', component: BannerComponent },
  { path: 'accueil', component: BannerComponent },
  { path: 'categories', component: CategoriesComponent },
  { path: 'produits', component: ProduitsComponent },
  { path: 'about', component: AboutComponent },
  { path: 'photo', component: PhotoComponent },
  { path: 'createPhoto', component: CreatePhotoComponent },
  
  {
    path: 'auth', component: AuthenticationComponent, children: [
      { path: '', redirectTo: 'client/login', pathMatch: 'full' },
      { path: 'client/login', component: LoginComponent },
      { path: 'client/register', component: RegisterComponent },
      { path: 'fournisseur/login', component: LoginFournisseurComponent },
      { path: 'fournisseur/register', component: RegisterFournisseurComponent }
    ]
  },
  { path: '**', redirectTo: '', pathMatch: 'full' }
];

@NgModule({
  imports: [RouterModule.forRoot(routes)],
  exports: [RouterModule]
})
export class AppRoutingModule { }
