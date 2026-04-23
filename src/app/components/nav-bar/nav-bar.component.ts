import { Component } from '@angular/core';

@Component({
  selector: 'app-nav-bar',
  templateUrl: './nav-bar.component.html',
  styleUrl: './nav-bar.component.css'
})
export class NavBarComponent {

// Esto sirve para mostrar u ocultar el botón de login dependiendo del estado de autenticación del usuario 
userLoginOn: boolean = false;

  constructor() { }
  ngOnInit(): void {
}
}