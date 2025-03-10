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
import { FournisseurDashboardComponent } from './fournisseur-dashboard/fournisseur-dashboard.component';
import { ArticleComponent } from './article/article.component';
import { CreateArticleComponent } from './article/create-article/create-article.component';
import { EditArticleComponent } from './article/edit-article/edit-article.component';
import { CreateProduitComponent } from './produit/create-produit/create-produit.component';
import { EditProduitComponent } from './produit/edit-produit/edit-produit.component';
import { ProduitComponent } from './produit/produit.component';

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


  { path: 'article', component: ArticleComponent },
  { path: 'createArticle', component: CreateArticleComponent },
  { path: 'editArticle/:id', component: EditArticleComponent },

  { path: 'produit', component: ProduitComponent },
  { path: 'createProduit', component: CreateProduitComponent },
  { path: 'editProduit/:id', component: EditProduitComponent },

];

@NgModule({
  imports: [RouterModule.forRoot(routes)],
  exports: [RouterModule]
})
export class AppRoutingModule { }
