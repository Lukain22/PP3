import { Component } from '@angular/core';
import { ActivatedRoute, Router } from '@angular/router';

@Component({
  selector: 'app-delete-empleados',
  templateUrl: './delete-empleados.component.html',
  styleUrls: ['./delete-empleados.component.css']
})
export class DeleteEmpleadosComponent {
  empleadoId!: number;

  constructor(private route: ActivatedRoute, private router: Router) {}

  ngOnInit() {
    this.empleadoId = Number(this.route.snapshot.paramMap.get('id'));
  }

  eliminarEmpleado() {
    console.log(`Empleado con ID ${this.empleadoId} eliminado`);
    this.router.navigate(['/list-empleados']);
  }
}
