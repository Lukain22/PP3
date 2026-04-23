import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';

@Injectable({
  providedIn: 'root'
})
export class EmpleadoService {
  private API_URL = 'http://localhost:3000/empleados';

  constructor(private http: HttpClient) {}

  obtenerEmpleados(): Observable<any[]> {
    return this.http.get<any[]>(this.API_URL);
  }

  agregarEmpleado(empleado: any): Observable<any> {
    return this.http.post<any>(this.API_URL, empleado);
  }

  editarEmpleado(id: number, empleado: any): Observable<any> {
    return this.http.put<any>(`${this.API_URL}/${id}`, empleado);
  }

  eliminarEmpleado(id: number): Observable<any> {
    return this.http.delete<any>(`${this.API_URL}/${id}`);
  }
}
