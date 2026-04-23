import { Component } from '@angular/core';
// Importación del FormBuilder para crear formularios reactivos
import { FormBuilder } from '@angular/forms';


@Component({
  selector: 'app-login',
  templateUrl: './login.component.html',
  styleUrl: './login.component.css'
})
export class LoginComponent {

// Formulario reactivo para el login con campos de usuario y contraseña
loginForm = this.formBuilder.group({
  usuario: ['judaspriest@gmail.com'], // Campo para el nombre de usuario
  contraseña: ['']  // Campo para la contraseña
});

  // Constructor para inyectar el FormBuilder
  constructor(private formBuilder: FormBuilder) { }

}

