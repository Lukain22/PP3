import { Component } from '@angular/core';

@Component({
  selector: 'app-edit-empleados',
  templateUrl: './edit-empleados.component.html',
  styleUrls: []
})
export class EditEmpleadosComponent {
  empleado = {
    nombre: '',
    apellido: '',
    email: ''
  };

  guardarCambios() {
    console.log("Cambios guardados", this.empleado);
    // Aquí puedes llamar al servicio para actualizar el empleado.
  }
}
