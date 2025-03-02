import { NgModule } from '@angular/core';
import { BrowserModule } from '@angular/platform-browser';

import { AppRoutingModule } from './app-routing.module';
import { AppComponent } from './app.component';
import { FruitsModule } from './fruits/fruits.module';
import { HttpClientModule } from '@angular/common/http';
import { CategoryModule } from './category/category.module';
import { MatToolbarModule } from '@angular/material/toolbar';
import { MatSidenavModule } from '@angular/material/sidenav';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatDividerModule } from '@angular/material/divider';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatSelectModule } from '@angular/material/select';
import { BrowserAnimationsModule } from '@angular/platform-browser/animations';
import { MatTableModule } from '@angular/material/table';
import { ReactiveFormsModule } from '@angular/forms';

// ✅ Standalone Components doivent être importés, pas déclarés
import { AuthenticationComponent } from './authentication/authentification.component';
import { LoginComponent } from './authentication/login/login.component';
import { FooterComponent } from './components/footer/footer.component';
import { HeaderComponent } from './components/header/header.component';
import { RouterModule } from '@angular/router';
import { FournisseurDashboardComponent } from './fournisseur-dashboard/fournisseur-dashboard.component';

@NgModule({
  declarations: [
    AppComponent,
    HeaderComponent,
    FooterComponent,
    FournisseurDashboardComponent 
  ],
  imports: [
    BrowserModule,
    AppRoutingModule,
    FruitsModule,
    HttpClientModule,
    CategoryModule,
    MatToolbarModule,
    MatSidenavModule,
    MatButtonModule,
    MatIconModule,
    MatDividerModule,
    MatFormFieldModule,
    MatSelectModule,
    MatTableModule,
    BrowserAnimationsModule,
    ReactiveFormsModule,
    AuthenticationComponent,  // ✅ Importé ici, pas déclaré !
    LoginComponent ,
    RouterModule,           // ✅ Importé ici aussi
  ],
  providers: [],
  bootstrap: [AppComponent]
})
export class AppModule { }
