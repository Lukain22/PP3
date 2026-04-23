import { Component } from '@angular/core';
import { Router } from '@angular/router';


@Component({
  selector: 'app-list-empleados',
  templateUrl: './list-empleados.component.html',
  styleUrls: ['./list-empleados.component.css']
})
export class ListEmpleadosComponent {
  empleados = [
    { id: 1, nombre: 'David', apellido: 'Yaps', profesion: 'Profesor' },
    { id: 2, nombre: 'María', apellido: 'Gómez', profesion: 'Ingeniera' },
   
  ];

  constructor(private router: Router) {}

  eliminarEmpleado(id: number) {
    // Aquí puedes llamar al servicio para eliminar el empleado de la base de datos
    console.log(`Empleado con ID ${id} eliminado`);

    // Simulación de eliminación en la lista local
    this.empleados = this.empleados.filter(emp => emp.id !== id);
  }
}
