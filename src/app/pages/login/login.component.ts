import { Component } from '@angular/core';
// Importación del FormBuilder para crear formularios reactivos
import { FormBuilder, Validators } from '@angular/forms';
import { Router } from '@angular/router';

@Component({
  selector: 'app-login',
  templateUrl: './login.component.html',
  styleUrl: './login.component.css'
})
export class LoginComponent {

// Formulario reactivo para el login con campos de usuario y contraseña
loginForm = this.formBuilder.group({
  usuario: ['judaspriest@gmail.com', [Validators.required, Validators.email]], // Campo para el nombre de usuario
  contraseña: ['', Validators.required]  // Campo para la contraseña
});

  // Constructor para inyectar el FormBuilder
  constructor(private formBuilder: FormBuilder, private router: Router) { }

  //
  ngOnInit(): void {
  }

// Método para manejar el evento de inicio de sesión
login() {

  if(this.loginForm.valid) {
      console.log("Llamar al servicio de login");
      this.router.navigate(['/dashboard']);
      this.loginForm.reset(); // Limpiar el formulario después de iniciar sesión  

  }

  else{
    this.loginForm.markAllAsTouched(); // Marcar todos los campos como tocados para mostrar los errores de validación
    alert("Error al intentar iniciar sesión, formulario no válido");
  }

       }}