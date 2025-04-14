import { NgModule } from '@angular/core';
import { RouterModule, Routes } from '@angular/router';

import { BannerComponent } from './components/banner/banner.component';
import { CategoriesComponent } from './components/categories/categories.component';
import { AboutComponent } from './components/about/about.component';
import { LoginFournisseurComponent } from './authentication/login-fournisseur/login-fournisseur.component';
import { LoginComponent } from './authentication/login/login.component';
import { RegisterFournisseurComponent } from './authentication/register-fournisseur/register-fournisseur.component';
import { RegisterComponent } from './authentication/register/register.component';
import { AuthenticationComponent } from './authentication/authentification.component';
import { PhotoComponent } from './photo/photo.component';
import { CreatePhotoComponent } from './photo/create-photo/create-photo.component';
import { ArticleComponent } from './article/article.component';
import { CreateArticleComponent } from './article/create-article/create-article.component';
import { EditArticleComponent } from './article/edit-article/edit-article.component';
import { CreatePackComponent } from './pack/create-pack/create-pack.component';
import { EditPackComponent } from './pack/edit-pack/edit-pack.component';
import { PackComponent } from './pack/pack.component';
import { PanierComponent } from './panier/panier.component';
import { ListArticleComponent } from './article/list-article/list-article.component';
import { CommandeComponent } from './commande/commande.component';
import { ListCommandeComponent } from './commande/list-commande/list-commande.component';
import { FileUploadComponent } from './file-upload/file-upload.component';
import { ArticleDetailComponent } from './article/article-detail/article-detail.component';

const routes: Routes = [
  { path: '', component: ListArticleComponent },
  { path: 'banner', component: BannerComponent },
  { path: 'categories', component: CategoriesComponent },
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
  { path: 'accueil', component: ListArticleComponent },
  { path: 'createArticle', component: CreateArticleComponent },
  { path: 'editArticle/:id', component: EditArticleComponent },
  { path: 'detailArticle/:id', component: ArticleDetailComponent },

  
  { path: 'pack', component: PackComponent },
  { path: 'createPack', component: CreatePackComponent },
  { path: 'editPack/:id', component: EditPackComponent },

  { path: 'panier', component: PanierComponent },
  { path: 'commande', component: CommandeComponent },
  { path: 'listCommande', component: ListCommandeComponent },

];

@NgModule({
  imports: [RouterModule.forRoot(routes)],
  exports: [RouterModule]
})
export class AppRoutingModule { }
