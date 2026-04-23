import { NgModule } from '@angular/core';
import { RouterModule, Routes } from '@angular/router';


import { ListEmpleadosComponent } from './components/list-empleados/list-empleados.component';
import { CreateEmpleadosComponent } from './components/create-empleados/create-empleados.component';
import { EditEmpleadosComponent } from './components/edit-empleados/edit-empleados.component';
import { DeleteEmpleadosComponent } from './components/delete-empleados/delete-empleados.component';
import { LoginComponent } from './pages/login/login.component';
import { DashboardComponent } from './pages/dashboard/dashboard.component';


// Definición de rutas para la aplicación
const routes: Routes = [
  { path: '', redirectTo: 'login', pathMatch: 'full' },
  { path: 'list-empleados', component: ListEmpleadosComponent },
  { path: 'create-empleados', component: CreateEmpleadosComponent },
  { path: 'edit-empleados/:id', component: EditEmpleadosComponent },  // Ruta con parámetro ID
  { path: 'delete-empleados/:id', component: DeleteEmpleadosComponent }, // Ruta con parámetro ID
  { path: 'login', component: LoginComponent },
  { path: 'dashboard', component: DashboardComponent },
  { path: '**', redirectTo: 'login', pathMatch: 'full' } // Ruta de fallback
];


@NgModule({
  imports: [RouterModule.forRoot(routes)],
  exports: [RouterModule]
})
export class AppRoutingModule { }
 