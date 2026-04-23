
import { NgModule } from '@angular/core';
import { BrowserModule } from '@angular/platform-browser';
import { FormsModule, ReactiveFormsModule } from '@angular/forms'; // Importar FormsModule para el uso de [(ngModel)]

import { AppRoutingModule } from './app-routing.module';
import { AppComponent } from './app.component';
import { CreateEmpleadosComponent } from './components/create-empleados/create-empleados.component';
import { ListEmpleadosComponent } from './components/list-empleados/list-empleados.component';
import { EditEmpleadosComponent } from './components/edit-empleados/edit-empleados.component';
import { DeleteEmpleadosComponent } from './components/delete-empleados/delete-empleados.component';
import { NavBarComponent } from './components/nav-bar/nav-bar.component';
import { HttpClientModule } from '@angular/common/http';
import { HeaderComponent } from './shared/header/header.component';
import { FooterComponent } from './shared/footer/footer.component';
import { DashboardComponent } from './pages/dashboard/dashboard.component';
import { LoginComponent } from './pages/login/login.component';

@NgModule({
  declarations: [
    AppComponent,
    CreateEmpleadosComponent,
    ListEmpleadosComponent,
    EditEmpleadosComponent, // Agregado
    DeleteEmpleadosComponent, // Agregado
    NavBarComponent, HeaderComponent, FooterComponent, DashboardComponent, LoginComponent
  ],
  imports: [
    BrowserModule,
    AppRoutingModule,
    FormsModule, // Necesario para [(ngModel)]
    HttpClientModule,
    ReactiveFormsModule
  ],
  providers: [],
  bootstrap: [AppComponent]
})
export class AppModule { }

